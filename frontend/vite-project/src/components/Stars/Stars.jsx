import { IconStar } from '../Icons/Icons.jsx';
import './Stars.scss';

// value: 0..5 (допускаются половинки). onSelect — режим выбора оценки.
export default function Stars({ value = 0, size = 16, onSelect, hover = 0, onHover }) {
  return (
    <div className={`stars ${onSelect ? 'interactive' : ''}`} style={{ '--star-size': `${size}px` }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const shown = hover || value;
        const fill = Math.max(0, Math.min(1, shown - i));
        const item = (
          <>
            <span className="stars_base"><IconStar size={size} color="#BFBFBF" /></span>
            <span className="stars_fill" style={{ width: `${fill * 100}%` }}>
              <IconStar size={size} color="#FF6633" />
            </span>
          </>
        );
        return onSelect ? (
          <button
            type="button"
            key={i}
            className="stars_item"
            onClick={() => onSelect(i + 1)}
            onMouseEnter={() => onHover && onHover(i + 1)}
            onMouseLeave={() => onHover && onHover(0)}
            aria-label={`Оценка ${i + 1}`}
          >
            {item}
          </button>
        ) : (
          <span key={i} className="stars_item">{item}</span>
        );
      })}
    </div>
  );
}
