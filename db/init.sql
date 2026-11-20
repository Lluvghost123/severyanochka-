-- ============================================================
--  Лукошко — интернет-магазин продуктов. PostgreSQL.
--  Запуск: DBeaver -> открыть файл -> Alt+X (Execute script)
--  или автоматически через docker-compose (db/init.sql).
-- ============================================================

-- Нижний регистр для кириллицы не зависит от локали базы (поиск без учёта регистра)
CREATE OR REPLACE FUNCTION ru_lower(text) RETURNS text AS $$
    SELECT translate($1, 'ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
                         'abcdefghijklmnopqrstuvwxyzабвгдеёжзийклмнопрстуфхцчшщъыьэюя')
$$ LANGUAGE sql IMMUTABLE;

DROP TABLE IF EXISTS price_alerts, order_items, orders, cart_items, favorites, reviews,
                     sessions, users, products, subcategories, categories,
                     stores, articles, special_offers CASCADE;

-- ---------- Категории и подкатегории ----------
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    slug        VARCHAR(50)  NOT NULL UNIQUE,
    title       VARCHAR(100) NOT NULL,
    image       VARCHAR(255) NOT NULL,
    sort_order  INT NOT NULL,            -- порядок плиток на странице «Каталог»
    menu_order  INT NOT NULL             -- порядок в выпадающем меню
);

CREATE TABLE subcategories (
    id           SERIAL PRIMARY KEY,
    category_id  INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    slug         VARCHAR(50)  NOT NULL,
    title        VARCHAR(100) NOT NULL,
    UNIQUE (category_id, slug)
);

-- ---------- Товары (массивы: images, tags, related_ids; JSONB: specs) ----------
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    article         INT UNIQUE NOT NULL,
    category_id     INT NOT NULL REFERENCES categories(id),
    subcategory_id  INT REFERENCES subcategories(id),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL CHECK (price > 0),   -- обычная цена
    card_price      NUMERIC(10,2) CHECK (card_price > 0),       -- цена по карте
    is_promo        BOOLEAN NOT NULL DEFAULT FALSE,             -- участвует в акции
    is_new          BOOLEAN NOT NULL DEFAULT FALSE,             -- новинка
    in_stock        BOOLEAN NOT NULL DEFAULT TRUE,
    brand           VARCHAR(100),
    country         VARCHAR(100),
    package         VARCHAR(50),
    bonus           INT NOT NULL DEFAULT 0,                     -- бонусы за покупку
    images          TEXT[]  NOT NULL DEFAULT '{}',              -- галерея, [1] — превью
    tags            TEXT[]  NOT NULL DEFAULT '{}',              -- own / healthy / nogmo
    related_ids     INT[]   NOT NULL DEFAULT '{}',              -- «С этим товаром покупают»
    specs           JSONB   NOT NULL DEFAULT '{}'::jsonb,       -- доп. характеристики
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON products (category_id);
CREATE INDEX products_tags_idx     ON products USING GIN (tags);

-- ---------- Пользователи ----------
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    phone       VARCHAR(20) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    avatar      VARCHAR(255),
    has_card    BOOLEAN NOT NULL DEFAULT TRUE,
    bonus       INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    token       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
    id          SERIAL PRIMARY KEY,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     INT REFERENCES users(id) ON DELETE SET NULL,
    author      VARCHAR(100) NOT NULL,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text        TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX reviews_product_idx ON reviews (product_id);

CREATE TABLE favorites (
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, product_id)
);

CREATE TABLE cart_items (
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INT NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (user_id, product_id)
);

CREATE TABLE price_alerts (
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, product_id)
);

CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status      VARCHAR(20) NOT NULL DEFAULT 'new',   -- new / assembling / delivered
    total       NUMERIC(10,2) NOT NULL,
    address     TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
    id          SERIAL PRIMARY KEY,
    order_id    INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  INT REFERENCES products(id) ON DELETE SET NULL,
    title       VARCHAR(255) NOT NULL,
    price       NUMERIC(10,2) NOT NULL,
    quantity    INT NOT NULL CHECK (quantity > 0)
);

-- ---------- Контент главной страницы ----------
CREATE TABLE stores (
    id       SERIAL PRIMARY KEY,
    district VARCHAR(100) NOT NULL,        -- вкладка
    address  VARCHAR(255) NOT NULL,
    phone    VARCHAR(30),
    hours    VARCHAR(100),
    map_x    NUMERIC(5,2) NOT NULL,        -- положение пина на карте, %
    map_y    NUMERIC(5,2) NOT NULL
);

CREATE TABLE articles (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    preview       TEXT NOT NULL,
    image         VARCHAR(255) NOT NULL,
    published_at  DATE NOT NULL
);

CREATE TABLE special_offers (
    id        SERIAL PRIMARY KEY,
    title     VARCHAR(255) NOT NULL,
    text      TEXT NOT NULL,
    variant   VARCHAR(20) NOT NULL,        -- peach / green
    sort_order INT NOT NULL
);


