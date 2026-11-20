import { IconChevronLeft, IconChevronRight, IconDoubleLeft, IconDoubleRight } from '../Icons/Icons.jsx';
import './Pagination.scss';

function pageList(page, pages) {
  if (pages <= 8) return Array.from({ length: pages }, (_, i) => i + 1);
  const result = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 4) [2, 3, 4, 5].forEach((n) => result.add(n));
  if (page >= pages - 3) [pages - 1, pages - 2, pages - 3, pages - 4].forEach((n) => result.add(n));
  const sorted = [...result].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push('gap' + n);
    out.push(n);
  });
  return out;
}

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Страницы">
      <button className="pagination_arrow" disabled={page === 1} onClick={() => onChange(1)} aria-label="Первая">
        <IconDoubleLeft size={20} />
      </button>
      <button className="pagination_arrow" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Назад">
        <IconChevronLeft size={20} />
      </button>
      {pageList(page, pages).map((item) =>
        typeof item === 'string' ? (
          <span className="pagination_gap" key={item}>…</span>
        ) : (
          <button
            key={item}
            className={`pagination_page ${item === page ? 'active' : ''}`}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        )
      )}
      <button className="pagination_arrow" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Вперёд">
        <IconChevronRight size={20} />
      </button>
      <button className="pagination_arrow" disabled={page === pages} onClick={() => onChange(pages)} aria-label="Последняя">
        <IconDoubleRight size={20} />
      </button>
    </nav>
  );
}
