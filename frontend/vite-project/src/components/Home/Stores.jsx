import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Stores.scss';

const PIN_SVG = `<svg width="30" height="40" viewBox="0 0 30 40"><path d="M15 1C7.3 1 1 7.2 1 14.8 1 25.5 15 39 15 39s14-13.5 14-24.2C29 7.2 22.7 1 15 1z" fill="currentColor" stroke="#fff" stroke-width="2"/><circle cx="15" cy="14.5" r="5.5" fill="#fff"/></svg>`;

function makeIcon(active) {
  return L.divIcon({
    className: `stores_marker ${active ? 'active' : ''}`,
    html: PIN_SVG,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -38],
  });
}

function makePopup(store) {
  const box = document.createElement('div');
  const lines = [
    ['stores_info_title', store.district],
    ['stores_info_text', store.address],
    ['stores_info_text', store.hours],
    ['stores_info_text', store.phone],
  ];
  lines.forEach(([cls, text]) => {
    const row = document.createElement('div');
    row.className = cls;
    row.textContent = text || '';
    box.appendChild(row);
  });
  return box;
}

export default function Stores({ stores }) {
  const [active, setActive] = useState(0);
  const mapRef = useRef(null);
  const nodeRef = useRef(null);
  const markersRef = useRef([]);

  // создаём карту один раз
  useEffect(() => {
    const map = L.map(nodeRef.current, { scrollWheelZoom: false, zoomControl: true }).setView([61.6688, 50.8364], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; участники <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on('click', () => map.scrollWheelZoom.enable());
    map.on('mouseout', () => map.scrollWheelZoom.disable());
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // метки магазинов
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = stores.map((store, index) => {
      const marker = L.marker([store.lat, store.lng], { icon: makeIcon(false), title: store.district })
        .addTo(map)
        .bindPopup(makePopup(store), { className: 'stores_popup', closeButton: false, offset: [0, 0] });
      marker.on('click', () => setActive(index));
      return marker;
    });
  }, [stores]);

  // выбранный магазин: оранжевая метка, подпись и центрирование
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker, index) => {
      marker.setIcon(makeIcon(index === active));
      marker.setZIndexOffset(index === active ? 1000 : 0);
    });
    const marker = markersRef.current[active];
    if (marker) {
      map.panTo(marker.getLatLng(), { animate: true });
      marker.openPopup();
    }
  }, [active, stores]);

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
          <div className="stores_map_canvas" ref={nodeRef} />
        </div>
      </div>
    </section>
  );
}
