require('dotenv').config()
const express = require("express")
const cors = require("cors")
const {Pool} = require("pg")
const app = express()

app.use(express.json())
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}))

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

const PORT = 3000

// ---------------------------------------------------------------
//  Общие куски SQL: карточка товара (то, что рисуется в сетках)
// ---------------------------------------------------------------
const CARD_FIELDS = `
    p.id,
    p.article,
    p.title,
    p.price::float8                                   AS price,
    p.card_price::float8                              AS card_price,
    CASE WHEN p.is_promo AND p.card_price IS NOT NULL
         THEN ROUND((1 - p.card_price / p.price) * 100)::int END AS discount,
    p.is_promo,
    p.is_new,
    p.in_stock,
    p.images[1]                                       AS image,
    c.slug                                            AS category_slug,
    c.title                                           AS category_title,
    COALESCE(r.rating, 0)::float8                     AS rating,
    COALESCE(r.cnt, 0)::int                           AS reviews_count
`
const CARD_FROM = `
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN LATERAL (
        SELECT ROUND(AVG(rating) * 2) / 2 AS rating, COUNT(*) AS cnt
        FROM reviews WHERE product_id = p.id
    ) r ON TRUE
`
const EFFECTIVE_PRICE = `COALESCE(p.card_price, p.price)`

// шаблон для LIKE: экранируем служебные символы, ищем вхождение
const likePattern = (text) => `%${String(text).trim().replace(/[\\%_]/g, "\\$&")}%`

// ---------------------------------------------------------------
//  Авторизация: токен из таблицы sessions (Authorization: Bearer ...)
// ---------------------------------------------------------------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function loadUser(req, res, next) {
    req.user = null
    const header = req.headers.authorization || ""
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : ""
    if (UUID_RE.test(token)) {
        const result = await pool.query(
            `SELECT u.id, u.phone, u.name, u.avatar, u.has_card, u.bonus
             FROM sessions s JOIN users u ON u.id = s.user_id
             WHERE s.token = $1`, [token])
        req.user = result.rows[0] || null
        req.token = token
    }
    next()
}

function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({error: "Необходимо войти"})
    next()
}

app.use(loadUser)

function normalizePhone(raw) {
    let digits = String(raw || "").replace(/\D/g, "")
    if (digits.length === 11 && digits[0] === "8") digits = "7" + digits.slice(1)
    if (digits.length === 10) digits = "7" + digits
    if (digits.length !== 11 || digits[0] !== "7") return null
    return "+" + digits
}

async function startSession(userId) {
    const result = await pool.query(
        "INSERT INTO sessions (user_id) VALUES ($1) RETURNING token", [userId])
    return result.rows[0].token
}

app.get("/api/health", (req, res) => res.json({ok: true}))

// ---------------------------------------------------------------
//  Авторизация
// ---------------------------------------------------------------
app.post("/api/auth/login", async (req, res) => {
    const phone = normalizePhone(req.body.phone)
    if (!phone) return res.status(400).json({error: "Введите номер телефона полностью"})
    const result = await pool.query(
        "SELECT id, phone, name, avatar, has_card, bonus FROM users WHERE phone = $1", [phone])
    if (result.rows.length === 0) {
        return res.status(404).json({error: "Пользователь не найден. Пройдите регистрацию"})
    }
    const token = await startSession(result.rows[0].id)
    res.json({token, user: result.rows[0]})
})

app.post("/api/auth/register", async (req, res) => {
    const phone = normalizePhone(req.body.phone)
    const name = String(req.body.name || "").trim().slice(0, 60)
    if (!phone) return res.status(400).json({error: "Введите номер телефона полностью"})
    if (name.length < 2) return res.status(400).json({error: "Введите имя"})
    const exists = await pool.query("SELECT 1 FROM users WHERE phone = $1", [phone])
    if (exists.rows.length > 0) return res.status(409).json({error: "Этот номер уже зарегистрирован"})
    const created = await pool.query(
        `INSERT INTO users (phone, name, bonus) VALUES ($1, $2, 100)
         RETURNING id, phone, name, avatar, has_card, bonus`, [phone, name])
    const token = await startSession(created.rows[0].id)
    res.status(201).json({token, user: created.rows[0]})
})

app.get("/api/auth/me", requireAuth, async (req, res) => {
    res.json({user: req.user})
})

app.post("/api/auth/logout", requireAuth, async (req, res) => {
    await pool.query("DELETE FROM sessions WHERE token = $1", [req.token])
    res.json({ok: true})
})

