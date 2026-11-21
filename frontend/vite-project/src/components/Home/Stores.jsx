import { useState } from 'react';
import { fallbackStores } from '../../data/fallback.js';
import './Stores.scss';

export default function Stores() {
  const [active, setActive] = useState(0);
  const store = fallbackStores[active];

  // карта OpenStreetMap: рамка вокруг магазина и метка
  const d = 0.008;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${store.lng - d * 1.6}%2C${store.lat - d}%2C${store.lng + d * 1.6}%2C${store.lat + d}&layer=mapnik&marker=${store.lat}%2C${store.lng}`;

  return (
    <section className="stores" id="stores">
      <div className="stores_center">
        <h2 className="section_title stores_heading">Наши магазины</h2>

        <div className="stores_tabs">
          {fallbackStores.map((item, index) => (
            <button
              key={item.id}
              className={`stores_tab ${index === active ? 'active' : ''}`}
              onClick={() => setActive(index)}
            >
              {item.district}
            </button>
          ))}
        </div>

        <div className="stores_map">
          <iframe className="stores_map_frame" title="Карта магазинов" src={mapUrl}></iframe>
          <div className="stores_info">
            <div className="stores_info_title">{store.district}</div>
            <div className="stores_info_text">{store.address}</div>
            <div className="stores_info_text">{store.hours}</div>
            <div className="stores_info_text">{store.phone}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
