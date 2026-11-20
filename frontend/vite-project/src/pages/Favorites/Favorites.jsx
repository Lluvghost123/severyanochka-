import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/api.js';
import { useApp } from '../../context/AppContext.jsx';
import { useTitle } from '../../utils/useTitle.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx';

export default function Favorites() {
  useTitle('Избранное');
  const { user, favorites, setLoginOpen } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api.get('/favorites')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user]);

  // убранные из избранного товары сразу исчезают из списка
  const visible = items.filter((item) => favorites.includes(item.id));

  return (
    <div className="page_wrapper">
      <Header />
      <main className="page_main">
        <div className="page_container">
          <Breadcrumbs items={[{ title: 'Главная', to: '/' }, { title: 'Избранное' }]} />
          <h1 className="page_title">Избранное</h1>

          {!user ? (
            <div className="empty_state">
              <div className="empty_state_title">Войдите, чтобы увидеть избранное</div>
              <button className="empty_state_btn" onClick={() => setLoginOpen(true)}>Войти</button>
            </div>
          ) : visible.length > 0 ? (
            <ProductGrid products={visible} />
          ) : (
            !loading && (
              <div className="empty_state">
                <div className="empty_state_title">В избранном пока пусто</div>
                <p>Нажмите на сердечко у товара, чтобы он появился здесь</p>
                <Link to="/catalog" className="empty_state_btn">Перейти в каталог</Link>
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
