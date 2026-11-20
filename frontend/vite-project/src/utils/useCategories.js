import { useEffect, useState } from 'react';
import { api } from '../api/api.js';
import { fallbackCategories } from '../data/fallback.js';

let cache = null;

// Категории нужны шапке, каталогу и фильтрам — грузим один раз и кэшируем
export function useCategories() {
  const [categories, setCategories] = useState(cache || fallbackCategories);

  useEffect(() => {
    if (cache) return;
    api.get('/categories')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          cache = data;
          setCategories(data);
        }
      })
      .catch(() => {});
  }, []);

  return categories;
}
