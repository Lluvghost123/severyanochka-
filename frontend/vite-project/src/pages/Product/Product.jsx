import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/api.js';
import { useApp } from '../../context/AppContext.jsx';
import { fallbackPromo } from '../../data/fallback.js';
import { formatDate, formatPrice, plural } from '../../utils/format.js';
import { useTitle } from '../../utils/useTitle.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx';
import ProductSection from '../../components/Home/ProductSection.jsx';
import Stars from '../../components/Stars/Stars.jsx';
import {
  IconBell, IconCart, IconHeart, IconInfo, IconLeaf, IconShare, IconUser,
} from '../../components/Icons/Icons.jsx';
import './Product.scss';

export default function Product() {
  const { id } = useParams();
  const { user, favorites, cart, toggleFavorite, setQuantity, requireAuth, showToast } = useApp();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [promo, setPromo] = useState(fallbackPromo);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useTitle(product ? product.title : 'Товар');

  const load = () => api.get(`/products/${id}`)
    .then((data) => {
      setProduct(data);
      setError('');
    })
    .catch((e) => {
      setProduct(null);
      setError(e.status === 404 ? 'Товар не найден' : 'Не удалось загрузить товар. Проверьте, что запущен backend.');
    });

  useEffect(() => {
    setActiveImage(0);
    setRating(0);
    setText('');
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  useEffect(() => {
    api.get('/home?limit=4').then((data) => data.promo.length && setPromo(data.promo)).catch(() => {});
  }, []);

  if (!product) {
    return (
      <div className="page_wrapper">
        <Header />
        <main className="page_main">
          <div className="page_container">
            {error && (
              <div className="empty_state">
                <div className="empty_state_title">{error}</div>
                <Link to="/catalog" className="empty_state_btn">Перейти в каталог</Link>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isFavorite = favorites.includes(product.id);
  const quantity = cart[product.id] || 0;
  const hasCardPrice = product.card_price !== null;
  const gallery = product.images.length > 0 ? product.images : [''];
  const isPhoto = gallery[activeImage].includes('/photo_');

  const rows = [
    ['Бренд', product.brand],
    ['Страна производителя', product.country],
    ['Упаковка', product.package],
    ...Object.entries(product.specs || {}).filter(([key]) => key !== 'Упаковка'),
  ].filter(([, value]) => value);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Ссылка на товар скопирована');
    } catch {
      showToast('Не удалось скопировать ссылку');
    }
  };

  const toggleAlert = async () => {
    if (!requireAuth()) return;
    try {
      const data = await api.post(`/products/${product.id}/price-alert`);
      setProduct((p) => ({ ...p, price_alert: data.active }));
      showToast(data.active ? 'Сообщим, когда цена снизится' : 'Уведомление отключено');
    } catch (e) {
      showToast(e.message);
    }
  };

  const sendReview = async (event) => {
    event.preventDefault();
    if (!requireAuth() || rating === 0 || text.trim().length < 3) return;
    setSending(true);
    try {
      await api.post(`/products/${product.id}/reviews`, { rating, text });
      setRating(0);
      setText('');
      await load();
      showToast('Спасибо за отзыв!');
    } catch (e) {
      showToast(e.message);
    } finally {
      setSending(false);
    }
  };

  const canSend = rating > 0 && text.trim().length >= 3 && !sending;
  const total = product.distribution.reduce((s, d) => s + d.count, 0);

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
              <Stars value={product.rating} size={16} />
              <a className="product_reviews_link" href="#reviews">
                {product.reviews_count} {plural(product.reviews_count, ['отзыв', 'отзыва', 'отзывов'])}
              </a>
            </span>
            <button className="product_meta_btn" onClick={share}>
              <IconShare size={24} />
              <span>Поделиться</span>
            </button>
            <button className={`product_meta_btn ${isFavorite ? 'active' : ''}`} onClick={() => toggleFavorite(product.id)}>
              <IconHeart size={24} filled={isFavorite} />
              <span>{isFavorite ? 'В избранном' : 'В избранное'}</span>
            </button>
          </div>

          <div className="product_top">
            <div className="product_thumbs">
              {gallery.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  className={`product_thumb ${index === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>

            <div className="product_gallery">
              <img className={`product_gallery_img ${isPhoto ? 'cover' : ''}`} src={gallery[activeImage]} alt={product.title} />
              {product.discount ? <span className="product_badge">-{product.discount}%</span> : null}
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
                      <span className="product_price_hint" title="Цена действует при предъявлении карты покупателя"><IconInfo size={22} /></span>
                    </span>
                  )}
                </div>
              </div>

              {!product.in_stock ? (
                <button className="product_buy disabled" disabled>Нет в наличии</button>
              ) : quantity === 0 ? (
                <button className="product_buy" onClick={() => setQuantity(product.id, 1)}>
                  <IconCart size={32} />
                  <span>В корзину</span>
                </button>
              ) : (
                <div className="product_stepper">
                  <button className="product_step" onClick={() => setQuantity(product.id, quantity - 1)} aria-label="Меньше">−</button>
                  <Link to="/cart" className="product_stepper_text">{quantity} в корзине · перейти</Link>
                  <button className="product_step" onClick={() => setQuantity(product.id, quantity + 1)} aria-label="Больше">+</button>
                </div>
              )}

              {product.bonus > 0 && (
                <div className="product_bonus">
                  <IconLeaf size={22} />
                  <span>Вы получаете <b>{product.bonus} {plural(product.bonus, ['бонус', 'бонуса', 'бонусов'])}</b></span>
                </div>
              )}

              <button className={`product_alert ${product.price_alert ? 'active' : ''}`} onClick={toggleAlert}>
                <IconBell size={26} off={!product.price_alert} />
                <span>{product.price_alert ? 'Сообщим о снижении цены' : 'Уведомить о снижении цены'}</span>
              </button>

              <table className="product_specs">
                <tbody>
                  {rows.map(([name, value]) => (
                    <tr key={name}>
                      <td className="product_specs_name">{name}</td>
                      <td className="product_specs_value">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <aside className="product_similar">
              <div className="product_similar_title">Похожие</div>
              {product.similar.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`} className="product_similar_card">
                  <img
                    className={`product_similar_img ${item.image && item.image.includes('/photo_') ? 'cover' : ''}`}
                    src={item.image}
                    alt={item.title}
                  />
                  <span className="product_similar_price">{formatPrice(item.card_price ?? item.price)}</span>
                </Link>
              ))}
            </aside>
          </div>
        </div>

        {product.related.length > 0 && (
          <section className="product_block">
            <div className="page_container">
              <h2 className="section_title product_block_title">С этим товаром покупают</h2>
              <ProductGrid products={product.related} />
            </div>
          </section>
        )}

        <section className="product_block" id="reviews">
          <div className="page_container">
            <h2 className="section_title product_block_title">Отзывы</h2>

            <div className="reviews">
              <div className="reviews_summary">
                <div className="reviews_avg">
                  <Stars value={product.rating} size={16} />
                  <span className="reviews_avg_text">
                    {total > 0 ? `${String(product.rating_avg).replace('.', ',')} из 5` : 'Оценок пока нет'}
                  </span>
                </div>
                <ul className="reviews_dist">
                  {product.distribution.map((row) => (
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
                  {product.reviews.map((review) => (
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
                  {product.reviews.length === 0 && <li className="reviews_empty">Отзывов пока нет — станьте первым</li>}
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
                    maxLength={2000}
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
