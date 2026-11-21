# Северяночка

Учебный сайт продуктового магазина «Северяночка» (React + Node.js + PostgreSQL).

## Стек

- **frontend** — React, Vite, react-router-dom, SCSS
- **backend** — Node.js, Express, pg
- **db** — PostgreSQL (смотреть можно в DBeaver)

## Структура

```
db/                   init.sql — таблицы и данные
backend/              index.js — сервер API (порт 3000)
frontend/vite-project/ сайт (порт 5173)
docker-compose.yml    PostgreSQL в Docker
```

## Таблицы

- `categories` — категории товаров
- `products` — товары
- `reviews` — отзывы к товарам
- `users` — пользователи (вход по номеру телефона)

## Запуск

### 1. База данных

Вариант А — Docker:

```
docker compose up -d
```

Вариант Б — свой PostgreSQL: подключитесь в DBeaver (пользователь `postgres`, пароль `1234`, база `postgres`),
откройте `db/init.sql` и выполните скрипт целиком (Alt+X).

### 2. Backend

```
cd backend
npm install
node index.js
```

Сервер запустится на http://localhost:3000. Настройки подключения к базе лежат в `backend/.env`.

### 3. Frontend

```
cd frontend/vite-project
npm install
npm run dev
```

Сайт откроется на http://localhost:5173

> Если сервер или база не запущены, сайт всё равно покажет данные из массивов в `src/data/fallback.js`.

## Вход

Тестовый пользователь: **+7 912 345-67-89**. Новый пользователь регистрируется кнопкой «Регистрация».

## Что упрощено

- Вход только по номеру телефона, без пароля.
- Страницы «Избранное», «Заказы», «Корзина» — заглушки.
- Сердечки и кнопки «В корзину» работают только на странице, в базу не пишутся.
- Карта магазинов — встроенная карта OpenStreetMap, координаты магазинов примерные.
