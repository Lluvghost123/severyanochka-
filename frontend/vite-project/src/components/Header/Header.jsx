import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { fallbackCategories } from '../../data/fallback.js';
import {
  IconBox, IconBurger, IconCart, IconChevronDown, IconHeart, IconMenuLines, IconUser,
} from '../Icons/Icons.jsx';
import logo from '../../assets/images/logo.svg';
import SearchBox from './SearchBox.jsx';
import LoginModal from '../LoginModal/LoginModal.jsx';
import './Header.scss';

export default function Header() {
  const [categories, setCategories] = useState(fallbackCategories);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  // пользователь хранится в localStorage, чтобы вход не пропадал после обновления страницы
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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

  const login = (newUser) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    setLoginOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setProfileOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="header_center">
          <Link to="/" className="header_logo">
            <img className="header_logo_img" src={logo} alt="" />
            <span className="header_logo_text">СЕВЕРЯНОЧКА</span>
          </Link>

          <div
            className="header_catalog"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button className={`header_catalog_btn ${menuOpen ? 'open' : ''}`}>
              <IconBurger size={24} />
              <span className="header_catalog_label">Каталог</span>
            </button>

            {menuOpen && (
              <div className="header_menu">
                <div className="header_menu_center">
                  <ul className="header_menu_list">
                    {categories.map((category) => (
                      <li className="header_menu_item" key={category.id}>
                        <Link to={`/category/${category.slug}`} className="header_menu_link" onClick={() => setMenuOpen(false)}>
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
            <NavLink to="/favorites" className="header_action">
              <span className="header_action_icon"><IconHeart size={24} /></span>
              <span className="header_action_label">Избранное</span>
            </NavLink>
            <NavLink to="/orders" className="header_action">
              <span className="header_action_icon"><IconBox size={24} /></span>
              <span className="header_action_label">Заказы</span>
            </NavLink>
            <NavLink to="/cart" className="header_action">
              <span className="header_action_icon"><IconCart size={24} /></span>
              <span className="header_action_label">Корзина</span>
            </NavLink>
          </nav>

          <div className="header_profile">
            {user ? (
              <>
                <button className="header_profile_btn" onClick={() => setProfileOpen(!profileOpen)}>
                  <span className="header_avatar">
                    {user.avatar
                      ? <img className="header_avatar_img" src={user.avatar} alt={user.name} />
                      : <span className="header_avatar_empty">{user.name.slice(0, 1).toUpperCase()}</span>}
                  </span>
                  <span className="header_profile_name">{user.name}</span>
                  <span className={`header_profile_arrow ${profileOpen ? 'open' : ''}`}><IconChevronDown size={24} /></span>
                </button>
                {profileOpen && (
                  <div className="header_profile_menu">
                    <button className="header_profile_link" onClick={logout}>Выйти</button>
                  </div>
                )}
              </>
            ) : (
              <button className="header_login_btn" onClick={() => setLoginOpen(true)}>
                <span className="header_avatar">
                  <span className="header_avatar_empty"><IconUser size={22} /></span>
                </span>
                <span className="header_login_text">Войти</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="bottom_nav">
        <NavLink to="/catalog" className="bottom_nav_item">
          <IconMenuLines size={24} />
          <span>Каталог</span>
        </NavLink>
        <NavLink to="/favorites" className="bottom_nav_item">
          <IconHeart size={24} />
          <span>Избранное</span>
        </NavLink>
        <NavLink to="/orders" className="bottom_nav_item">
          <IconBox size={24} />
          <span>Заказы</span>
        </NavLink>
        <NavLink to="/cart" className="bottom_nav_item">
          <IconCart size={24} />
          <span>Корзина</span>
        </NavLink>
        <button className="bottom_nav_item profile" onClick={() => (user ? setProfileOpen(!profileOpen) : setLoginOpen(true))}>
          <span className="header_avatar">
            <span className="header_avatar_empty"><IconUser size={22} /></span>
          </span>
        </button>
      </nav>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onLogin={login} />}
    </>
  );
}
