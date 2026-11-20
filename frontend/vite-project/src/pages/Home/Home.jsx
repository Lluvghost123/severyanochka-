import { useEffect, useState } from 'react';
import { api } from '../../api/api.js';
import { useApp } from '../../context/AppContext.jsx';
import {
  fallbackArticles, fallbackBought, fallbackNews, fallbackOffers, fallbackPromo, fallbackStores,
} from '../../data/fallback.js';
import { useTitle } from '../../utils/useTitle.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Hero from '../../components/Home/Hero.jsx';
import ProductSection from '../../components/Home/ProductSection.jsx';
import SpecialOffers from '../../components/Home/SpecialOffers.jsx';
import Stores from '../../components/Home/Stores.jsx';
import Articles from '../../components/Home/Articles.jsx';
import './Home.scss';

export default function Home() {
  useTitle('');
  const { user } = useApp();
  const [promo, setPromo] = useState(fallbackPromo);
  const [news, setNews] = useState(fallbackNews);
  const [offers, setOffers] = useState(fallbackOffers);
  const [bought, setBought] = useState(fallbackBought);
  const [stores, setStores] = useState(fallbackStores);
  const [articles, setArticles] = useState(fallbackArticles);

  // Данные из PostgreSQL; если сервер недоступен — остаются запасные массивы
  useEffect(() => {
    api.get('/home?limit=4')
      .then((data) => {
        if (data.promo.length) setPromo(data.promo);
        if (data.news.length) setNews(data.news);
        if (data.offers.length) setOffers(data.offers);
      })
      .catch(() => {});
    api.get('/stores').then((data) => data.length && setStores(data)).catch(() => {});
    api.get('/articles?limit=3').then((data) => data.length && setArticles(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/me/bought?limit=4').then((data) => data.length && setBought(data)).catch(() => {});
  }, [user]);

  // переход по якорю /#stores, /#articles
  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    if (!id) return;
    const timer = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page_wrapper">
      <Header />
      <main className="page_main home_main">
        <Hero />
        <ProductSection title="Акции" linkText="Все акции" linkTo="/search?promo=1&title=Акции" products={promo} />
        <ProductSection title="Новинки" linkText="Все новинки" linkTo="/search?isNew=1&title=Новинки" products={news} />
        {user && (
          <ProductSection title="Покупали раньше" linkText="Все покупки" linkTo="/orders" products={bought} />
        )}
        <SpecialOffers offers={offers} />
        <Stores stores={stores} />
        <Articles articles={articles} />
      </main>
      <Footer />
    </div>
  );
}
