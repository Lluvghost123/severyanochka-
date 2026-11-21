import Header from '../../components/Header/Header.jsx';
import Footer from '../../components/Footer/Footer.jsx';

export default function Soon({ title }) {
  return (
    <div className="page_wrapper">
      <Header />
      <main className="page_main">
        <div className="page_container">
          <h1 className="page_title">{title}</h1>
          <p>Этот раздел появится позже.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
