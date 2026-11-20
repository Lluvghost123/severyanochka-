import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { useCategories } from '../../utils/useCategories.js';
import {
  IconBox, IconBurger, IconCart, IconChevronDown, IconHeart, IconMenuLines, IconUser,
} from '../Icons/Icons.jsx';
import logo from '../../assets/images/logo.svg';
import SearchBox from './SearchBox.jsx';
import './Header.scss';

function Avatar({ user }) {
  if (user && user.avatar) {
    return <img className="header_avatar_img" src={user.avatar} alt={user.name} />;
  }
  return (
    <span className="header_avatar_empty">
      {user ? user.name.slice(0, 1).toUpperCase() : <IconUser size={22} />}
    </span>
  );
}

export default function Header() {
  const { user, cartCount, favorites, setLoginOpen, signOut } = useApp();
  const categories = useCategories();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const menuItems = [...categories].sort((a, b) => a.menu_order - b.menu_order);

  const openProtected = (event, path) => {
    if (!user) {
      event.preventDefault();
      setLoginOpen(true);
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <header className="header">
        <div className="header_center">
          <Link to="/" className="header_logo">
            <img className="header_logo_img" src={logo} alt="" />
            <span className="header_logo_text">ЛУКОШКО</span>
          </Link>

          <div
            className="header_catalog"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              className={`header_catalog_btn ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
            >
              <IconBurger size={24} />
              <span className="header_catalog_label">Каталог</span>
            </button>

            {menuOpen && (
              <div className="header_menu">
                <div className="header_menu_center">
                  <ul className="header_menu_list">
                    {menuItems.map((category) => (
                      <li className="header_menu_item" key={category.id}>
                        <Link to={`/category/${category.slug}`} className="header_menu_link">
                          {category.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <SearchBox />

          <nav className="header_actions">
            <NavLink to="/favorites" className="header_action" onClick={(e) => openProtected(e, '/favorites')}>
              <span className="header_action_icon"><IconHeart size={24} /></span>
              <span className="header_action_label">Избранное</span>
              {favorites.length > 0 && <span className="header_action_dot" aria-hidden="true" />}
            </NavLink>
            <NavLink to="/orders" className="header_action" onClick={(e) => openProtected(e, '/orders')}>
              <span className="header_action_icon"><IconBox size={24} /></span>
              <span className="header_action_label">Заказы</span>
            </NavLink>
            <NavLink to="/cart" className="header_action" onClick={(e) => openProtected(e, '/cart')}>
              <span className="header_action_icon">
                <IconCart size={24} />
                {cartCount > 0 && <span className="header_action_badge">{cartCount > 99 ? '99+' : cartCount}</span>}
              </span>
              <span className="header_action_label">Корзина</span>
            </NavLink>
          </nav>

          <div className="header_profile" ref={profileRef}>
            {user ? (
              <>
                <button className="header_profile_btn" onClick={() => setProfileOpen((v) => !v)}>
                  <span className="header_avatar"><Avatar user={user} /></span>
                  <span className="header_profile_name">{user.name}</span>
                  <span className={`header_profile_arrow ${profileOpen ? 'open' : ''}`}><IconChevronDown size={24} /></span>
                </button>
                {profileOpen && (
                  <div className="header_profile_menu">
                    <div className="header_profile_bonus">Бонусов: <b>{user.bonus}</b></div>
                    <Link to="/orders" className="header_profile_link">Мои заказы</Link>
                    <Link to="/favorites" className="header_profile_link">Избранное</Link>
                    <button className="header_profile_link" onClick={signOut}>Выйти</button>
                  </div>
                )}
              </>
            ) : (
              <button className="header_login_btn" onClick={() => setLoginOpen(true)}>
                <span className="header_avatar"><Avatar user={null} /></span>
                <span className="header_login_text">Войти</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="bottom_nav" aria-label="Основная навигация">
        <NavLink to="/catalog" className="bottom_nav_item">
          <IconMenuLines size={24} />
          <span>Каталог</span>
        </NavLink>
        <NavLink to="/favorites" className="bottom_nav_item" onClick={(e) => openProtected(e, '/favorites')}>
          <IconHeart size={24} />
          <span>Избранное</span>
        </NavLink>
        <NavLink to="/orders" className="bottom_nav_item" onClick={(e) => openProtected(e, '/orders')}>
          <IconBox size={24} />
          <span>Заказы</span>
        </NavLink>
        <NavLink to="/cart" className="bottom_nav_item" onClick={(e) => openProtected(e, '/cart')}>
          <span className="bottom_nav_icon">
            <IconCart size={24} />
            {cartCount > 0 && <span className="header_action_badge">{cartCount > 99 ? '99+' : cartCount}</span>}
          </span>
          <span>Корзина</span>
        </NavLink>
        <button className="bottom_nav_item profile" onClick={() => (user ? navigate('/orders') : setLoginOpen(true))}>
          <span className="header_avatar"><Avatar user={user} /></span>
        </button>
      </nav>
    </>
  );
}
