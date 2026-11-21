import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home.jsx';
import Catalog from './pages/Catalog/Catalog.jsx';
import Category from './pages/Category/Category.jsx';
import Product from './pages/Product/Product.jsx';
import Search from './pages/Search/Search.jsx';
import Soon from './pages/Soon/Soon.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/category/:slug" element={<Category />} />
      <Route path="/product/:id" element={<Product />} />
      <Route path="/search" element={<Search />} />
      <Route path="/favorites" element={<Soon title="Избранное" />} />
      <Route path="/orders" element={<Soon title="Заказы" />} />
      <Route path="/cart" element={<Soon title="Корзина" />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
