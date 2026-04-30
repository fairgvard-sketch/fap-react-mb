export const RU_GEN   = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
export const RU_FULL  = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
export const RU_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
export const CURRENCY = '₪';

export const fmt = (n: number) => Math.round(n).toLocaleString('he-IL');

export const fmtDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} ${RU_GEN[d.getMonth()]}`;
};

export const fmtMonthYear = (dateStr: string) => {
  const d = new Date(dateStr + 'T12:00:00');
  return `${RU_FULL[d.getMonth()]} ${d.getFullYear()}`;
};

export const fmtShortMonth = (month: number) => RU_SHORT[month];
export const fmtFullMonth = (month: number) => RU_FULL[month];

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const monthStart = (dateStr: string) => {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export const monthEnd = (dateStr: string) => {
  const d = new Date(dateStr + 'T12:00:00');
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().slice(0, 10);
};

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const toISO = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
export const fmtCalDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
};
