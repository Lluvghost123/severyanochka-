// Массивы данных. Показываются, пока сервер не ответил
// (или если сервер / база недоступны). Основные данные приходят из PostgreSQL.

export const fallbackCategories = [
  { id: 1, slug: 'milk', title: 'Молоко, сыр, яйцо', image: '/images/categories/cat_milk.jpg' },
  { id: 2, slug: 'bread', title: 'Хлеб', image: '/images/categories/cat_bread.jpg' },
  { id: 3, slug: 'fruits', title: 'Фрукты и овощи', image: '/images/categories/cat_fruits.jpg' },
  { id: 4, slug: 'frozen', title: 'Замороженные продукты', image: '/images/categories/cat_frozen.jpg' },
  { id: 5, slug: 'drinks', title: 'Напитки', image: '/images/categories/cat_drinks.jpg' },
  { id: 6, slug: 'sweets', title: 'Кондитерские изделия', image: '/images/categories/cat_sweets.jpg' },
  { id: 7, slug: 'tea', title: 'Чай, кофе', image: '/images/categories/cat_tea.jpg' },
  { id: 8, slug: 'grocery', title: 'Бакалея', image: '/images/categories/cat_grocery.jpg' },
  { id: 9, slug: 'healthy', title: 'Здоровое питание', image: '/images/categories/cat_healthy.jpg' },
  { id: 10, slug: 'pets', title: 'Зоотовары', image: '/images/categories/cat_pets.jpg' },
  { id: 11, slug: 'baby', title: 'Детское питание', image: '/images/categories/cat_baby.jpg' },
  { id: 12, slug: 'meat', title: 'Мясо, птица, колбаса', image: '/images/categories/cat_meat.jpg' },
  { id: 13, slug: 'household', title: 'Непродовольственные товары', image: '/images/categories/cat_household.jpg' },
];

const card = (id, title, price, card_price, is_promo, image, rating, extra = {}) => ({
  id, article: 372000 + id, title, price, card_price,
  is_promo, is_new: false, in_stock: true, image,
  category_slug: 'milk', category_title: 'Молоко, сыр, яйцо',
  rating, reviews_count: 3, ...extra,
});

export const fallbackPromo = [
  card(25, 'Г/Ц Блинчики с мясом вес, Россия', 50.5, 44.5, true, '/images/products/blini.png', 2),
  card(2, 'Молоко ПРОСТОКВАШИНО паст. питьевое цельное отборное 3,4-4,5%, 930 мл', 140.5, 69.99, true, '/images/products/milk.png', 2.5),
  card(16, 'Колбаса сырокопчёная МЯСНАЯ ИСТОРИЯ Сальчичон и Тоскана, нарезка, 90 г', 89, 44.5, true, '/images/products/salchichon.png', 5),
  card(4, 'Масло ПРОСТОКВАШИНО сливочное в/с 82% фольга без змж, Россия, 180 г', 192.69, 108.99, true, '/images/products/butter.png', 3.5),
];

export const fallbackNews = [
  card(18, 'Колбаса сырокопчёная Салями Премиум Фирменная, 400 г', 599.99, null, false, '/images/products/salami_long.png', 4, { is_new: true }),
  card(7, 'Молоко питьевое Северяночка пастеризованное 3,2%, 1 л', 89.9, null, false, '/images/products/milk.png', 4, { is_new: true }),
  card(20, 'Сосиски Северяночка Молочные, 400 г', 129, null, false, '/images/products/sausages.png', 3.5, { is_new: true }),
  card(8, 'Кефир Северяночка 2,5%, 900 мл', 74.9, null, false, '/images/products/milk.png', 4, { is_new: true }),
];

export const fallbackOffers = [
  { id: 1, title: 'Оформите карту «Северяночка»', text: 'И получайте бонусы при покупке в магазинах и на сайте', variant: 'peach' },
  { id: 2, title: 'Покупайте акционные товары', text: 'И получайте вдвое больше бонусов', variant: 'green' },
];

export const fallbackStores = [
  { id: 1, district: 'Центральный', address: 'г. Сыктывкар, ул. Коммунистическая, 25', phone: '8 800 777 33 33', hours: 'ежедневно 8:00–23:00', lat: 61.6689, lng: 50.833 },
  { id: 2, district: 'Строитель', address: 'г. Сыктывкар, ул. Морозова, 54', phone: '8 800 777 33 33', hours: 'ежедневно 8:00–22:00', lat: 61.662, lng: 50.79 },
  { id: 3, district: 'Юго-Западный', address: 'г. Сыктывкар, Октябрьский пр-т, 140', phone: '8 800 777 33 33', hours: 'ежедневно 8:00–22:00', lat: 61.656, lng: 50.772 },
  { id: 4, district: 'Кируль', address: 'г. Сыктывкар, ул. Савина, 17', phone: '8 800 777 33 33', hours: 'ежедневно 9:00–21:00', lat: 61.642, lng: 50.86 },
];

export const fallbackArticles = [
  { id: 1, title: 'Режим использования масок и перчаток на территории магазинов', preview: 'Подробная информация о режимах использования масок и перчаток на территории магазинов «Северяночка». Информация обновляется каждый будний день.', image: '/images/articles/article_1.jpg', published_at: '2026-03-05' },
  { id: 2, title: 'Весеннее настроение для каждого', preview: '8 Марта – это не просто Международный женский день, это ещё день тюльпанов, приятных сюрпризов и праздничных тёплых пожеланий.', image: '/images/articles/article_2.jpg', published_at: '2026-03-05' },
  { id: 3, title: 'ЗОЖ или ФАСТФУД. А вы на чьей стороне? Голосуем!', preview: 'Голосуйте за любимые категории, выбирайте категорию-победителя в мобильном приложении и получайте кешбэк 10% баллами в апреле!', image: '/images/articles/article_3.jpg', published_at: '2026-02-22' },
];
