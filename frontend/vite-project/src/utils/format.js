// Цена: 1234.5 -> "1 234,50 ₽"
export function formatPrice(value) {
  if (value === null || value === undefined) return '';
  return Number(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
}

// Дата: 2026-11-20 -> "20.11.2026"
export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('ru-RU');
}

// Скидка в процентах по обычной цене и цене по карте
export function getDiscount(product) {
  if (!product.is_promo || !product.card_price) return 0;
  return Math.round((1 - product.card_price / product.price) * 100);
}

// Телефон: 89123456789 -> "+7 912 345-67-89"
export function maskPhone(raw) {
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (!digits.startsWith('7')) digits = '7' + digits;
  digits = digits.slice(0, 11);
  const p = digits.slice(1);
  let out = '+7';
  if (p.length > 0) out += ' ' + p.slice(0, 3);
  if (p.length > 3) out += ' ' + p.slice(3, 6);
  if (p.length > 6) out += '-' + p.slice(6, 8);
  if (p.length > 8) out += '-' + p.slice(8, 10);
  return out;
}
