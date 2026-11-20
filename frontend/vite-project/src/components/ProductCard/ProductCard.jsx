import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { formatPrice } from '../../utils/format.js';
import { IconHeart } from '../Icons/Icons.jsx';
import Stars from '../Stars/Stars.jsx';
import './ProductCard.scss';

export default function ProductCard({ product }) {
  const { favorites, cart, toggleFavorite, setQuantity } = useApp();
  const isFavorite = favorites.includes(product.id);
  const quantity = cart[product.id] || 0;
  const hasCardPrice = product.card_price !== null && product.card_price !== undefined;
  const isPhoto = product.image && product.image.includes('/photo_');

  return (
    <article className={`product_card ${!product.in_stock ? 'unavailable' : ''}`}>
      <Link to={`/product/${product.id}`} className="product_card_image_wrap">
        <img
          className={`product_card_image ${isPhoto ? 'cover' : ''}`}
          src={product.image}
          alt={product.title}
          loading="lazy"
        />
        {product.discount ? <span className="product_card_badge">-{product.discount}%</span> : null}
      </Link>

      <button
        className={`product_card_fav ${isFavorite ? 'active' : ''}`}
        onClick={() => toggleFavorite(product.id)}
        aria-label={isFavorite ? 'Убрать из избранного' : 'В избранное'}
      >
        <IconHeart size={24} filled={isFavorite} />
      </button>

      <div className="product_card_body">
        <div className="product_card_prices">
          <div className="product_card_price_block">
            <span className="product_card_price">
              {formatPrice(hasCardPrice ? product.card_price : product.price)}
            </span>
            {hasCardPrice && <span className="product_card_price_label">С картой</span>}
          </div>
          {hasCardPrice && (
            <div className="product_card_price_block old">
              <span className="product_card_price_old">{formatPrice(product.price)}</span>
              <span className="product_card_price_label">Обычная</span>
            </div>
          )}
        </div>

        <Link to={`/product/${product.id}`} className="product_card_title">{product.title}</Link>

        <div className="product_card_rating">
          <Stars value={product.rating} size={16} />
        </div>

        {!product.in_stock ? (
          <button className="product_card_btn disabled" disabled>Нет в наличии</button>
        ) : quantity === 0 ? (
          <button className="product_card_btn" onClick={() => setQuantity(product.id, 1)}>
            В корзину
          </button>
        ) : (
          <div className="product_card_stepper">
            <button className="product_card_step" onClick={() => setQuantity(product.id, quantity - 1)} aria-label="Меньше">−</button>
            <Link to="/cart" className="product_card_qty">{quantity} в корзине</Link>
            <button className="product_card_step" onClick={() => setQuantity(product.id, quantity + 1)} aria-label="Больше">+</button>
          </div>
        )}
      </div>
    </article>
  );
}
