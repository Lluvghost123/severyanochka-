import { Link } from 'react-router-dom';
import { useCategories } from '../../utils/useCategories.js';
import { useTitle } from '../../utils/useTitle.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import './Catalog.scss';

export default function Catalog() {
  useTitle('Каталог');
  const categories = useCategories();
  const tiles = [...categories].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="page_wrapper">
      <Header />
      <main className="page_main">
        <div className="page_container">
          <Breadcrumbs items={[{ title: 'Главная', to: '/' }, { title: 'Каталог' }]} />
          <h1 className="page_title">Каталог</h1>

          <div className="catalog_grid">
            {tiles.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="catalog_tile"
                style={{ backgroundImage: `url(${category.image})` }}
              >
                <span className="catalog_tile_title">{category.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
