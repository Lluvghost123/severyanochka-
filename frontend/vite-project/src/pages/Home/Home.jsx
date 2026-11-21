import { useEffect, useState } from 'react';
import { fallbackArticles, fallbackNews, fallbackOffers, fallbackPromo } from '../../data/fallback.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Hero from '../../components/Home/Hero.jsx';
import ProductSection from '../../components/Home/ProductSection.jsx';
import SpecialOffers from '../../components/Home/SpecialOffers.jsx';
import Stores from '../../components/Home/Stores.jsx';
import Articles from '../../components/Home/Articles.jsx';
import './Home.scss';

export default function Home() {
  const [promo, setPromo] = useState(fallbackPromo);
  const [news, setNews] = useState(fallbackNews);

  // Товары берём из PostgreSQL; если сервер недоступен — остаются массивы из data/fallback.js
  useEffect(() => {
    fetch('http://localhost:3000/api/products?promo=1&limit=4')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPromo(data);
        }
      })
      .catch(() => {});

    fetch('http://localhost:3000/api/products?isNew=1&limit=4')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNews(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="page_wrapper">
      <Header />
      <main className="page_main home_main">
        <Hero />
        <ProductSection title="Акции" linkText="Все акции" linkTo="/search?promo=1&title=Акции" products={promo} />
        <ProductSection title="Новинки" linkText="Все новинки" linkTo="/search?isNew=1&title=Новинки" products={news} />
        <SpecialOffers offers={fallbackOffers} />
        <Stores />
        <Articles articles={fallbackArticles} />
      </main>
      <Footer />
    </div>
  );
}
