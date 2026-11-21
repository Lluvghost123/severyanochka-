require('dotenv').config()
const express = require("express")
const cors = require("cors")
const {Pool} = require("pg")
const app = express()

app.use(express.json())
app.use(cors({
    origin: "http://localhost:5173",
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

// Поля карточки товара + средний рейтинг и число отзывов
const cardSql = `
    SELECT
        p.id,
        p.article,
        p.category_id,
        c.slug AS category_slug,
        p.subcategory,
        p.title,
        p.price,
        p.card_price,
        p.is_promo,
        p.is_new,
        p.in_stock,
        p.is_own,
        p.is_healthy,
        p.is_nogmo,
        p.image,
        COALESCE(ROUND(AVG(r.rating)), 0) AS rating,
        COUNT(r.id) AS reviews_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN reviews r ON r.product_id = p.id
`
const cardGroup = `GROUP BY p.id, c.slug ORDER BY p.id ASC`

// Список категорий
app.get("/api/categories", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM categories ORDER BY id")
        res.json(result.rows)
    } catch (error) {
        res.status(500).json({error: `Server error: ${error.message}`})
    }
})

// Список товаров: ?category=milk  ?promo=1  ?isNew=1  ?search=молоко  ?limit=4
app.get("/api/products", async (req, res) => {
    try {
        const params = []
        const where = []

        if (req.query.category) {
            params.push(req.query.category)
            where.push(`c.slug = $${params.length}`)
        }
        if (req.query.promo === "1") {
            where.push("p.is_promo = TRUE")
        }
        if (req.query.isNew === "1") {
            where.push("p.is_new = TRUE")
        }

        const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""
        const result = await pool.query(`${cardSql} ${whereSql} ${cardGroup}`, params)
        let products = result.rows

        // поиск делаем в JS, чтобы не зависеть от настроек регистра в базе
        if (req.query.search) {
            const text = req.query.search.toLowerCase()
            products = products.filter(p => p.title.toLowerCase().includes(text))
        }

        const limit = parseInt(req.query.limit, 10)
        if (limit > 0) {
            products = products.slice(0, limit)
        }

        res.json(products)
    } catch (error) {
        res.status(500).json({error: `Server error: ${error.message}`})
    }
})

// Подсказки для строки поиска: ?q=мол
app.get("/api/suggest", async (req, res) => {
    try {
        const text = (req.query.q || "").toLowerCase()
        if (text.length < 2) {
            return res.json([])
        }
        const categories = await pool.query("SELECT slug, title FROM categories")
        const products = await pool.query("SELECT title FROM products")

        const foundCategories = categories.rows
            .filter(c => c.title.toLowerCase().includes(text))
            .slice(0, 2)
            .map(c => ({type: "category", slug: c.slug, title: c.title}))
        const foundProducts = products.rows
            .filter(p => p.title.toLowerCase().includes(text))
            .slice(0, 4)
            .map(p => ({type: "product", title: p.title}))

        res.json([...foundCategories, ...foundProducts])
    } catch (error) {
        res.status(500).json({error: `Server error: ${error.message}`})
    }
})

// Один товар: сам товар, отзывы, похожие товары
app.get("/api/products/:id", async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10)
        if (isNaN(productId)) {
            return res.status(400).json({error: "Invalid product ID"})
        }

        const result = await pool.query(`
            SELECT p.*, c.slug AS category_slug, c.title AS category_title
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1
        `, [productId])

        if (result.rows.length === 0) {
            return res.status(404).json({error: "Product not found"})
        }
        const product = result.rows[0]

        const reviews = await pool.query(
            "SELECT id, author, rating, text, created_at FROM reviews WHERE product_id = $1 ORDER BY id DESC",
            [productId]
        )
        product.reviews = reviews.rows

        const similar = await pool.query(
            `${cardSql} WHERE p.category_id = $1 AND p.id <> $2 GROUP BY p.id, c.slug ORDER BY p.id ASC LIMIT 4`,
            [product.category_id, productId]
        )
        product.similar = similar.rows

        res.json(product)
    } catch (error) {
        res.status(500).json({error: `Server error: ${error.message}`})
    }
})

// Добавить отзыв
app.post("/api/reviews", async (req, res) => {
    try {
        const {product_id, author, rating, text} = req.body
        const result = await pool.query(
            "INSERT INTO reviews (product_id, author, rating, text) VALUES ($1, $2, $3, $4) RETURNING *",
            [product_id, author, rating, text]
        )
        res.json(result.rows[0])
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

// Вход по номеру телефона
app.post("/api/login", async (req, res) => {
    try {
        const {phone} = req.body
        const result = await pool.query("SELECT * FROM users WHERE phone = $1", [phone])
        if (result.rows.length === 0) {
            return res.status(404).json({error: "Пользователь не найден. Пройдите регистрацию"})
        }
        res.json(result.rows[0])
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

// Регистрация
app.post("/api/register", async (req, res) => {
    try {
        const {phone, name} = req.body
        const exists = await pool.query("SELECT id FROM users WHERE phone = $1", [phone])
        if (exists.rows.length > 0) {
            return res.status(400).json({error: "Этот номер уже зарегистрирован"})
        }
        const result = await pool.query(
            "INSERT INTO users (phone, name) VALUES ($1, $2) RETURNING *",
            [phone, name]
        )
        res.json(result.rows[0])
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})