// ---------------------------------------------------------------
//  Категории
// ---------------------------------------------------------------
app.get("/api/categories", async (req, res) => {
    const result = await pool.query(`
        SELECT c.id, c.slug, c.title, c.image, c.sort_order, c.menu_order,
               COALESCE(json_agg(json_build_object('id', s.id, 'slug', s.slug, 'title', s.title)
                                 ORDER BY s.id) FILTER (WHERE s.id IS NOT NULL), '[]'::json) AS subcategories
        FROM categories c
        LEFT JOIN subcategories s ON s.category_id = c.id
        GROUP BY c.id
        ORDER BY c.sort_order`)
    res.json(result.rows)
})

// ---------------------------------------------------------------
//  Список товаров: категория, фильтры, поиск, пагинация
//  /api/products?category=milk&sub=milk,cheese&min=10&max=500&inStock=1
//                &tags=own,nogmo&promo=1&isNew=1&q=молоко&page=1&limit=6
// ---------------------------------------------------------------
app.get("/api/products", async (req, res) => {
    const {category, sub, min, max, inStock, tags, promo, isNew, q, sort} = req.query
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 60)
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)

    const params = []
    const where = []
    const add = (value) => { params.push(value); return `$${params.length}` }

    // базовые условия (по ним считается диапазон цен для ползунка)
    if (category) where.push(`c.slug = ${add(category)}`)
    if (q && String(q).trim()) {
        const like = `ru_lower(${add(likePattern(q))})`
        where.push(`(ru_lower(p.title) LIKE ${like} OR ru_lower(p.brand) LIKE ${like} OR ru_lower(c.title) LIKE ${like})`)
    }
    if (promo === "1") where.push("p.is_promo = TRUE")
    if (isNew === "1") where.push("p.is_new = TRUE")
    const baseWhere = [...where]
    const baseParams = [...params]

    if (sub) {
        const slugs = String(sub).split(",").filter(Boolean)
        if (slugs.length) where.push(`EXISTS (SELECT 1 FROM subcategories sc WHERE sc.id = p.subcategory_id AND sc.slug = ANY(${add(slugs)}::text[]))`)
    }
    if (min !== undefined && min !== "" && !isNaN(Number(min))) where.push(`${EFFECTIVE_PRICE} >= ${add(Number(min))}`)
    if (max !== undefined && max !== "" && !isNaN(Number(max))) where.push(`${EFFECTIVE_PRICE} <= ${add(Number(max))}`)
    if (inStock === "1") where.push("p.in_stock = TRUE")
    if (tags) {
        const list = String(tags).split(",").filter(Boolean)
        if (list.length) where.push(`p.tags @> ${add(list)}::text[]`)
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""
    const orderBy = {
        price_asc: `${EFFECTIVE_PRICE} ASC, p.id`,
        price_desc: `${EFFECTIVE_PRICE} DESC, p.id`,
        new: `p.created_at DESC, p.id DESC`
    }[sort] || "p.id ASC"

    const total = await pool.query(
        `SELECT COUNT(*)::int AS n FROM products p JOIN categories c ON c.id = p.category_id ${whereSql}`, params)

    const itemsParams = [...params, limit, (page - 1) * limit]
    const items = await pool.query(
        `SELECT ${CARD_FIELDS} ${CARD_FROM} ${whereSql}
         ORDER BY ${orderBy}
         LIMIT $${itemsParams.length - 1} OFFSET $${itemsParams.length}`, itemsParams)

    const baseSql = baseWhere.length ? `WHERE ${baseWhere.join(" AND ")}` : ""
    const range = await pool.query(
        `SELECT COALESCE(FLOOR(MIN(${EFFECTIVE_PRICE})), 0)::int AS min,
                COALESCE(CEIL(MAX(${EFFECTIVE_PRICE})), 0)::int  AS max
         FROM products p JOIN categories c ON c.id = p.category_id ${baseSql}`, baseParams)

    res.json({
        items: items.rows,
        total: total.rows[0].n,
        page,
        pages: Math.max(Math.ceil(total.rows[0].n / limit), 1),
        priceRange: range.rows[0]
    })
})

