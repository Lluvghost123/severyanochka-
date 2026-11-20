import ProductCard from '../ProductCard/ProductCard.jsx';
import './ProductGrid.scss';

export default function ProductGrid({ products, columns = 4 }) {
  return (
    <div className={`product_grid columns_${columns}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
