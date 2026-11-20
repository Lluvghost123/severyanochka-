import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/api.js';
import { useApp } from '../../context/AppContext.jsx';
import { formatPrice, plural } from '../../utils/format.js';
import { useTitle } from '../../utils/useTitle.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import { IconTrash } from '../../components/Icons/Icons.jsx';
import './Cart.scss';

export default function Cart() {
  useTitle('Корзина');
  const navigate = useNavigate();
  const { user, setUser, cart, setQuantity, clearCart, setLoginOpen, showToast } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api.get('/cart')
      .then((data) => setItems(data.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user]);

  // количество берём из контекста — там оно обновляется мгновенно
  const rows = items.filter((item) => (cart[item.id] || 0) > 0);
  const total = rows.reduce((sum, item) => sum + (item.card_price ?? item.price) * cart[item.id], 0);
  const bonus = rows.reduce((sum, item) => sum + item.bonus * cart[item.id], 0);
  const count = rows.reduce((sum, item) => sum + cart[item.id], 0);

  const order = async () => {
    setSending(true);
    try {
      const result = await api.post('/orders', { address });
      clearCart();
      const me = await api.get('/auth/me');
      setUser(me.user);
      showToast(`Заказ №${result.id} оформлен. Начислено бонусов: ${result.bonus}`);
      navigate('/orders');
    } catch (e) {
      showToast(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page_wrapper">
      <Header />
      <main className="page_main">
        <div className="page_container">
          <Breadcrumbs items={[{ title: 'Главная', to: '/' }, { title: 'Корзина' }]} />
          <h1 className="page_title">Корзина</h1>

          {!user ? (
            <div className="empty_state">
              <div className="empty_state_title">Войдите, чтобы оформить заказ</div>
              <button className="empty_state_btn" onClick={() => setLoginOpen(true)}>Войти</button>
            </div>
          ) : rows.length === 0 ? (
            !loading && (
              <div className="empty_state">
                <div className="empty_state_title">Корзина пуста</div>
                <p>Добавьте товары из каталога</p>
                <Link to="/catalog" className="empty_state_btn">Перейти в каталог</Link>
              </div>
            )
          ) : (
            <div className="cart_layout">
              <ul className="cart_list">
                {rows.map((item) => (
                  <li className="cart_item" key={item.id}>
                    <Link to={`/product/${item.id}`} className="cart_item_img_wrap">
                      <img
                        className={`cart_item_img ${item.image && item.image.includes('/photo_') ? 'cover' : ''}`}
                        src={item.image}
                        alt=""
                      />
                    </Link>
                    <div className="cart_item_info">
                      <Link to={`/product/${item.id}`} className="cart_item_title">{item.title}</Link>
                      <div className="cart_item_unit">{formatPrice(item.card_price ?? item.price)} за шт.</div>
                    </div>
                    <div className="cart_item_stepper">
                      <button onClick={() => setQuantity(item.id, cart[item.id] - 1)} aria-label="Меньше">−</button>
                      <span>{cart[item.id]}</span>
                      <button onClick={() => setQuantity(item.id, cart[item.id] + 1)} aria-label="Больше">+</button>
                    </div>
                    <div className="cart_item_sum">{formatPrice((item.card_price ?? item.price) * cart[item.id])}</div>
                    <button className="cart_item_remove" onClick={() => setQuantity(item.id, 0)} aria-label="Удалить">
                      <IconTrash size={22} />
                    </button>
                  </li>
                ))}
              </ul>

              <aside className="cart_summary">
                <div className="cart_summary_row">
                  <span>{count} {plural(count, ['товар', 'товара', 'товаров'])}</span>
                  <span className="cart_summary_total">{formatPrice(total)}</span>
                </div>
                <div className="cart_summary_row small">
                  <span>Бонусов за заказ</span>
                  <span className="cart_summary_bonus">+{bonus}</span>
                </div>
                <div className="cart_summary_row small">
                  <span>Доставка</span>
                  <span>{total >= 1000 ? 'бесплатно' : 'от 1000 ₽ бесплатно'}</span>
                </div>
                <label className="cart_summary_field">
                  <span>Адрес доставки</span>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Город, улица, дом, квартира"
                  />
                </label>
                <button
                  className={`cart_summary_btn ${address.trim().length >= 5 && !sending ? 'active' : ''}`}
                  disabled={address.trim().length < 5 || sending}
                  onClick={order}
                >
                  Оформить заказ
                </button>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