// ---------------------------------------------------------------
//  Подсказки поиска
// ---------------------------------------------------------------
app.get("/api/search/suggest", async (req, res) => {
    const q = String(req.query.q || "").trim()
    if (q.length < 2) return res.json([])
    const like = likePattern(q)

    const cats = await pool.query(
        "SELECT slug, title FROM categories WHERE ru_lower(title) LIKE ru_lower($1) ORDER BY sort_order LIMIT 2", [like])
    const prods = await pool.query(
        "SELECT title FROM products WHERE ru_lower(title) LIKE ru_lower($1) OR ru_lower(brand) LIKE ru_lower($1) ORDER BY id LIMIT 60", [like])

    const lowered = q.toLowerCase()
    const phrases = []
    const seen = new Set()
    for (const row of prods.rows) {
        const words = row.title.replace(/[,()]/g, " ").split(/\s+/).filter(Boolean)
        const idx = words.findIndex(w => w.toLowerCase().startsWith(lowered))
        if (idx === -1) continue
        const phrase = idx === 0 ? words[0] : `${words[0]} ${words[idx]}`
        const key = phrase.toLowerCase()
        if (!seen.has(key)) { seen.add(key); phrases.push(phrase) }
        if (phrases.length >= 4) break
    }

    res.json([
        ...cats.rows.map(c => ({type: "category", title: c.title, slug: c.slug})),
        ...phrases.map(title => ({type: "query", title}))
    ])
})

// ---------------------------------------------------------------
//  Страница товара
// ---------------------------------------------------------------
app.get("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({error: "Некорректный id товара"})

    const result = await pool.query(`
        SELECT p.id, p.article, p.title, p.description, p.price::float8 AS price,
               p.card_price::float8 AS card_price,
               CASE WHEN p.is_promo AND p.card_price IS NOT NULL
                    THEN ROUND((1 - p.card_price / p.price) * 100)::int END AS discount,
               p.is_promo, p.is_new, p.in_stock, p.brand, p.country, p.package, p.bonus,
               p.images, p.tags, p.related_ids, p.specs,
               c.slug AS category_slug, c.title AS category_title,
               sc.slug AS subcategory_slug, sc.title AS subcategory_title,
               COALESCE(r.rating, 0)::float8 AS rating, COALESCE(r.cnt, 0)::int AS reviews_count
        FROM products p
        JOIN categories c ON c.id = p.category_id
        LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
        LEFT JOIN LATERAL (
            SELECT ROUND(AVG(rating) * 2) / 2 AS rating, COUNT(*) AS cnt
            FROM reviews WHERE product_id = p.id
        ) r ON TRUE
        WHERE p.id = $1`, [id])
    if (result.rows.length === 0) return res.status(404).json({error: "Товар не найден"})
    const product = result.rows[0]

    const avg = await pool.query(
        "SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float8 AS avg FROM reviews WHERE product_id = $1", [id])
    const distribution = await pool.query(
        `SELECT g AS stars, COUNT(r.id)::int AS count
         FROM generate_series(5, 1, -1) g
         LEFT JOIN reviews r ON r.product_id = $1 AND r.rating = g
         GROUP BY g ORDER BY g DESC`, [id])
    const reviews = await pool.query(
        `SELECT id, author, rating, text, created_at FROM reviews
         WHERE product_id = $1 ORDER BY created_at DESC, id DESC LIMIT 30`, [id])

    // «Похожие» — той же категории, сначала той же подкатегории
    const similar = await pool.query(
        `SELECT ${CARD_FIELDS} ${CARD_FROM}
         WHERE p.category_id = (SELECT category_id FROM products WHERE id = $1) AND p.id <> $1
         ORDER BY (p.subcategory_id IS NOT DISTINCT FROM (SELECT subcategory_id FROM products WHERE id = $1)) DESC, p.id
         LIMIT 4`, [id])

    // «С этим товаром покупают» — массив related_ids, порядок сохраняем
    const related = product.related_ids.length === 0 ? {rows: []} : await pool.query(
        `SELECT ${CARD_FIELDS} ${CARD_FROM}
         WHERE p.id = ANY($1::int[])
         ORDER BY array_position($1::int[], p.id)`, [product.related_ids])

    let priceAlert = false
    if (req.user) {
        const alert = await pool.query(
            "SELECT 1 FROM price_alerts WHERE user_id = $1 AND product_id = $2", [req.user.id, id])
        priceAlert = alert.rows.length > 0
    }

    res.json({
        ...product,
        rating_avg: avg.rows[0].avg,
        distribution: distribution.rows,
        reviews: reviews.rows,
        similar: similar.rows,
        related: related.rows,
        price_alert: priceAlert
    })
})

