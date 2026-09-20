const _apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

export const getImageUrl = (path: string): string =>
  path.startsWith('http') ? path : `${_apiBase}${path}`;

export const formatPrice = (czk: number | string): string => {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(Number(czk));
};

export const slugify = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
