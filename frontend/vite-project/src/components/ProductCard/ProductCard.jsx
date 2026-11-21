import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, getDiscount } from '../../utils/format.js';
import { IconHeart } from '../Icons/Icons.jsx';
import Stars from '../Stars/Stars.jsx';
import './ProductCard.scss';

export default function ProductCard({ product }) {
  const [liked, setLiked] = useState(false);
  const [inCart, setInCart] = useState(false);

  const discount = getDiscount(product);
  const hasCardPrice = product.card_price !== null && product.card_price !== undefined;

  return (
    <article className={`product_card ${!product.in_stock ? 'unavailable' : ''}`}>
      <Link to={`/product/${product.id}`} className="product_card_image_wrap">
        <img className="product_card_image" src={product.image} alt={product.title} />
        {discount > 0 && <span className="product_card_badge">-{discount}%</span>}
      </Link>

      <button
        className={`product_card_fav ${liked ? 'active' : ''}`}
        onClick={() => setLiked(!liked)}
        aria-label="В избранное"
      >
        <IconHeart size={24} filled={liked} />
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
          <Stars value={Number(product.rating)} size={16} />
        </div>

        {!product.in_stock ? (
          <button className="product_card_btn disabled" disabled>Нет в наличии</button>
        ) : (
          <button
            className={`product_card_btn ${inCart ? 'active' : ''}`}
            onClick={() => setInCart(!inCart)}
          >
            {inCart ? 'В корзине' : 'В корзину'}
          </button>
        )}
      </div>
    </article>
  );
}
