import { Link } from 'react-router-dom';
import { IconChevronRight } from '../Icons/Icons.jsx';
import './Breadcrumbs.scss';

export default function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Навигационная цепочка">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span className="breadcrumbs_item" key={`${item.title}-${index}`}>
            {last || !item.to ? (
              <span className="breadcrumbs_current">{item.title}</span>
            ) : (
              <Link to={item.to} className="breadcrumbs_link">{item.title}</Link>
            )}
            {!last && <span className="breadcrumbs_sep"><IconChevronRight size={16} /></span>}
          </span>
        );
      })}
    </nav>
  );
}