app.post("/api/products/:id/reviews", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id, 10)
    const rating = parseInt(req.body.rating, 10)
    const text = String(req.body.text || "").trim()
    if (isNaN(id)) return res.status(400).json({error: "Некорректный id товара"})
    if (!(rating >= 1 && rating <= 5)) return res.status(400).json({error: "Поставьте оценку от 1 до 5"})
    if (text.length < 3) return res.status(400).json({error: "Напишите отзыв"})
    if (text.length > 2000) return res.status(400).json({error: "Слишком длинный отзыв"})
    const exists = await pool.query("SELECT 1 FROM products WHERE id = $1", [id])
    if (exists.rows.length === 0) return res.status(404).json({error: "Товар не найден"})
    const result = await pool.query(
        `INSERT INTO reviews (product_id, user_id, author, rating, text)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, author, rating, text, created_at`,
        [id, req.user.id, req.user.name, rating, text])
    res.status(201).json(result.rows[0])
})

app.post("/api/products/:id/price-alert", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({error: "Некорректный id товара"})
    const del = await pool.query(
        "DELETE FROM price_alerts WHERE user_id = $1 AND product_id = $2", [req.user.id, id])
    if (del.rowCount > 0) return res.json({active: false})
    await pool.query("INSERT INTO price_alerts (user_id, product_id) VALUES ($1, $2)", [req.user.id, id])
    res.json({active: true})
})

// ---------------------------------------------------------------
//  Избранное
// ---------------------------------------------------------------
app.get("/api/favorites", requireAuth, async (req, res) => {
    const result = await pool.query(
        `SELECT ${CARD_FIELDS} ${CARD_FROM}
         JOIN favorites f ON f.product_id = p.id AND f.user_id = $1
         ORDER BY f.created_at DESC`, [req.user.id])
    res.json(result.rows)
})

app.put("/api/favorites/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({error: "Некорректный id товара"})
    await pool.query(
        "INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [req.user.id, id])
    res.json({ok: true})
})

app.delete("/api/favorites/:id", requireAuth, async (req, res) => {
    await pool.query("DELETE FROM favorites WHERE user_id = $1 AND product_id = $2",
        [req.user.id, parseInt(req.params.id, 10)])
    res.json({ok: true})
})

// ---------------------------------------------------------------
//  Корзина
// ---------------------------------------------------------------
async function readCart(userId) {
    const result = await pool.query(
        `SELECT ${CARD_FIELDS}, ci.quantity, p.bonus
         ${CARD_FROM}
         JOIN cart_items ci ON ci.product_id = p.id AND ci.user_id = $1
         ORDER BY p.id`, [userId])
    const items = result.rows
    const total = items.reduce((sum, i) => sum + (i.card_price ?? i.price) * i.quantity, 0)
    const bonus = items.reduce((sum, i) => sum + i.bonus * i.quantity, 0)
    const count = items.reduce((sum, i) => sum + i.quantity, 0)
    return {items, total: Math.round(total * 100) / 100, bonus, count}
}

// краткое состояние для шапки и карточек: id избранного и количество в корзине
app.get("/api/me/state", requireAuth, async (req, res) => {
    const favorites = await pool.query("SELECT product_id FROM favorites WHERE user_id = $1", [req.user.id])
    const cart = await pool.query("SELECT product_id, quantity FROM cart_items WHERE user_id = $1", [req.user.id])
    res.json({
        favorites: favorites.rows.map(r => r.product_id),
        cart: cart.rows
    })
})

app.get("/api/cart", requireAuth, async (req, res) => {
    res.json(await readCart(req.user.id))
})

