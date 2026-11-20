import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, toQuery } from '../../api/api.js';
import { IconMenuLines, IconSearch } from '../Icons/Icons.jsx';

// Выделяем введённую часть подсказки жирным
function Highlight({ text, query }) {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1 || !query) return text;
  return (
    <>
      {text.slice(0, index)}
      <b>{text.slice(index, index + query.length)}</b>
      {text.slice(index + query.length)}
    </>
  );
}

export default function SearchBox() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const requestId = useRef(0);

  // подсказки с задержкой, чтобы не слать запрос на каждую букву
  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setItems([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      const id = ++requestId.current;
      api.get(`/search/suggest?${toQuery({ q: query })}`)
        .then((data) => id === requestId.current && setItems(data))
        .catch(() => setItems([]));
    }, 220);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const onClick = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const goSearch = (text) => {
    const query = text.trim();
    if (!query) return;
    setOpen(false);
    navigate(`/search?${toQuery({ q: query })}`);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    goSearch(value);
  };

  const showList = open && items.length > 0;

  return (
    <div className={`header_search ${showList ? 'open' : ''}`} ref={wrapRef}>
      <form className="header_search_form" onSubmit={onSubmit}>
        <input
          className="header_search_input"
          placeholder="Найти товар"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label="Поиск товаров"
        />
        <button className="header_search_btn" type="submit" aria-label="Найти">
          <IconSearch size={24} />
        </button>
      </form>

      {showList && (
        <ul className="header_search_list">
          {items.map((item) => (
            <li key={`${item.type}-${item.title}`}>
              <button
                className="header_search_item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (item.type === 'category') {
                    setOpen(false);
                    navigate(`/category/${item.slug}`);
                  } else {
                    goSearch(item.title);
                  }
                }}
              >
                <span><Highlight text={item.title} query={value.trim()} /></span>
                {item.type === 'category' && <IconMenuLines size={20} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
