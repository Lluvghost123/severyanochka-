import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/format.js';
import { IconChevronRight } from '../Icons/Icons.jsx';
import './Articles.scss';

export default function Articles({ articles }) {
  return (
    <section className="articles" id="articles">
      <div className="articles_center">
        <div className="section_title_row">
          <h2 className="section_title">Статьи</h2>
          <Link to="/" className="section_link">
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
                <button className="articles_btn">Подробнее</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