app.put("/api/cart/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id, 10)
    const quantity = parseInt(req.body.quantity, 10)
    if (isNaN(id) || isNaN(quantity) || quantity < 0) return res.status(400).json({error: "Некорректные данные"})
    if (quantity === 0) {
        await pool.query("DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2", [req.user.id, id])
    } else {
        const product = await pool.query("SELECT in_stock FROM products WHERE id = $1", [id])
        if (product.rows.length === 0) return res.status(404).json({error: "Товар не найден"})
        if (!product.rows[0].in_stock) return res.status(409).json({error: "Товара нет в наличии"})
        await pool.query(
            `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)
             ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
            [req.user.id, id, Math.min(quantity, 99)])
    }
    res.json({ok: true})
})

app.delete("/api/cart", requireAuth, async (req, res) => {
    await pool.query("DELETE FROM cart_items WHERE user_id = $1", [req.user.id])
    res.json({ok: true})
})

// ---------------------------------------------------------------
//  Заказы
// ---------------------------------------------------------------
app.get("/api/orders", requireAuth, async (req, res) => {
    const result = await pool.query(
        `SELECT o.id, o.status, o.total::float8 AS total, o.address, o.created_at,
                COALESCE(json_agg(json_build_object(
                    'product_id', i.product_id, 'title', i.title,
                    'price', i.price::float8, 'quantity', i.quantity,
                    'image', p.images[1]) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]'::json) AS items
         FROM orders o
         LEFT JOIN order_items i ON i.order_id = o.id
         LEFT JOIN products p ON p.id = i.product_id
         WHERE o.user_id = $1
         GROUP BY o.id
         ORDER BY o.created_at DESC, o.id DESC`, [req.user.id])
    res.json(result.rows)
})

app.post("/api/orders", requireAuth, async (req, res) => {
    const address = String(req.body.address || "").trim()
    if (address.length < 5) return res.status(400).json({error: "Укажите адрес доставки"})

    const client = await pool.connect()
    try {
        await client.query("BEGIN")
        const cart = await client.query(
            `SELECT p.id, p.title, p.bonus, ${EFFECTIVE_PRICE}::float8 AS price, ci.quantity
             FROM cart_items ci JOIN products p ON p.id = ci.product_id
             WHERE ci.user_id = $1`, [req.user.id])
        if (cart.rows.length === 0) {
            await client.query("ROLLBACK")
            return res.status(400).json({error: "Корзина пуста"})
        }
        const total = cart.rows.reduce((s, i) => s + i.price * i.quantity, 0)
        const bonus = cart.rows.reduce((s, i) => s + i.bonus * i.quantity, 0)
        const order = await client.query(
            `INSERT INTO orders (user_id, status, total, address) VALUES ($1, 'new', $2, $3) RETURNING id`,
            [req.user.id, Math.round(total * 100) / 100, address])
        for (const item of cart.rows) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, title, price, quantity) VALUES ($1, $2, $3, $4, $5)`,
                [order.rows[0].id, item.id, item.title, item.price, item.quantity])
        }
        await client.query("DELETE FROM cart_items WHERE user_id = $1", [req.user.id])
        await client.query("UPDATE users SET bonus = bonus + $2 WHERE id = $1", [req.user.id, bonus])
        await client.query("COMMIT")
        res.status(201).json({id: order.rows[0].id, total, bonus})
    } catch (error) {
        await client.query("ROLLBACK")
        throw error
    } finally {
        client.release()
    }
})

// «Покупали раньше»: товары из прошлых заказов пользователя
app.get("/api/me/bought", requireAuth, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 4, 20)
    const result = await pool.query(
        `SELECT ${CARD_FIELDS} ${CARD_FROM}
         JOIN (SELECT i.product_id, MAX(o.created_at) AS last_order
               FROM order_items i JOIN orders o ON o.id = i.order_id
               WHERE o.user_id = $1 AND i.product_id IS NOT NULL
               GROUP BY i.product_id) h ON h.product_id = p.id
         ORDER BY h.last_order DESC, p.id
         LIMIT $2`, [req.user.id, limit])
    res.json(result.rows)
})

// ---------------------------------------------------------------
//  Контент главной страницы
// ---------------------------------------------------------------
app.get("/api/home", async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 4, 12)
    const promo = await pool.query(
        `SELECT ${CARD_FIELDS} ${CARD_FROM} WHERE p.is_promo = TRUE ORDER BY p.id LIMIT $1`, [limit])
    const news = await pool.query(
        `SELECT ${CARD_FIELDS} ${CARD_FROM} WHERE p.is_new = TRUE ORDER BY (p.images[1] LIKE '%/photo\\_%'), p.id DESC LIMIT $1`, [limit])
    const offers = await pool.query("SELECT id, title, text, variant FROM special_offers ORDER BY sort_order")
    res.json({promo: promo.rows, news: news.rows, offers: offers.rows})
})

app.get("/api/stores", async (req, res) => {
    const result = await pool.query(
        `SELECT id, district, address, phone, hours, map_x::float8 AS map_x, map_y::float8 AS map_y
         FROM stores ORDER BY id`)
    res.json(result.rows)
})

app.get("/api/articles", async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 3, 20)
    const result = await pool.query(
        "SELECT id, title, preview, image, published_at FROM articles ORDER BY published_at DESC, id LIMIT $1", [limit])
    res.json(result.rows)
})

// ---------------------------------------------------------------
app.use((error, req, res, next) => {
    console.error(error)
    res.status(500).json({error: `Server error: ${error.message}`})
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
