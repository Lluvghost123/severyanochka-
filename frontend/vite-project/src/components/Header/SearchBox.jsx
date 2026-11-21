import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconMenuLines, IconSearch } from '../Icons/Icons.jsx';

export default function SearchBox() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  // при вводе просим у сервера подсказки (от двух букв)
  const onChange = (event) => {
    const text = event.target.value;
    setValue(text);
    setOpen(true);
    if (text.trim().length < 2) {
      setItems([]);
      return;
    }
    fetch(`http://localhost:3000/api/suggest?q=${encodeURIComponent(text.trim())}`)
      .then(res => res.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  };

  const goSearch = (text) => {
    if (!text.trim()) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(text.trim())}`);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    goSearch(value);
  };

  const choose = (item) => {
    if (item.type === 'category') {
      setOpen(false);
      navigate(`/category/${item.slug}`);
    } else {
      goSearch(item.title);
    }
  };

  const showList = open && items.length > 0;

  return (
    <div className={`header_search ${showList ? 'open' : ''}`}>
      <form className="header_search_form" onSubmit={onSubmit}>
        <input
          className="header_search_input"
          placeholder="Найти товар"
          value={value}
          onChange={onChange}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        <button className="header_search_btn" type="submit" aria-label="Найти">
          <IconSearch size={24} />
        </button>
      </form>

      {showList && (
        <ul className="header_search_list">
          {items.map((item, index) => (
            <li key={index}>
              <button className="header_search_item" onClick={() => choose(item)}>
                <span>{item.title}</span>
                {item.type === 'category' && <IconMenuLines size={20} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
