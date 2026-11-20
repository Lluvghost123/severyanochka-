import heroImg from '../../assets/images/hero_groceries.png';
import './Hero.scss';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero_center">
        <img className="hero_img" src={heroImg} alt="" />
        <h2 className="hero_text">Доставка бесплатно от 1000&nbsp;₽</h2>
      </div>
    </section>
  );
}
