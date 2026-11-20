import { Link } from 'react-router-dom';
import { IconChevronRight } from '../Icons/Icons.jsx';
import ProductGrid from '../ProductGrid/ProductGrid.jsx';
import './ProductSection.scss';

export default function ProductSection({ title, linkText, linkTo, products }) {
  return (
    <section className="product_section">
      <div className="product_section_center">
        <div className="section_title_row">
          <h2 className="section_title">{title}</h2>
          <Link to={linkTo} className="section_link">
            <span>{linkText}</span>
            <IconChevronRight size={20} />
          </Link>
        </div>
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
