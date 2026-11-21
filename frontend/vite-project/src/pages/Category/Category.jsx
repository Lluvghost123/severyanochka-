import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fallbackCategories } from '../../data/fallback.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import { IconClose } from '../../components/Icons/Icons.jsx';
import './Category.scss';

const STEP = 6;

const tagList = [
  { key: 'is_own', title: 'Товары нашего производства' },
  { key: 'is_healthy', title: 'Полезное питание' },
  { key: 'is_nogmo', title: 'Без ГМО' },
];

// цена, которую видит покупатель с картой
const getPrice = (p) => Number(p.card_price || p.price);

export default function Category() {
  const { slug } = useParams();
  const category = fallbackCategories.find(c => c.slug === slug);

  const [products, setProducts] = useState([]);
  const [error, setError] = useState(false);
  const [shown, setShown] = useState(STEP);
  const [filterOpen, setFilterOpen] = useState(false);
  const [tags, setTags] = useState([]);

  // form — то, что вводит пользователь, filter — применённые значения (кнопка «Применить»)
  const emptyFilter = { min: '', max: '', sub: '', inStock: false };
  const [form, setForm] = useState(emptyFilter);
  const [filter, setFilter] = useState(emptyFilter);

  useEffect(() => {
    fetch(`http://localhost:3000/api/products?category=${slug}`)
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setError(false);
      })
      .catch(() => setError(true));
    setForm(emptyFilter);
    setFilter(emptyFilter);
    setTags([]);
    setShown(STEP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // границы цены и список подкатегорий берём из товаров категории
  const prices = products.map(getPrice);
  const minBound = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const maxBound = prices.length ? Math.ceil(Math.max(...prices)) : 0;
  const subcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))];

  const lo = form.min === '' ? minBound : Number(form.min);
  const hi = form.max === '' ? maxBound : Number(form.max);

  const filtered = products.filter(p => {
    if (filter.min !== '' && getPrice(p) < Number(filter.min)) return false;
    if (filter.max !== '' && getPrice(p) > Number(filter.max)) return false;
    if (filter.sub && p.subcategory !== filter.sub) return false;
    if (filter.inStock && !p.in_stock) return false;
    return tags.every(tag => p[tag]);
  });

  const pages = Math.max(Math.ceil(filtered.length / STEP), 1);
  const page = Math.min(Math.ceil(shown / STEP), pages);

  const toggleTag = (key) => {
    setTags(tags.includes(key) ? tags.filter(t => t !== key) : [...tags, key]);
    setShown(STEP);
  };

  const apply = () => {
    setFilter(form);
    setShown(STEP);
    setFilterOpen(false);
  };

  const clearAll = () => {
    setForm(emptyFilter);
    setFilter(emptyFilter);
    setTags([]);
    setShown(STEP);
  };

  const hasFilter = filter.min !== '' || filter.max !== '' || filter.sub || filter.inStock || tags.length > 0;

  const chipsBlock = hasFilter && (
    <div className="category_chips">
      {filter.sub && (
        <button className="category_chip" onClick={() => { setForm({ ...form, sub: '' }); setFilter({ ...filter, sub: '' }); }}>
          <span>{filter.sub}</span>
          <IconClose size={18} />
        </button>
      )}
      {(filter.min !== '' || filter.max !== '') && (
        <button className="category_chip" onClick={() => { setForm({ ...form, min: '', max: '' }); setFilter({ ...filter, min: '', max: '' }); }}>
          <span>Цена от {filter.min === '' ? minBound : filter.min} до {filter.max === '' ? maxBound : filter.max}</span>
          <IconClose size={18} />
        </button>
      )}
      {filter.inStock && (
        <button className="category_chip" onClick={() => { setForm({ ...form, inStock: false }); setFilter({ ...filter, inStock: false }); }}>
          <span>В наличии</span>
          <IconClose size={18} />
        </button>
      )}
      <button className="category_chip clear" onClick={clearAll}>
        <span>Очистить фильтры</span>
        <IconClose size={18} />
      </button>
    </div>
  );

  return (
    <div className="page_wrapper">
      <Header />
      <main className="page_main">
        <div className="page_container">
          <Breadcrumbs items={[
            { title: 'Главная', to: '/' },
            { title: 'Каталог', to: '/catalog' },
            { title: category ? category.title : '' },
          ]} />
          <h1 className="page_title category_title">{category ? category.title : 'Категория'}</h1>

          <div className="category_tags">
            {tagList.map((tag) => (
              <button
                key={tag.key}
                className={`category_tag ${tags.includes(tag.key) ? 'active' : ''}`}
                onClick={() => toggleTag(tag.key)}
              >
                {tag.title}
              </button>
            ))}
          </div>

          <button className="category_filter_open" onClick={() => setFilterOpen(true)}>Фильтр</button>

          <div className="category_layout">
            <div className={`category_overlay ${filterOpen ? 'open' : ''}`} onClick={() => setFilterOpen(false)} />

            <aside className={`category_filter ${filterOpen ? 'open' : ''}`}>
              <div className="category_filter_head">
                <span>Фильтр</span>
                <button className="category_filter_close" onClick={() => setFilterOpen(false)} aria-label="Закрыть">
                  <IconClose size={22} />
                </button>
              </div>

              <div className="category_chips_drawer">{chipsBlock}</div>

              <div className="category_filter_block">
                <div className="category_filter_row">
                  <span className="category_filter_label">Цена</span>
                  <button className="category_filter_clear" onClick={() => setForm({ ...form, min: '', max: '' })}>
                    Очистить
                  </button>
                </div>

                <div className="category_price_inputs">
                  <input
                    className="category_price_input"
                    type="number"
                    value={lo}
                    onChange={(e) => setForm({ ...form, min: e.target.value })}
                  />
                  <span className="category_price_dash">—</span>
                  <input
                    className="category_price_input"
                    type="number"
                    value={hi}
                    onChange={(e) => setForm({ ...form, max: e.target.value })}
                  />
                </div>

                <div className="category_slider">
                  <div className="category_slider_track" />
                  <div
                    className="category_slider_range"
                    style={{
                      left: `${maxBound > minBound ? ((lo - minBound) / (maxBound - minBound)) * 100 : 0}%`,
                      right: `${maxBound > minBound ? 100 - ((hi - minBound) / (maxBound - minBound)) * 100 : 0}%`,
                    }}
                  />
                  <input
                    className="category_slider_input"
                    type="range"
                    min={minBound}
                    max={maxBound}
                    value={lo}
                    onChange={(e) => setForm({ ...form, min: String(Math.min(Number(e.target.value), hi)) })}
                  />
                  <input
                    className="category_slider_input"
                    type="range"
                    min={minBound}
                    max={maxBound}
                    value={hi}
                    onChange={(e) => setForm({ ...form, max: String(Math.max(Number(e.target.value), lo)) })}
                  />
                </div>
              </div>

              {subcategories.length > 0 && (
                <ul className="category_subs">
                  {subcategories.map((sub) => (
                    <li key={sub}>
                      <button
                        className={`category_sub ${form.sub === sub ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, sub: form.sub === sub ? '' : sub })}
                      >
                        {sub}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <label className="category_switch">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                />
                <span className="category_switch_track"><span className="category_switch_thumb" /></span>
                <span className="category_switch_label">В наличии</span>
              </label>

              <button className="category_apply" onClick={apply}>Применить</button>
            </aside>

            <section className="category_content">
              <div className="category_chips_desktop">{chipsBlock}</div>

              {error && (
                <div className="empty_state">
                  <div className="empty_state_title">Не удалось загрузить товары. Проверьте, что запущен сервер.</div>
                </div>
              )}

              {!error && filtered.length === 0 && (
                <div className="empty_state">
                  <div className="empty_state_title">Товары не найдены</div>
                  <p>Попробуйте изменить или сбросить фильтры</p>
                </div>
              )}

              {filtered.length > 0 && <ProductGrid products={filtered.slice(0, shown)} columns={3} />}

              {shown < filtered.length && (
                <div className="category_more">
                  <button className="category_more_btn" onClick={() => setShown(shown + STEP)}>Показать ещё</button>
                </div>
              )}

              <Pagination
                page={page}
                pages={pages}
                onChange={(n) => setShown(n * STEP)}
              />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
