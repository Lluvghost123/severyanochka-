import { Link } from 'react-router-dom';
import { useTitle } from '../../utils/useTitle.js';
import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';

export default function NotFound() {
  useTitle('Страница не найдена');
  return (
    <div className="page_wrapper">
      <Header />
      <main className="page_main">
        <div className="page_container">
          <div className="empty_state">
            <div className="empty_state_title">Страница не найдена</div>
            <p>Возможно, ссылка устарела или адрес введён с ошибкой</p>
            <Link to="/" className="empty_state_btn">На главную</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
