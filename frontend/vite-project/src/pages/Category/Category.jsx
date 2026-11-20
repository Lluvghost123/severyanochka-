import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api, toQuery } from '../../api/api.js';
import { useCategories } from '../../utils/useCategories.js';
import { useTitle } from '../../utils/useTitle.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx';
import Pagination from '../../components/Pagination/Pagination.jsx';
import { IconClose } from '../../components/Icons/Icons.jsx';
import './Category.scss';

const LIMIT = 6;
const TAGS = [
  { key: 'own', title: 'Товары нашего производства' },
  { key: 'healthy', title: 'Полезное питание' },
  { key: 'nogmo', title: 'Без ГМО' },
];

const splitList = (value) => (value ? value.split(',').filter(Boolean) : []);

export default function Category() {
  const { slug } = useParams();
  const categories = useCategories();
  const category = categories.find((c) => c.slug === slug);
  useTitle(category ? category.title : 'Категория');

  const [params, setParams] = useSearchParams();
  const subs = splitList(params.get('sub'));
  const tags = splitList(params.get('tags'));
  const minParam = params.get('min') || '';
  const maxParam = params.get('max') || '';
  const inStock = params.get('inStock') === '1';
  const urlPage = parseInt(params.get('page'), 10) || 1;

  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(urlPage);
  const [meta, setMeta] = useState({ total: 0, pages: 1, priceRange: { min: 0, max: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // черновик фильтра в боковой панели — применяется кнопкой «Применить»
  const [draft, setDraft] = useState({ subs, min: minParam, max: maxParam, inStock });
  const [filterOpen, setFilterOpen] = useState(false);

  const filtersKey = `${slug}|${subs}|${tags}|${minParam}|${maxParam}|${inStock}|${urlPage}`;

  useEffect(() => {
    setDraft({ subs, min: minParam, max: maxParam, inStock });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, params.get('sub'), params.get('min'), params.get('max'), params.get('inStock')]);

  const fetchPage = (page) => api.get(`/products?${toQuery({
    category: slug,
    sub: subs.join(','),
    tags: tags.join(','),
    min: minParam,
    max: maxParam,
    inStock,
    page,
    limit: LIMIT,
  })}`);

  useEffect(() => {
    setLoading(true);
    fetchPage(urlPage)
      .then((data) => {
        setItems(data.items);
        setLoaded(data.page);
        setMeta({ total: data.total, pages: data.pages, priceRange: data.priceRange });
        setError('');
      })
      .catch(() => setError('Не удалось загрузить товары. Проверьте, что запущен backend.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const showMore = () => {
    setLoading(true);
    fetchPage(loaded + 1)
      .then((data) => {
        setItems((current) => [...current, ...data.items]);
        setLoaded(data.page);
      })
      .catch(() => setError('Не удалось загрузить товары'))
      .finally(() => setLoading(false));
  };

  const subcategories = category ? category.subcategories : [];
  const bounds = meta.priceRange;
  const lo = draft.min === '' ? bounds.min : Number(draft.min);
  const hi = draft.max === '' ? bounds.max : Number(draft.max);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === null || value === false || (Array.isArray(value) && value.length === 0)) next.delete(key);
      else next.set(key, Array.isArray(value) ? value.join(',') : value === true ? '1' : value);
    });
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const applyDraft = () => {
    const clampedMin = draft.min !== '' && Number(draft.min) > bounds.min ? draft.min : '';
    const clampedMax = draft.max !== '' && Number(draft.max) < bounds.max ? draft.max : '';
    update({ sub: draft.subs, min: clampedMin, max: clampedMax, inStock: draft.inStock });
    setFilterOpen(false);
  };

  const toggleTag = (key) => update({ tags: tags.includes(key) ? tags.filter((t) => t !== key) : [...tags, key] });
  const toggleDraftSub = (subSlug) => setDraft((d) => ({
    ...d,
    subs: d.subs.includes(subSlug) ? d.subs.filter((s) => s !== subSlug) : [...d.subs, subSlug],
  }));

  const chips = useMemo(() => {
    const list = [];
    subs.forEach((s) => {
      const sub = subcategories.find((x) => x.slug === s);
      if (sub) list.push({ key: `sub-${s}`, title: sub.title, remove: () => update({ sub: subs.filter((x) => x !== s) }) });
    });
    if (minParam || maxParam) {
      const from = minParam || bounds.min;
      const to = maxParam || bounds.max;
      list.push({ key: 'price', title: `Цена от ${from} до ${to}`, remove: () => update({ min: '', max: '' }) });
    }
    if (inStock) list.push({ key: 'stock', title: 'В наличии', remove: () => update({ inStock: false }) });
    tags.forEach((t) => {
      const tag = TAGS.find((x) => x.key === t);
      if (tag) list.push({ key: `tag-${t}`, title: tag.title, remove: () => toggleTag(t) });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, subcategories, bounds.min, bounds.max]);

  const clearAll = () => setParams(new URLSearchParams());

  const chipsBlock = chips.length > 0 && (
    <div className="category_chips">
      {chips.map((chip) => (
        <button className="category_chip" key={chip.key} onClick={chip.remove}>
          <span>{chip.title}</span>
          <IconClose size={18} />
        </button>
      ))}
      <button className="category_chip clear" onClick={clearAll}>
        <span>Очистить фильтры</span>
        <IconClose size={18} />
      </button>
    </div>
  );

  if (!category && categories.length > 0) {
    return (
      <div className="page_wrapper">
        <Header />
        <main className="page_main">
          <div className="page_container">
            <div className="empty_state"><div className="empty_state_title">Категория не найдена</div></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
          <h1 className="page_title category_title">{category ? category.title : ''}</h1>

          <div className="category_tags">
            {TAGS.map((tag) => (
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
                  <button
                    className="category_filter_clear"
                    onClick={() => setDraft((d) => ({ ...d, min: '', max: '' }))}
                  >
                    Очистить
                  </button>
                </div>

                <div className="category_price_inputs">
                  <input
                    className="category_price_input"
                    type="number"
                    value={lo}
                    min={bounds.min}
                    max={bounds.max}
                    onChange={(e) => setDraft((d) => ({ ...d, min: e.target.value }))}
                  />
                  <span className="category_price_dash">—</span>
                  <input
                    className="category_price_input"
                    type="number"
                    value={hi}
                    min={bounds.min}
                    max={bounds.max}
                    onChange={(e) => setDraft((d) => ({ ...d, max: e.target.value }))}
                  />
                </div>

                <div className="category_slider">
                  <div className="category_slider_track" />
                  <div
                    className="category_slider_range"
                    style={{
                      left: `${bounds.max > bounds.min ? ((lo - bounds.min) / (bounds.max - bounds.min)) * 100 : 0}%`,
                      right: `${bounds.max > bounds.min ? 100 - ((hi - bounds.min) / (bounds.max - bounds.min)) * 100 : 0}%`,
                    }}
                  />
                  <input
                    className="category_slider_input"
                    type="range"
                    min={bounds.min}
                    max={bounds.max}
                    value={lo}
                    onChange={(e) => setDraft((d) => ({ ...d, min: String(Math.min(Number(e.target.value), hi)) }))}
                    aria-label="Минимальная цена"
                  />
                  <input
                    className="category_slider_input"
                    type="range"
                    min={bounds.min}
                    max={bounds.max}
                    value={hi}
                    onChange={(e) => setDraft((d) => ({ ...d, max: String(Math.max(Number(e.target.value), lo)) }))}
                    aria-label="Максимальная цена"
                  />
                </div>
              </div>

              {subcategories.length > 0 && (
                <ul className="category_subs">
                  {subcategories.map((sub) => (
                    <li key={sub.id}>
                      <button
                        className={`category_sub ${draft.subs.includes(sub.slug) ? 'active' : ''}`}
                        onClick={() => toggleDraftSub(sub.slug)}
                      >
                        {sub.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <label className="category_switch">
                <input
                  type="checkbox"
                  checked={draft.inStock}
                  onChange={(e) => setDraft((d) => ({ ...d, inStock: e.target.checked }))}
                />
                <span className="category_switch_track"><span className="category_switch_thumb" /></span>
                <span className="category_switch_label">В наличии</span>
              </label>

              <button className="category_apply" onClick={applyDraft}>Применить</button>
            </aside>

            <section className="category_content">
              <div className="category_chips_desktop">{chipsBlock}</div>

              {error && <div className="empty_state"><div className="empty_state_title">{error}</div></div>}

              {!error && !loading && items.length === 0 && (
                <div className="empty_state">
                  <div className="empty_state_title">Товары не найдены</div>
                  <p>Попробуйте изменить или сбросить фильтры</p>
                </div>
              )}

              {items.length > 0 && <ProductGrid products={items} columns={3} />}

              {loaded < meta.pages && (
                <div className="category_more">
                  <button className="category_more_btn" disabled={loading} onClick={showMore}>Показать ещё</button>
                </div>
              )}

              <Pagination
                page={loaded}
                pages={meta.pages}
                onChange={(page) => {
                  update({ page: page === 1 ? '' : page });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
