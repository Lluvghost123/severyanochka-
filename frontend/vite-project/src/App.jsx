import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home/Home.jsx';
import Catalog from './pages/Catalog/Catalog.jsx';
import Category from './pages/Category/Category.jsx';
import Product from './pages/Product/Product.jsx';
import Search from './pages/Search/Search.jsx';
import Favorites from './pages/Favorites/Favorites.jsx';
import Cart from './pages/Cart/Cart.jsx';
import Orders from './pages/Orders/Orders.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';
import LoginModal from './components/LoginModal/LoginModal.jsx';
import Toast from './components/Toast/Toast.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/search" element={<Search />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <LoginModal />
      <Toast />
    </>
  );
}

export default App;
