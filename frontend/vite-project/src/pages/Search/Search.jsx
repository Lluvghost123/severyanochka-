import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx';
import './Search.scss';

const STEP = 16;

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const promo = params.get('promo') === '1';
  const isNew = params.get('isNew') === '1';
  const listTitle = params.get('title') || 'Все товары';

  const [products, setProducts] = useState([]);
  const [shown, setShown] = useState(STEP);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let url = `http://localhost:3000/api/products?search=${encodeURIComponent(q)}`;
    if (promo) url += '&promo=1';
    if (isNew) url += '&isNew=1';

    setLoading(true);
    setShown(STEP);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [q, promo, isNew]);

  return (
    <div className="page_wrapper">
      <Header />
      <main className="page_main">
        <div className="page_container search_container">
          {q ? (
            <>
              <h1 className="search_title">Результат поиска</h1>
              <p className="search_subtitle">
                по запросу <span className="search_query">{q}</span>
              </p>
            </>
          ) : (
            <h1 className="search_title">{listTitle}</h1>
          )}

          {error && <div className="empty_state"><div className="empty_state_title">Не удалось загрузить товары. Проверьте, что запущен сервер.</div></div>}

          {!error && !loading && products.length === 0 && (
            <div className="empty_state">
              <div className="empty_state_title">Ничего не найдено</div>
              <p>Попробуйте изменить запрос или поискать в каталоге</p>
            </div>
          )}

          {products.length > 0 && <ProductGrid products={products.slice(0, shown)} />}

          {shown < products.length && (
            <div className="search_more">
              <button className="search_more_btn" onClick={() => setShown(shown + STEP)}>
                Показать ещё
              </button>
              <span className="search_more_info">Показано {shown} из {products.length}</span>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
