import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/api.js';
import { useApp } from '../../context/AppContext.jsx';
import { formatDate, formatPrice, ORDER_STATUS, plural } from '../../utils/format.js';
import { useTitle } from '../../utils/useTitle.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import './Orders.scss';

export default function Orders() {
  useTitle('Заказы');
  const { user, setLoginOpen } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api.get('/orders')
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="page_wrapper">
      <Header />
      <main className="page_main">
        <div className="page_container">
          <Breadcrumbs items={[{ title: 'Главная', to: '/' }, { title: 'Заказы' }]} />
          <h1 className="page_title">Заказы</h1>

          {!user ? (
            <div className="empty_state">
              <div className="empty_state_title">Войдите, чтобы увидеть заказы</div>
              <button className="empty_state_btn" onClick={() => setLoginOpen(true)}>Войти</button>
            </div>
          ) : orders.length === 0 ? (
            !loading && (
              <div className="empty_state">
                <div className="empty_state_title">Заказов пока нет</div>
                <Link to="/catalog" className="empty_state_btn">Перейти в каталог</Link>
              </div>
            )
          ) : (
            <ul className="orders_list">
              {orders.map((order) => {
                const count = order.items.reduce((s, i) => s + i.quantity, 0);
                return (
                  <li className="orders_item" key={order.id}>
                    <div className="orders_head">
                      <div className="orders_head_main">
                        <span className="orders_number">Заказ №{order.id}</span>
                        <time className="orders_date">от {formatDate(order.created_at)}</time>
                      </div>
                      <span className={`orders_status ${order.status}`}>{ORDER_STATUS[order.status] || order.status}</span>
                    </div>

                    <div className="orders_products">
                      {order.items.map((item, index) => (
                        <Link
                          key={`${item.product_id}-${index}`}
                          to={item.product_id ? `/product/${item.product_id}` : '#'}
                          className="orders_product"
                          title={item.title}
                        >
                          {item.image && <img src={item.image} alt="" />}
                          {item.quantity > 1 && <span className="orders_product_qty">×{item.quantity}</span>}
                        </Link>
                      ))}
                    </div>

                    <div className="orders_foot">
                      <span className="orders_address">{order.address}</span>
                      <span className="orders_sum">
                        {count} {plural(count, ['товар', 'товара', 'товаров'])} · <b>{formatPrice(order.total)}</b>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