-- ================= ДАННЫЕ =================

INSERT INTO categories (slug, title, image, sort_order, menu_order) VALUES
  ('milk', 'Молоко, сыр, яйцо', '/images/categories/cat_milk.jpg', 1, 1),
  ('bread', 'Хлеб', '/images/categories/cat_bread.jpg', 2, 2),
  ('fruits', 'Фрукты и овощи', '/images/categories/cat_fruits.jpg', 3, 3),
  ('frozen', 'Замороженные продукты', '/images/categories/cat_frozen.jpg', 4, 4),
  ('drinks', 'Напитки', '/images/categories/cat_drinks.jpg', 5, 5),
  ('sweets', 'Кондитерские изделия', '/images/categories/cat_sweets.jpg', 6, 6),
  ('tea', 'Чай, кофе', '/images/categories/cat_tea.jpg', 7, 7),
  ('grocery', 'Бакалея', '/images/categories/cat_grocery.jpg', 8, 8),
  ('healthy', 'Здоровое питание', '/images/categories/cat_healthy.jpg', 9, 9),
  ('pets', 'Зоотовары', '/images/categories/cat_pets.jpg', 10, 10),
  ('baby', 'Детское питание', '/images/categories/cat_baby.jpg', 11, 12),
  ('meat', 'Мясо, птица, колбаса', '/images/categories/cat_meat.jpg', 12, 13),
  ('household', 'Непродовольственные товары', '/images/categories/cat_household.jpg', 13, 11);

INSERT INTO subcategories (category_id, slug, title) VALUES
  ((SELECT id FROM categories WHERE slug='milk'), 'milk', 'Молоко'),
  ((SELECT id FROM categories WHERE slug='milk'), 'cheese', 'Сыр'),
  ((SELECT id FROM categories WHERE slug='milk'), 'butter', 'Масло и сливки'),
  ((SELECT id FROM categories WHERE slug='milk'), 'yogurt', 'Йогурты'),
  ((SELECT id FROM categories WHERE slug='milk'), 'eggs', 'Яйцо'),
  ((SELECT id FROM categories WHERE slug='bread'), 'bread', 'Хлеб'),
  ((SELECT id FROM categories WHERE slug='bread'), 'pastry', 'Выпечка'),
  ((SELECT id FROM categories WHERE slug='fruits'), 'fruits', 'Фрукты'),
  ((SELECT id FROM categories WHERE slug='fruits'), 'veg', 'Овощи'),
  ((SELECT id FROM categories WHERE slug='frozen'), 'ready', 'Готовые блюда'),
  ((SELECT id FROM categories WHERE slug='frozen'), 'veg', 'Овощи и ягоды'),
  ((SELECT id FROM categories WHERE slug='drinks'), 'soda', 'Газированные напитки'),
  ((SELECT id FROM categories WHERE slug='drinks'), 'tea', 'Холодный чай'),
  ((SELECT id FROM categories WHERE slug='sweets'), 'candy', 'Конфеты'),
  ((SELECT id FROM categories WHERE slug='sweets'), 'gummy', 'Мармелад'),
  ((SELECT id FROM categories WHERE slug='tea'), 'tea', 'Чай'),
  ((SELECT id FROM categories WHERE slug='tea'), 'coffee', 'Кофе'),
  ((SELECT id FROM categories WHERE slug='grocery'), 'pasta', 'Макароны'),
  ((SELECT id FROM categories WHERE slug='grocery'), 'cereal', 'Крупы'),
  ((SELECT id FROM categories WHERE slug='healthy'), 'fish', 'Рыба'),
  ((SELECT id FROM categories WHERE slug='healthy'), 'super', 'Суперфуды'),
  ((SELECT id FROM categories WHERE slug='pets'), 'dogs', 'Для собак'),
  ((SELECT id FROM categories WHERE slug='pets'), 'cats', 'Для кошек'),
  ((SELECT id FROM categories WHERE slug='baby'), 'puree', 'Пюре'),
  ((SELECT id FROM categories WHERE slug='baby'), 'porridge', 'Каши'),
  ((SELECT id FROM categories WHERE slug='meat'), 'sausage', 'Колбасы'),
  ((SELECT id FROM categories WHERE slug='meat'), 'sausages', 'Сосиски'),
  ((SELECT id FROM categories WHERE slug='meat'), 'ham', 'Ветчина'),
  ((SELECT id FROM categories WHERE slug='meat'), 'poultry', 'Птица'),
  ((SELECT id FROM categories WHERE slug='household'), 'clean', 'Уборка'),
  ((SELECT id FROM categories WHERE slug='household'), 'dish', 'Мытьё посуды');

