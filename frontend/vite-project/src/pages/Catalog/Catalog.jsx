import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fallbackCategories } from '../../data/fallback.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx';
import './Catalog.scss';

export default function Catalog() {
  const [categories, setCategories] = useState(fallbackCategories);

  useEffect(() => {
    fetch('http://localhost:3000/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="page_wrapper">
      <Header />
      <main className="page_main">
        <div className="page_container">
          <Breadcrumbs items={[{ title: 'Главная', to: '/' }, { title: 'Каталог' }]} />
          <h1 className="page_title">Каталог</h1>

          <div className="catalog_grid">
            {categories.map((category) => (
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
