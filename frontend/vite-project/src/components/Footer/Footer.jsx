import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.svg';
import { IconFacebook, IconInstagram, IconOk, IconPhone, IconVk } from '../Icons/Icons.jsx';
import './Footer.scss';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer_center">
        <Link to="/" className="footer_logo">
          <img className="footer_logo_img" src={logo} alt="Лукошко" />
          <span className="footer_logo_text">ЛУКОШКО</span>
        </Link>

        <nav className="footer_nav">
          <a href="#" className="footer_link" onClick={(e) => e.preventDefault()}>О компании</a>
          <Link to="/#stores" className="footer_link">Контакты</Link>
          <a href="#" className="footer_link" onClick={(e) => e.preventDefault()}>Вакансии</a>
          <Link to="/#articles" className="footer_link">Статьи</Link>
          <a href="#" className="footer_link footer_link_wide" onClick={(e) => e.preventDefault()}>
            Политика обработки персональных данных
          </a>
        </nav>

        <div className="footer_socials">
          <a href="https://instagram.com" className="footer_social" aria-label="Instagram" target="_blank" rel="noreferrer"><IconInstagram size={22} /></a>
          <a href="https://vk.com" className="footer_social" aria-label="ВКонтакте" target="_blank" rel="noreferrer"><IconVk size={22} /></a>
          <a href="https://facebook.com" className="footer_social" aria-label="Facebook" target="_blank" rel="noreferrer"><IconFacebook size={22} /></a>
          <a href="https://ok.ru" className="footer_social" aria-label="Одноклассники" target="_blank" rel="noreferrer"><IconOk size={22} /></a>
        </div>

        <a href="tel:88007773333" className="footer_phone">
          <IconPhone size={24} />
          <span>8 800 777 33 33</span>
        </a>
      </div>
    </footer>
  );
}
