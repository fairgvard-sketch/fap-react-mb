import type { Transaction, Recurring } from '../store/useStore';
import { randomUUID } from 'expo-crypto';
import { todayISO } from './format';

export function applyRecurrings(txs: Transaction[], recurrings: Recurring[]): Transaction[] {
  if (!recurrings.length) return txs;
  const today = todayISO();
  const todayDate = new Date(today + 'T12:00:00');
  let newTxs = [...txs];
  let changed = false;

  for (const r of recurrings) {
    const last = r.lastApplied ? new Date(r.lastApplied + 'T12:00:00') : null;
    const dates = getDatesToApply(r.freq, last, todayDate);
    for (const dateStr of dates) {
      const alreadyExists = newTxs.some(
        t => t.note === r.note && t.date === dateStr && t.amount === r.amount && t.cat === r.cat
      );
      if (!alreadyExists) {
        newTxs = [
          ...newTxs,
          { id: randomUUID(), type: r.type, amount: r.amount, cat: r.cat, note: r.note, date: dateStr },
        ];
        changed = true;
      }
    }
    if (dates.length) r.lastApplied = today;
  }

  return changed ? newTxs : txs;
}

function getDatesToApply(freq: string, last: Date | null, today: Date): string[] {
  const dates: string[] = [];
  if (!last) {
    dates.push(today.toISOString().slice(0, 10));
    return dates;
  }
  const cursor = new Date(last);
  while (true) {
    if (freq === 'daily') cursor.setDate(cursor.getDate() + 1);
    else if (freq === 'weekly') cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
    if (cursor > today) break;
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}
