import basketImg from '../../assets/images/promo_basket.png';
import cardImg from '../../assets/images/loyalty_card.svg';
import './SpecialOffers.scss';

export default function SpecialOffers({ offers }) {
  return (
    <section className="offers">
      <div className="offers_center">
        <h2 className="section_title offers_heading">Специальные предложения</h2>
        <div className="offers_grid">
          {offers.map((offer) => (
            <article className={`offers_card ${offer.variant}`} key={offer.id}>
              <div className="offers_text">
                <h3 className="offers_title">{offer.title}</h3>
                <p className="offers_desc">{offer.text}</p>
              </div>
              <img
                className="offers_img"
                src={offer.variant === 'peach' ? cardImg : basketImg}
                alt=""
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