INSERT INTO products (article, category_id, subcategory_id, title, description, price, card_price, is_promo, is_new, in_stock, brand, country, package, bonus, images, tags, specs) VALUES
  (372001, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='cheese'), 'Сыр мягкий Dorblu с голубой плесенью, 150 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 139.99, NULL, FALSE, FALSE, TRUE, 'Dorblu', 'Германия', '150 г', 4, ARRAY['/images/products/dorblu.png']::text[], ARRAY[]::text[], '{"Упаковка": "150 г"}'::jsonb),
  (372002, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='milk'), 'Молоко ПРОСТОКВАШИНО паст. питьевое цельное отборное 3,4-4,5%, 930 мл', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 140.5, 69.99, TRUE, FALSE, TRUE, 'ПРОСТОКВАШИНО', 'Россия', '930 мл', 5, ARRAY['/images/products/milk.png']::text[], ARRAY['nogmo']::text[], '{"Упаковка": "930 мл"}'::jsonb),
  (372003, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='milk'), 'Молоко сгущённое РОГАЧЁВ Егорка, цельное с сахаром 8,5%, 360 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 168.5, 77.99, TRUE, FALSE, TRUE, 'РОГАЧЁВ', 'Беларусь', '360 г', 6, ARRAY['/images/products/condensed.png']::text[], ARRAY[]::text[], '{"Упаковка": "360 г"}'::jsonb),
  (371431, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='butter'), 'Масло ПРОСТОКВАШИНО сливочное в/с 82% фольга без змж, Россия, 180 г', 'Сливочное масло высшего сорта с массовой долей жира 82%. Натуральная вкуснятина для бутербродов, выпечки и каш. Хранить при температуре от 0 до +6 °C.', 192.69, 108.99, TRUE, FALSE, TRUE, 'ПРОСТОКВАШИНО', 'Россия', '180 г', 10, ARRAY['/images/products/butter_big.png', '/images/products/butter.png']::text[], ARRAY['nogmo']::text[], '{"Упаковка": "180 г"}'::jsonb),
  (372005, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='yogurt'), 'Йогурт Fruttis Сливочное лакомство 5% персик-маракуйя, 4×115 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 29.99, NULL, FALSE, FALSE, TRUE, 'Fruttis', 'Россия', '460 г', 1, ARRAY['/images/products/fruttis1.png']::text[], ARRAY[]::text[], '{"Упаковка": "460 г"}'::jsonb),
  (372006, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='yogurt'), 'Йогурт Fruttis Сливочное лакомство 5% вишня-черника, 4×115 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 29.99, NULL, FALSE, FALSE, TRUE, 'Fruttis', 'Россия', '460 г', 1, ARRAY['/images/products/fruttis2.png']::text[], ARRAY[]::text[], '{"Упаковка": "460 г"}'::jsonb),
  (372007, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='milk'), 'Молоко питьевое Лукошко пастеризованное 3,2%, 1 л', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 89.9, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Россия', '1 л', 3, ARRAY['/images/products/milk.png']::text[], ARRAY['own', 'nogmo', 'healthy']::text[], '{"Упаковка": "1 л"}'::jsonb),
  (372008, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='milk'), 'Кефир Лукошко 2,5%, 900 мл', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 74.9, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Россия', '900 мл', 2, ARRAY['/images/products/milk.png']::text[], ARRAY['own', 'nogmo', 'healthy']::text[], '{"Упаковка": "900 мл"}'::jsonb),
  (372009, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='milk'), 'Ряженка Лукошко 4%, 450 мл', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 59.9, 54.9, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '450 мл', 2, ARRAY['/images/products/milk.png']::text[], ARRAY['own', 'nogmo']::text[], '{"Упаковка": "450 мл"}'::jsonb),
  (372010, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='butter'), 'Сливки питьевые Лукошко 20%, 200 мл', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 64.9, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '200 мл', 2, ARRAY['/images/products/milk.png']::text[], ARRAY['own', 'nogmo']::text[], '{"Упаковка": "200 мл"}'::jsonb),
  (372011, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='butter'), 'Масло сливочное Крестьянское 72,5%, 180 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 169.0, 149.0, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '180 г', 5, ARRAY['/images/products/butter.png']::text[], ARRAY['own']::text[], '{"Упаковка": "180 г"}'::jsonb),
  (372012, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='cheese'), 'Сыр Дорблю с голубой плесенью, нарезка, 100 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 129.9, 99.9, FALSE, FALSE, TRUE, 'Dorblu', 'Германия', '100 г', 3, ARRAY['/images/products/dorblu.png']::text[], ARRAY[]::text[], '{"Упаковка": "100 г"}'::jsonb),
  (372013, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='eggs'), 'Яйцо куриное С1 Лукошко, 10 шт.', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 109.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '10 шт.', 3, ARRAY['/images/products/photo_milk.jpg']::text[], ARRAY['own', 'nogmo', 'healthy']::text[], '{"Упаковка": "10 шт."}'::jsonb),
  (372014, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='milk'), 'Творог Лукошко 5%, 200 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 69.9, NULL, FALSE, FALSE, FALSE, 'Лукошко', 'Россия', '200 г', 2, ARRAY['/images/products/photo_milk.jpg']::text[], ARRAY['own', 'healthy']::text[], '{"Упаковка": "200 г"}'::jsonb),
  (372015, (SELECT id FROM categories WHERE slug='milk'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='milk' AND sc.slug='yogurt'), 'Йогурт Fruttis Лёгкий персик-маракуйя 0,1%, 4×115 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 27.99, NULL, FALSE, TRUE, TRUE, 'Fruttis', 'Россия', '460 г', 1, ARRAY['/images/products/fruttis1.png']::text[], ARRAY['healthy']::text[], '{"Упаковка": "460 г"}'::jsonb),
  (372016, (SELECT id FROM categories WHERE slug='meat'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='meat' AND sc.slug='sausage'), 'Колбаса сырокопчёная МЯСНАЯ ИСТОРИЯ Сальчичон и Тоскана, нарезка, 90 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 89.0, 44.5, TRUE, FALSE, TRUE, 'МЯСНАЯ ИСТОРИЯ', 'Россия', '90 г', 4, ARRAY['/images/products/salchichon.png']::text[], ARRAY[]::text[], '{"Упаковка": "90 г"}'::jsonb),
  (372017, (SELECT id FROM categories WHERE slug='meat'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='meat' AND sc.slug='sausages'), 'Сосиски вареные МЯСНАЯ ИСТОРИЯ Молочные с сыром, 330 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 159.99, NULL, FALSE, FALSE, TRUE, 'МЯСНАЯ ИСТОРИЯ', 'Россия', '330 г', 4, ARRAY['/images/products/sausages.png']::text[], ARRAY[]::text[], '{"Упаковка": "330 г"}'::jsonb),
  (372018, (SELECT id FROM categories WHERE slug='meat'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='meat' AND sc.slug='sausage'), 'Колбаса сырокопчёная Салями Премиум Фирменная, 400 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 599.99, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Россия', '400 г', 12, ARRAY['/images/products/salami_long.png']::text[], ARRAY['own']::text[], '{"Упаковка": "400 г"}'::jsonb),
  (372019, (SELECT id FROM categories WHERE slug='meat'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='meat' AND sc.slug='ham'), 'Ветчина Питерская, нарезка, 150 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 77.99, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '150 г', 2, ARRAY['/images/products/ham.png']::text[], ARRAY['own']::text[], '{"Упаковка": "150 г"}'::jsonb),
  (372020, (SELECT id FROM categories WHERE slug='meat'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='meat' AND sc.slug='sausages'), 'Сосиски Лукошко Молочные, 400 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 129.0, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Россия', '400 г', 3, ARRAY['/images/products/sausages.png']::text[], ARRAY['own']::text[], '{"Упаковка": "400 г"}'::jsonb),
  (372021, (SELECT id FROM categories WHERE slug='meat'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='meat' AND sc.slug='sausage'), 'Колбаса Докторская Лукошко вареная, 500 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 249.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '500 г', 5, ARRAY['/images/products/photo_meat.jpg']::text[], ARRAY['own']::text[], '{"Упаковка": "500 г"}'::jsonb),
  (372022, (SELECT id FROM categories WHERE slug='meat'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='meat' AND sc.slug='poultry'), 'Филе куриной грудки охлаждённое, 1 кг', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 349.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '~1 кг', 6, ARRAY['/images/products/photo_meat.jpg']::text[], ARRAY['nogmo', 'healthy']::text[], '{"Упаковка": "~1 кг"}'::jsonb),
  (372023, (SELECT id FROM categories WHERE slug='meat'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='meat' AND sc.slug='ham'), 'Ветчина Лукошко из индейки, 200 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 189.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '200 г', 3, ARRAY['/images/products/ham.png']::text[], ARRAY['own', 'healthy']::text[], '{"Упаковка": "200 г"}'::jsonb),
  (372024, (SELECT id FROM categories WHERE slug='meat'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='meat' AND sc.slug='sausage'), 'Колбаса сырокопчёная Салями Венская, 250 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 389.0, 299.0, TRUE, FALSE, TRUE, 'Лукошко', 'Россия', '250 г', 6, ARRAY['/images/products/salami_long.png']::text[], ARRAY['own']::text[], '{"Упаковка": "250 г"}'::jsonb),
  (372025, (SELECT id FROM categories WHERE slug='frozen'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='frozen' AND sc.slug='ready'), 'Г/Ц Блинчики с мясом вес, Россия', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 50.5, 44.5, TRUE, FALSE, TRUE, 'Лукошко', 'Россия', 'вес', 2, ARRAY['/images/products/blini.png']::text[], ARRAY['own']::text[], '{"Упаковка": "вес"}'::jsonb),
  (372026, (SELECT id FROM categories WHERE slug='frozen'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='frozen' AND sc.slug='ready'), 'Блинчики Лукошко с творогом, 420 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 139.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '420 г', 3, ARRAY['/images/products/blini.png']::text[], ARRAY['own']::text[], '{"Упаковка": "420 г"}'::jsonb),
  (372027, (SELECT id FROM categories WHERE slug='frozen'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='frozen' AND sc.slug='veg'), 'Овощная смесь Гавайская замороженная, 400 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 119.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '400 г', 2, ARRAY['/images/products/photo_frozen.jpg']::text[], ARRAY['nogmo', 'healthy']::text[], '{"Упаковка": "400 г"}'::jsonb),
  (372028, (SELECT id FROM categories WHERE slug='frozen'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='frozen' AND sc.slug='veg'), 'Ягодный микс замороженный Лукошко, 300 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 159.0, 129.0, FALSE, TRUE, TRUE, 'Лукошко', 'Россия', '300 г', 3, ARRAY['/images/products/photo_frozen.jpg']::text[], ARRAY['own', 'healthy', 'nogmo']::text[], '{"Упаковка": "300 г"}'::jsonb),
  (372029, (SELECT id FROM categories WHERE slug='bread'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='bread' AND sc.slug='bread'), 'Хлеб пшеничный нарезной Лукошко, 400 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 52.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '400 г', 1, ARRAY['/images/products/photo_bread.jpg']::text[], ARRAY['own']::text[], '{"Упаковка": "400 г"}'::jsonb),
  (372030, (SELECT id FROM categories WHERE slug='bread'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='bread' AND sc.slug='pastry'), 'Багет французский, 280 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 44.9, 39.9, TRUE, FALSE, TRUE, 'Лукошко', 'Россия', '280 г', 1, ARRAY['/images/products/photo_bread.jpg']::text[], ARRAY['own']::text[], '{"Упаковка": "280 г"}'::jsonb),
  (372031, (SELECT id FROM categories WHERE slug='bread'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='bread' AND sc.slug='pastry'), 'Булочка Крендель с маком, 90 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 29.9, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Россия', '90 г', 1, ARRAY['/images/products/photo_bread.jpg']::text[], ARRAY['own']::text[], '{"Упаковка": "90 г"}'::jsonb),
  (372032, (SELECT id FROM categories WHERE slug='fruits'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='fruits' AND sc.slug='fruits'), 'Яблоки Гренни Смит, 1 кг', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 139.0, NULL, FALSE, FALSE, TRUE, 'Свежий урожай', 'Россия', '~1 кг', 3, ARRAY['/images/products/photo_fruits.jpg']::text[], ARRAY['nogmo', 'healthy']::text[], '{"Упаковка": "~1 кг"}'::jsonb),
  (372033, (SELECT id FROM categories WHERE slug='fruits'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='fruits' AND sc.slug='veg'), 'Помидоры сливовидные, 1 кг', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 199.0, 149.0, TRUE, FALSE, TRUE, 'Свежий урожай', 'Россия', '~1 кг', 4, ARRAY['/images/products/photo_fruits.jpg']::text[], ARRAY['nogmo', 'healthy']::text[], '{"Упаковка": "~1 кг"}'::jsonb),
  (372034, (SELECT id FROM categories WHERE slug='fruits'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='fruits' AND sc.slug='veg'), 'Брокколи свежая, 400 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 159.0, NULL, FALSE, TRUE, TRUE, 'Свежий урожай', 'Россия', '400 г', 3, ARRAY['/images/products/photo_fruits.jpg']::text[], ARRAY['nogmo', 'healthy']::text[], '{"Упаковка": "400 г"}'::jsonb),
  (372035, (SELECT id FROM categories WHERE slug='drinks'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='drinks' AND sc.slug='soda'), 'Лимонад Лукошко Цитрус, 1,5 л', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 79.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '1,5 л', 2, ARRAY['/images/products/photo_drinks.jpg']::text[], ARRAY['own']::text[], '{"Упаковка": "1,5 л"}'::jsonb),
  (372036, (SELECT id FROM categories WHERE slug='drinks'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='drinks' AND sc.slug='soda'), 'Напиток газированный Кола, 1,5 л', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 89.0, 69.0, TRUE, FALSE, TRUE, 'Лукошко', 'Россия', '1,5 л', 2, ARRAY['/images/products/photo_drinks.jpg']::text[], ARRAY[]::text[], '{"Упаковка": "1,5 л"}'::jsonb),
  (372037, (SELECT id FROM categories WHERE slug='drinks'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='drinks' AND sc.slug='tea'), 'Холодный чай Лимон, 1 л', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 74.0, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Россия', '1 л', 2, ARRAY['/images/products/photo_drinks.jpg']::text[], ARRAY[]::text[], '{"Упаковка": "1 л"}'::jsonb),
  (372038, (SELECT id FROM categories WHERE slug='sweets'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='sweets' AND sc.slug='gummy'), 'Мармелад жевательный Ассорти, 300 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 149.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '300 г', 2, ARRAY['/images/products/photo_sweets.jpg']::text[], ARRAY[]::text[], '{"Упаковка": "300 г"}'::jsonb),
  (372039, (SELECT id FROM categories WHERE slug='sweets'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='sweets' AND sc.slug='candy'), 'Конфеты шоколадные Ассорти, 400 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 399.0, 319.0, TRUE, FALSE, TRUE, 'Лукошко', 'Россия', '400 г', 8, ARRAY['/images/products/photo_sweets.jpg']::text[], ARRAY['own']::text[], '{"Упаковка": "400 г"}'::jsonb),
  (372040, (SELECT id FROM categories WHERE slug='sweets'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='sweets' AND sc.slug='candy'), 'Лакрица цветная ассорти, 200 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 129.0, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Россия', '200 г', 2, ARRAY['/images/products/photo_sweets.jpg']::text[], ARRAY[]::text[], '{"Упаковка": "200 г"}'::jsonb),
  (372041, (SELECT id FROM categories WHERE slug='tea'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='tea' AND sc.slug='coffee'), 'Кофе в зёрнах Арабика, 500 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 799.0, 649.0, TRUE, FALSE, TRUE, 'Лукошко', 'Бразилия', '500 г', 13, ARRAY['/images/products/photo_tea.jpg']::text[], ARRAY[]::text[], '{"Упаковка": "500 г"}'::jsonb),
  (372042, (SELECT id FROM categories WHERE slug='tea'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='tea' AND sc.slug='tea'), 'Чай зелёный листовой, 100 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 189.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Китай', '100 г', 3, ARRAY['/images/products/photo_tea.jpg']::text[], ARRAY['healthy']::text[], '{"Упаковка": "100 г"}'::jsonb),
  (372043, (SELECT id FROM categories WHERE slug='tea'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='tea' AND sc.slug='tea'), 'Чай чёрный Цейлонский, 200 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 249.0, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Шри-Ланка', '200 г', 4, ARRAY['/images/products/photo_tea.jpg']::text[], ARRAY[]::text[], '{"Упаковка": "200 г"}'::jsonb),
  (372044, (SELECT id FROM categories WHERE slug='grocery'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='grocery' AND sc.slug='pasta'), 'Макароны Спагетти, 450 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 69.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '450 г', 1, ARRAY['/images/products/photo_grocery.jpg']::text[], ARRAY['own']::text[], '{"Упаковка": "450 г"}'::jsonb),
  (372045, (SELECT id FROM categories WHERE slug='grocery'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='grocery' AND sc.slug='pasta'), 'Макароны Фузилли, 400 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 64.0, 49.0, TRUE, FALSE, TRUE, 'Лукошко', 'Россия', '400 г', 1, ARRAY['/images/products/photo_grocery.jpg']::text[], ARRAY['own']::text[], '{"Упаковка": "400 г"}'::jsonb),
  (372046, (SELECT id FROM categories WHERE slug='grocery'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='grocery' AND sc.slug='cereal'), 'Крупа гречневая ядрица, 800 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 119.0, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Россия', '800 г', 2, ARRAY['/images/products/photo_grocery.jpg']::text[], ARRAY['own', 'nogmo', 'healthy']::text[], '{"Упаковка": "800 г"}'::jsonb),
  (372047, (SELECT id FROM categories WHERE slug='healthy'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='healthy' AND sc.slug='super'), 'Семена чиа, 200 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 249.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '200 г', 5, ARRAY['/images/products/photo_healthy.jpg']::text[], ARRAY['healthy', 'nogmo']::text[], '{"Упаковка": "200 г"}'::jsonb),
  (372048, (SELECT id FROM categories WHERE slug='healthy'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='healthy' AND sc.slug='fish'), 'Филе лосося охлаждённое, 300 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 599.0, 499.0, TRUE, FALSE, TRUE, 'Лукошко', 'Норвегия', '300 г', 10, ARRAY['/images/products/photo_healthy.jpg']::text[], ARRAY['healthy']::text[], '{"Упаковка": "300 г"}'::jsonb),
  (372049, (SELECT id FROM categories WHERE slug='healthy'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='healthy' AND sc.slug='super'), 'Киноа трёхцветная, 400 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 289.0, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Перу', '400 г', 5, ARRAY['/images/products/photo_healthy.jpg']::text[], ARRAY['healthy', 'nogmo']::text[], '{"Упаковка": "400 г"}'::jsonb),
  (372050, (SELECT id FROM categories WHERE slug='pets'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='pets' AND sc.slug='dogs'), 'Корм сухой для собак всех пород, 2 кг', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 599.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '2 кг', 8, ARRAY['/images/products/photo_pets.jpg']::text[], ARRAY[]::text[], '{"Упаковка": "2 кг"}'::jsonb),
  (372051, (SELECT id FROM categories WHERE slug='pets'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='pets' AND sc.slug='cats'), 'Корм сухой для кошек, 1,5 кг', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 489.0, 399.0, TRUE, FALSE, TRUE, 'Лукошко', 'Россия', '1,5 кг', 6, ARRAY['/images/products/photo_pets.jpg']::text[], ARRAY[]::text[], '{"Упаковка": "1,5 кг"}'::jsonb),
  (372052, (SELECT id FROM categories WHERE slug='pets'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='pets' AND sc.slug='dogs'), 'Лакомство для собак, 100 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 129.0, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Россия', '100 г', 2, ARRAY['/images/products/photo_pets.jpg']::text[], ARRAY[]::text[], '{"Упаковка": "100 г"}'::jsonb),
  (372053, (SELECT id FROM categories WHERE slug='baby'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='baby' AND sc.slug='puree'), 'Пюре яблоко-банан для детей, 90 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 49.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '90 г', 1, ARRAY['/images/products/photo_baby.jpg']::text[], ARRAY['nogmo', 'healthy']::text[], '{"Упаковка": "90 г"}'::jsonb),
  (372054, (SELECT id FROM categories WHERE slug='baby'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='baby' AND sc.slug='porridge'), 'Каша молочная овсяная, 200 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 79.0, 65.0, TRUE, FALSE, TRUE, 'Лукошко', 'Россия', '200 г', 2, ARRAY['/images/products/photo_baby.jpg']::text[], ARRAY['nogmo', 'healthy']::text[], '{"Упаковка": "200 г"}'::jsonb),
  (372055, (SELECT id FROM categories WHERE slug='baby'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='baby' AND sc.slug='puree'), 'Пюре мясное индейка для детей, 100 г', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 69.0, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Россия', '100 г', 2, ARRAY['/images/products/photo_baby.jpg']::text[], ARRAY['nogmo']::text[], '{"Упаковка": "100 г"}'::jsonb),
  (372056, (SELECT id FROM categories WHERE slug='household'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='household' AND sc.slug='dish'), 'Средство для мытья посуды Лимон, 500 мл', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 129.0, NULL, FALSE, FALSE, TRUE, 'Лукошко', 'Россия', '500 мл', 2, ARRAY['/images/products/photo_household.jpg']::text[], ARRAY[]::text[], '{"Упаковка": "500 мл"}'::jsonb),
  (372057, (SELECT id FROM categories WHERE slug='household'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='household' AND sc.slug='dish'), 'Губки для посуды, 5 шт.', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 89.0, 69.0, TRUE, FALSE, TRUE, 'Лукошко', 'Россия', '5 шт.', 1, ARRAY['/images/products/photo_household.jpg']::text[], ARRAY[]::text[], '{"Упаковка": "5 шт."}'::jsonb),
  (372058, (SELECT id FROM categories WHERE slug='household'), (SELECT sc.id FROM subcategories sc JOIN categories c ON c.id=sc.category_id WHERE c.slug='household' AND sc.slug='clean'), 'Чистящий спрей универсальный, 500 мл', 'Свежие продукты с доставкой из магазинов «Лукошко». Хранить в соответствии с условиями, указанными на упаковке.', 179.0, NULL, FALSE, TRUE, TRUE, 'Лукошко', 'Россия', '500 мл', 3, ARRAY['/images/products/photo_household.jpg']::text[], ARRAY[]::text[], '{"Упаковка": "500 мл"}'::jsonb);


-- «С этим товаром покупают»: массив id товаров из той же категории (детерминированный набор по 4 шт.)
UPDATE products p
SET related_ids = ARRAY(
    SELECT r.id FROM products r
    WHERE r.category_id = p.category_id AND r.id <> p.id
    ORDER BY (r.id * 7 + p.id * 3) % 11, r.id
    LIMIT 4
);
-- у масла Простоквашино — сопутствующие товары из других категорий
UPDATE products SET related_ids = ARRAY(
    SELECT id FROM products WHERE article IN (372016, 372017, 372019, 372025) ORDER BY id
) WHERE article = 371431;


-- ---------- Пользователи ----------
INSERT INTO users (phone, name, avatar, has_card, bonus) VALUES
  ('+79123456789', 'Алексей', '/images/avatar.png', TRUE, 120),
  ('+79120000001', 'Татьяна', NULL, TRUE, 40),
  ('+79120000002', 'Мария',   NULL, FALSE, 0);

-- ---------- Отзывы ----------
-- отзывы к маслу Простоквашино (как в макете)
INSERT INTO reviews (product_id, user_id, author, rating, text, created_at)
SELECT p.id, u.id, v.author, v.rating, v.text, v.dt::timestamp
FROM (VALUES
  ('Татьяна', 5, 'приятный вкус', '2026-10-22'),
  ('Мария',   4, 'Масло среднее, есть вкуснее', '2026-10-22'),
  ('Алексей', 1, 'Покупали в том числе в этом весе. Масло по вкусу и органолептическим свойствам совершенно не похоже на натуральное. Упаковка выглядит как напечатанная на дешёвом принтере. На наш взгляд продукт является подделкой или контрафактной продукцией. Просим разобраться.', '2026-10-22')
) AS v(author, rating, text, dt)
JOIN products p ON p.article = 371431
LEFT JOIN users u ON u.name = v.author AND u.phone LIKE '+7912%';

-- остальные товары: 1–3 отзыва, оценка зависит от id
INSERT INTO reviews (product_id, author, rating, text, created_at)
SELECT p.id,
       (ARRAY['Татьяна','Мария','Алексей','Ирина','Сергей','Ольга'])[1 + (p.id + g) % 6],
       r.rating,
       CASE
         WHEN r.rating >= 4 THEN (ARRAY['Приятный вкус, беру не в первый раз','Свежее, срок годности хороший','Отличное качество за свои деньги'])[1 + (p.id + g) % 3]
         WHEN r.rating = 3  THEN (ARRAY['Нормально, но бывает лучше','Без восторга, но есть можно'])[1 + (p.id + g) % 2]
         ELSE (ARRAY['Не понравилось, ожидал большего','Качество просело по сравнению с прошлым разом'])[1 + (p.id + g) % 2]
       END,
       now() - ((p.id * 3 + g * 11) % 60 || ' days')::interval
FROM products p
CROSS JOIN generate_series(1, 3) AS g
CROSS JOIN LATERAL (SELECT 1 + ((p.id * 5 + g * 2) % 5) AS rating) AS r
WHERE p.article <> 371431 AND (p.id + g) % 4 <> 0;

-- ---------- Избранное, корзина, заказы демо-пользователя ----------
INSERT INTO favorites (user_id, product_id)
SELECT u.id, p.id FROM users u, products p WHERE u.phone='+79123456789' AND p.article IN (371431, 372017, 372002);

INSERT INTO cart_items (user_id, product_id, quantity)
SELECT u.id, p.id, 1 FROM users u, products p WHERE u.phone='+79123456789' AND p.article = 372002;

INSERT INTO orders (user_id, status, total, address, created_at)
SELECT id, 'delivered', 0, 'г. Сыктывкар, ул. Коммунистическая, 12, кв. 34', now() - interval '12 days' FROM users WHERE phone='+79123456789';
INSERT INTO orders (user_id, status, total, address, created_at)
SELECT id, 'delivered', 0, 'г. Сыктывкар, ул. Коммунистическая, 12, кв. 34', now() - interval '3 days' FROM users WHERE phone='+79123456789';

INSERT INTO order_items (order_id, product_id, title, price, quantity)
SELECT o.id, p.id, p.title, COALESCE(p.card_price, p.price), x.qty
FROM (VALUES (1, 372025, 2), (1, 372003, 1), (1, 372019, 1), (2, 372018, 1), (2, 372016, 1), (2, 371431, 1), (2, 372002, 2)) AS x(ord, art, qty)
JOIN LATERAL (SELECT id FROM orders ORDER BY id LIMIT 1 OFFSET (x.ord - 1)) o ON TRUE
JOIN products p ON p.article = x.art;

UPDATE orders o SET total = (SELECT COALESCE(SUM(price * quantity), 0) FROM order_items i WHERE i.order_id = o.id);

-- ---------- Магазины (вкладки + пины на карте, координаты в %) ----------
INSERT INTO stores (district, address, phone, hours, map_x, map_y) VALUES
  ('Центральный',  'г. Сыктывкар, ул. Коммунистическая, 25', '8 800 777 33 33', 'ежедневно 8:00–23:00', 45.40, 39.70),
  ('Строитель',    'г. Сыктывкар, ул. Морозова, 54',          '8 800 777 33 33', 'ежедневно 8:00–22:00', 22.90, 30.60),
  ('Юго-Западный', 'г. Сыктывкар, Октябрьский пр-т, 140',     '8 800 777 33 33', 'ежедневно 8:00–22:00', 25.00, 72.80),
  ('Кируль',       'г. Сыктывкар, ул. Савина, 17',            '8 800 777 33 33', 'ежедневно 9:00–21:00', 78.00, 52.70);

-- ---------- Статьи ----------
INSERT INTO articles (title, preview, image, published_at) VALUES
  ('Режим использования масок и перчаток на территории магазинов',
   'Подробная информация о режимах использования масок и перчаток на территории магазинов «Лукошко». Информация обновляется каждый будний день.',
   '/images/articles/article_1.jpg', '2026-03-05'),
  ('Весеннее настроение для каждого',
   '8 Марта – это не просто Международный женский день, это ещё день тюльпанов, приятных сюрпризов и праздничных тёплых пожеланий.',
   '/images/articles/article_2.jpg', '2026-03-05'),
  ('ЗОЖ или ФАСТФУД. А вы на чьей стороне? Голосуем!',
   'Голосуйте за любимые категории, выбирайте категорию-победителя в мобильном приложении и получайте кешбэк 10% баллами в апреле!',
   '/images/articles/article_3.jpg', '2026-02-22');

-- ---------- Специальные предложения ----------
INSERT INTO special_offers (title, text, variant, sort_order) VALUES
  ('Оформите карту «Лукошко»', 'И получайте бонусы при покупке в магазинах и на сайте', 'peach', 1),
  ('Покупайте акционные товары', 'И получайте вдвое больше бонусов', 'green', 2);
