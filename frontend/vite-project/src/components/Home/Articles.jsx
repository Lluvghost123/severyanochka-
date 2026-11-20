import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { formatDate } from '../../utils/format.js';
import { IconChevronRight } from '../Icons/Icons.jsx';
import './Articles.scss';

export default function Articles({ articles }) {
  const { showToast } = useApp();

  return (
    <section className="articles" id="articles">
      <div className="articles_center">
        <div className="section_title_row">
          <h2 className="section_title">Статьи</h2>
          <Link to="/" className="section_link" onClick={(e) => { e.preventDefault(); showToast('Раздел статей скоро появится'); }}>
            <span>Все статьи</span>
            <IconChevronRight size={20} />
          </Link>
        </div>

        <div className="articles_grid">
          {articles.map((article) => (
            <article className="articles_card" key={article.id}>
              <img className="articles_img" src={article.image} alt="" loading="lazy" />
              <div className="articles_body">
                <time className="articles_date">{formatDate(article.published_at)}</time>
                <h3 className="articles_title">{article.title}</h3>
                <p className="articles_text">{article.preview}</p>
                <button
                  className="articles_btn"
                  onClick={() => showToast('Полный текст статьи скоро появится')}
                >
                  Подробнее
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
