import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, toQuery } from '../../api/api.js';
import { useTitle } from '../../utils/useTitle.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx';
import './Search.scss';

const LIMIT = 16;

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const promo = params.get('promo') === '1';
  const isNew = params.get('isNew') === '1';
  const listTitle = params.get('title') || '';

  useTitle(q ? `Поиск: ${q}` : listTitle || 'Поиск');

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (nextPage, append) => {
    setLoading(true);
    return api.get(`/products?${toQuery({ q, promo, isNew, page: nextPage, limit: LIMIT })}`)
      .then((data) => {
        setItems((current) => (append ? [...current, ...data.items] : data.items));
        setPage(data.page);
        setPages(data.pages);
        setTotal(data.total);
        setError('');
      })
      .catch(() => setError('Не удалось загрузить товары. Проверьте, что запущен backend.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <h1 className="search_title">{listTitle || 'Все товары'}</h1>
          )}

          {error && <div className="empty_state"><div className="empty_state_title">{error}</div></div>}

          {!error && !loading && items.length === 0 && (
            <div className="empty_state">
              <div className="empty_state_title">Ничего не найдено</div>
              <p>Попробуйте изменить запрос или поискать в каталоге</p>
            </div>
          )}

          {items.length > 0 && <ProductGrid products={items} />}

          {page < pages && (
            <div className="search_more">
              <button className="search_more_btn" disabled={loading} onClick={() => load(page + 1, true)}>
                Показать ещё
              </button>
              <span className="search_more_info">Показано {items.length} из {total}</span>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
