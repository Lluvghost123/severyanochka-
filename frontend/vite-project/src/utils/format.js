const priceFormat = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(value) {
  if (value === null || value === undefined) return '';
  return `${priceFormat.format(value)} ₽`;
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function plural(n, forms) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

// +7 912 345-67-89 — маска телефона
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

export const ORDER_STATUS = {
  new: 'Принят',
  assembling: 'Собирается',
  delivered: 'Доставлен',
};
