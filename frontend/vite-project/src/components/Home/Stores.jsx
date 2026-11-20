import { useState } from 'react';
import mapImg from '../../assets/images/map.png';
import './Stores.scss';

function Pin() {
  return (
    <svg width="30" height="40" viewBox="0 0 30 40">
      <path d="M15 1C7.3 1 1 7.2 1 14.8 1 25.5 15 39 15 39s14-13.5 14-24.2C29 7.2 22.7 1 15 1z" fill="currentColor" stroke="#fff" strokeWidth="2" />
      <circle cx="15" cy="14.5" r="5.5" fill="#fff" />
    </svg>
  );
}

export default function Stores({ stores }) {
  const [active, setActive] = useState(0);
  const current = stores[active] || stores[0];

  return (
    <section className="stores" id="stores">
      <div className="stores_center">
        <h2 className="section_title stores_heading">Наши магазины</h2>

        <div className="stores_tabs">
          {stores.map((store, index) => (
            <button
              key={store.id}
              className={`stores_tab ${index === active ? 'active' : ''}`}
              onClick={() => setActive(index)}
            >
              {store.district}
            </button>
          ))}
        </div>

        <div className="stores_map">
          <div className="stores_map_canvas">
            <img className="stores_map_img" src={mapImg} alt="Карта магазинов" />

            {stores.map((store, index) => (
              <button
                key={store.id}
                className={`stores_pin ${index === active ? 'active' : ''}`}
                style={{ left: `${store.map_x}%`, top: `${store.map_y}%` }}
                onClick={() => setActive(index)}
                aria-label={store.district}
              >
                <Pin />
              </button>
            ))}

            {current && (
              <div
                className={`stores_info ${current.map_y < 50 ? 'below' : ''}`}
                style={{ left: `${current.map_x}%`, top: `${current.map_y}%` }}
              >
                <div className="stores_info_title">{current.district}</div>
                <div className="stores_info_text">{current.address}</div>
                <div className="stores_info_text">{current.hours}</div>
                <div className="stores_info_text">{current.phone}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
