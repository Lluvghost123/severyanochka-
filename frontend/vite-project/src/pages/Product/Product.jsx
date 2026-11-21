import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fallbackNews, fallbackPromo } from '../../data/fallback.js';
import { formatDate, formatPrice, getDiscount } from '../../utils/format.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx';
import ProductSection from '../../components/Home/ProductSection.jsx';
import Stars from '../../components/Stars/Stars.jsx';
import { IconBell, IconCart, IconHeart, IconInfo, IconLeaf, IconShare, IconUser } from '../../components/Icons/Icons.jsx';
import './Product.scss';

export default function Product() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(false);
  const [promo, setPromo] = useState(fallbackPromo);
  const [together, setTogether] = useState(fallbackNews);

  const [liked, setLiked] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [alertOn, setAlertOn] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    setProduct(null);
    setError(false);
    fetch(`http://localhost:3000/api/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => setProduct(data))
      .catch(() => setError(true));

    fetch('http://localhost:3000/api/products?promo=1&limit=4')
      .then(res => res.json())
      .then(data => data.length > 0 && setPromo(data))
      .catch(() => {});

    fetch('http://localhost:3000/api/products?isNew=1&limit=4')
      .then(res => res.json())
      .then(data => data.length > 0 && setTogether(data))
      .catch(() => {});
  }, [id]);

  if (error || !product) {
    return (
      <div className="page_wrapper">
        <Header />
        <main className="page_main">
          <div className="page_container">
            <div className="empty_state">
              <div className="empty_state_title">{error ? 'Товар не найден' : 'Загрузка…'}</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const discount = getDiscount(product);
  const hasCardPrice = product.card_price !== null;
  const reviews = product.reviews;

  // средняя оценка и количество оценок по звёздам считаем из списка отзывов
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const counts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
  }));

  const sendReview = (event) => {
    event.preventDefault();
    let author = 'Гость';
    try {
      const saved = localStorage.getItem('user');
      if (saved) author = JSON.parse(saved).name;
    } catch {
      // без входа отзыв уйдёт от гостя
    }

    fetch('http://localhost:3000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id, author, rating, text: text.trim() }),
    })
      .then(res => res.json())
      .then(review => {
        if (review.error) return;
        setProduct({ ...product, reviews: [review, ...reviews] });
        setRating(0);
        setText('');
      })
      .catch(() => {});
  };

  const canSend = rating > 0 && text.trim().length >= 3;

  return (
    <div className="page_wrapper">
      <Header />
      <main className="page_main">
        <div className="page_container">
          <Breadcrumbs items={[
            { title: 'Главная', to: '/' },
            { title: 'Каталог', to: '/catalog' },
            { title: product.category_title, to: `/category/${product.category_slug}` },
            { title: product.title },
          ]} />

          <h1 className="product_title">{product.title}</h1>

          <div className="product_meta">
            <span className="product_article">арт. {product.article}</span>
            <span className="product_meta_rating">
              <Stars value={Math.round(average)} size={16} />
              <a className="product_reviews_link" href="#reviews">{reviews.length} отзывов</a>
            </span>
            <button className="product_meta_btn" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              <IconShare size={24} />
              <span>Поделиться</span>
            </button>
            <button className={`product_meta_btn ${liked ? 'active' : ''}`} onClick={() => setLiked(!liked)}>
              <IconHeart size={24} filled={liked} />
              <span>{liked ? 'В избранном' : 'В избранное'}</span>
            </button>
          </div>

          <div className="product_top">
            <div className="product_thumbs">
              <button className="product_thumb active">
                <img src={product.image} alt="" />
              </button>
            </div>

            <div className="product_gallery">
              <img className="product_gallery_img" src={product.image} alt={product.title} />
              {discount > 0 && <span className="product_badge">-{discount}%</span>}
            </div>

            <div className="product_info">
              <div className="product_prices">
                {hasCardPrice && (
                  <div className="product_price_old_block">
                    <span className="product_price_old">{formatPrice(product.price)}</span>
                    <span className="product_price_label">Обычная цена</span>
                  </div>
                )}
                <div className="product_price_main_block">
                  <span className="product_price_main">{formatPrice(hasCardPrice ? product.card_price : product.price)}</span>
                  {hasCardPrice && (
                    <span className="product_price_label">
                      С картой Северяночка
                      <span className="product_price_hint"><IconInfo size={22} /></span>
                    </span>
                  )}
                </div>
              </div>

              {product.in_stock ? (
                <button className={`product_buy ${inCart ? 'active' : ''}`} onClick={() => setInCart(!inCart)}>
                  <IconCart size={32} />
                  <span>{inCart ? 'В корзине' : 'В корзину'}</span>
                </button>
              ) : (
                <button className="product_buy disabled" disabled>Нет в наличии</button>
              )}

              {product.bonus > 0 && (
                <div className="product_bonus">
                  <IconLeaf size={22} />
                  <span>Вы получаете <b>{product.bonus} бонусов</b></span>
                </div>
              )}

              <button className={`product_alert ${alertOn ? 'active' : ''}`} onClick={() => setAlertOn(!alertOn)}>
                <IconBell size={26} off={!alertOn} />
                <span>{alertOn ? 'Сообщим о снижении цены' : 'Уведомить о снижении цены'}</span>
              </button>

              <table className="product_specs">
                <tbody>
                  <tr>
                    <td className="product_specs_name">Бренд</td>
                    <td className="product_specs_value">{product.brand}</td>
                  </tr>
                  <tr>
                    <td className="product_specs_name">Страна производителя</td>
                    <td className="product_specs_value">{product.country}</td>
                  </tr>
                  <tr>
                    <td className="product_specs_name">Упаковка</td>
                    <td className="product_specs_value">{product.package}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <aside className="product_similar">
              <div className="product_similar_title">Похожие</div>
              {product.similar.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`} className="product_similar_card">
                  <img className="product_similar_img" src={item.image} alt={item.title} />
                  <span className="product_similar_price">{formatPrice(item.card_price || item.price)}</span>
                </Link>
              ))}
            </aside>
          </div>
        </div>

        <section className="product_block">
          <div className="page_container">
            <h2 className="section_title product_block_title">С этим товаром покупают</h2>
            <ProductGrid products={together} />
          </div>
        </section>

        <section className="product_block" id="reviews">
          <div className="page_container">
            <h2 className="section_title product_block_title">Отзывы</h2>

            <div className="reviews">
              <div className="reviews_summary">
                <div className="reviews_avg">
                  <Stars value={Math.round(average)} size={16} />
                  <span className="reviews_avg_text">
                    {reviews.length > 0 ? `${average.toFixed(1).replace('.', ',')} из 5` : 'Оценок пока нет'}
                  </span>
                </div>
                <ul className="reviews_dist">
                  {counts.map((row) => (
                    <li className="reviews_dist_row" key={row.stars}>
                      <span className="reviews_dist_num">{row.stars}</span>
                      <Stars value={row.stars} size={16} />
                      <span className="reviews_dist_count">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="reviews_main">
                <ul className="reviews_list">
                  {reviews.map((review) => (
                    <li className="reviews_item" key={review.id}>
                      <div className="reviews_author">
                        <span className="reviews_author_icon"><IconUser size={18} /></span>
                        <span className="reviews_author_name">{review.author}</span>
                      </div>
                      <div className="reviews_row">
                        <Stars value={review.rating} size={16} />
                        <time className="reviews_date">{formatDate(review.created_at)}</time>
                      </div>
                      <p className="reviews_text">{review.text}</p>
                    </li>
                  ))}
                  {reviews.length === 0 && <li className="reviews_empty">Отзывов пока нет — станьте первым</li>}
                </ul>

                <form className="reviews_form" onSubmit={sendReview}>
                  <div className="reviews_rate">
                    <span className="reviews_rate_label">Ваша оценка</span>
                    <Stars value={rating} size={24} onSelect={setRating} hover={hoverRating} onHover={setHoverRating} />
                  </div>
                  <textarea
                    className="reviews_textarea"
                    placeholder="Отзыв"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button className={`reviews_submit ${canSend ? 'active' : ''}`} type="submit" disabled={!canSend}>
                    Отправить отзыв
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <ProductSection title="Акции" linkText="Все акции" linkTo="/search?promo=1&title=Акции" products={promo} />
      </main>
      <Footer />
    </div>
  );
}
