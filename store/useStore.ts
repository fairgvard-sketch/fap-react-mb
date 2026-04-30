import { create } from 'zustand';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveUserData } from '../utils/firebase';
import { applyRecurrings } from '../utils/recurrings';
import type { User } from '../utils/firebase';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  cat: string;
  note: string;
  date: string;
  autoRuleId?: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  day: number;
  svc: string;
  autoCharge: boolean;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string;
  icon: string;
  color: string;
}

export interface Recurring {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  cat: string;
  note: string;
  freq: 'daily' | 'weekly' | 'monthly';
  lastApplied?: string;
  subId?: string;
}

export interface AutoRule {
  id: string;
  type: 'category' | 'subscription';
  subId?: string;
  name: string;
  amount: number;
  cat: string;
  day: number;
  active: boolean;
  txType?: 'income' | 'expense';
  startFrom?: string; // YYYY-MM-01
  ic?: string;
  bg?: string;
}

const DEMO_TXS: Transaction[] = [
  { id: '1', type: 'income',  amount: 12000, cat: 'Зарплата', note: 'Зарплата',    date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01` },
  { id: '2', type: 'expense', amount: 3500,  cat: 'Аренда',   note: 'Аренда',      date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-02` },
  { id: '3', type: 'expense', amount: 650,   cat: 'Продукты', note: 'Супермаркет', date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-05` },
  { id: '4', type: 'expense', amount: 280,   cat: 'Транспорт',note: 'Автобус',     date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-06` },
  { id: '5', type: 'income',  amount: 500,   cat: 'Чаевые',   note: 'Чаевые',      date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-10` },
  { id: '6', type: 'expense', amount: 420,   cat: 'Рестораны',note: 'Ужин',        date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-12` },
];

interface StoreState {
  txs: Transaction[];
  subs: Subscription[];
  goals: Goal[];
  budgets: Record<string, number>;
  recurrings: Recurring[];
  autoRules: AutoRule[];
  user: User | null;
  authReady: boolean;

  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;
  loadFromStorage: () => Promise<void>;
  loadFromFirebase: (data: any) => void;
  saveAll: () => void;
  applyRecurringsNow: () => void;
  checkAutoRules: () => void;

  addTx: (tx: Omit<Transaction, 'id'>) => void;
  deleteTx: (id: string) => void;

  addSub: (sub: Omit<Subscription, 'id'>) => void;
  updateSub: (sub: Subscription) => void;
  deleteSub: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id' | 'saved'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  addSaving: (goalId: string, amount: number) => void;
  withdraw: (goalId: string, amount: number) => void;

  setBudget: (cat: string, amount: number) => void;
  deleteBudget: (cat: string) => void;

  addRecurring: (r: Omit<Recurring, 'id'>) => void;
  deleteRecurring: (id: string) => void;

  addAutoRule: (rule: Omit<AutoRule, 'id'>) => void;
  updateAutoRule: (rule: AutoRule) => void;
  deleteAutoRule: (id: string) => void;
  toggleAutoRule: (id: string) => void;
}

const load = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

export const useStore = create<StoreState>((set, get) => ({
  txs: DEMO_TXS,
  subs: [],
  goals: [],
  budgets: {},
  recurrings: [],
  autoRules: [],
  user: null,
  authReady: false,

  setUser: (user) => set({ user }),
  setAuthReady: (authReady) => set({ authReady }),

  loadFromStorage: async () => {
    const [txs, subs, goals, budgets, recurrings, autoRules] = await Promise.all([
      load('tx', DEMO_TXS),
      load('subs', []),
      load('goals', []),
      load('budgets', {}),
      load('recur', []),
      load('autoRules', []),
    ]);
    set({ txs, subs, goals, budgets, recurrings, autoRules });
  },

  loadFromFirebase: (data) => {
    if (!data) return;
    set({
      txs:        data.txs        ?? get().txs,
      subs:       data.subs       ?? get().subs,
      goals:      data.goals      ?? get().goals,
      budgets:    data.budgets    ?? get().budgets,
      recurrings: data.recur      ?? get().recurrings,
      autoRules:  data.autoRules  ?? get().autoRules,
    });
  },

  saveAll: async () => {
    const { txs, subs, goals, budgets, recurrings, autoRules, user } = get();
    await Promise.all([
      AsyncStorage.setItem('tx',        JSON.stringify(txs)),
      AsyncStorage.setItem('subs',      JSON.stringify(subs)),
      AsyncStorage.setItem('goals',     JSON.stringify(goals)),
      AsyncStorage.setItem('budgets',   JSON.stringify(budgets)),
      AsyncStorage.setItem('recur',     JSON.stringify(recurrings)),
      AsyncStorage.setItem('autoRules', JSON.stringify(autoRules)),
    ]);
    if (user?.uid) {
      try {
        await saveUserData(user.uid, { txs, subs, goals, budgets, recur: recurrings, autoRules });
      } catch {
        Alert.alert('Ошибка синхронизации', 'Данные сохранены локально, но не удалось синхронизировать с облаком. Проверьте интернет-соединение.');
      }
    }
  },

  applyRecurringsNow: () => {
    const { txs, recurrings } = get();
    const updated = applyRecurrings(txs, [...recurrings]);
    if (updated !== txs) {
      set({ txs: updated, recurrings });
      get().saveAll();
    }
  },

  checkAutoRules: () => {
    const { txs, autoRules } = get();
    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const todayDay = now.getDate();
    let newTxs = [...txs];
    let changed = false;

    for (const rule of autoRules) {
      if (!rule.active) continue;

      let sy: number, sm: number, sfDay = 1;
      if (rule.startFrom) {
        const d = new Date(rule.startFrom + 'T12:00:00');
        sy = d.getFullYear(); sm = d.getMonth(); sfDay = d.getDate();
      } else {
        sy = nowYear; sm = nowMonth;
      }

      let y = sy, m = sm;
      while (y < nowYear || (y === nowYear && m <= nowMonth)) {
        const monthStr  = `${y}-${String(m + 1).padStart(2, '0')}`;
        const isCurrent = y === nowYear && m === nowMonth;
        const isStart   = y === sy && m === sm;

        if (isCurrent && todayDay < rule.day) break;
        if (isStart && isCurrent && todayDay < sfDay) break;

        const alreadyFired = newTxs.some(t => t.autoRuleId === rule.id && t.date.startsWith(monthStr));
        if (!alreadyFired) {
          const dd = String(rule.day).padStart(2, '0');
          newTxs.push({
            id: crypto.randomUUID(),
            type: rule.txType ?? 'expense',
            amount: rule.amount,
            cat: rule.cat,
            note: rule.name,
            date: `${monthStr}-${dd}`,
            autoRuleId: rule.id,
          });
          changed = true;
        }

        m++;
        if (m > 11) { m = 0; y++; }
      }
    }

    if (changed) {
      set({ txs: newTxs });
      get().saveAll();
    }
  },

  addTx: (tx) => {
    set(s => ({ txs: [...s.txs, { ...tx, id: crypto.randomUUID() }] }));
    get().saveAll();
  },

  deleteTx: (id) => {
    set(s => ({ txs: s.txs.filter(t => t.id !== id) }));
    get().saveAll();
  },

  addSub: (sub) => {
    set(s => ({ subs: [...s.subs, { ...sub, id: crypto.randomUUID() }] }));
    get().saveAll();
  },

  updateSub: (sub) => {
    set(s => ({ subs: s.subs.map(x => x.id === sub.id ? sub : x) }));
    get().saveAll();
  },

  deleteSub: (id) => {
    set(s => ({ subs: s.subs.filter(x => x.id !== id) }));
    get().saveAll();
  },

  addGoal: (goal) => {
    set(s => ({ goals: [...s.goals, { ...goal, id: crypto.randomUUID(), saved: 0 }] }));
    get().saveAll();
  },

  updateGoal: (goal) => {
    set(s => ({ goals: s.goals.map(g => g.id === goal.id ? goal : g) }));
    get().saveAll();
  },

  deleteGoal: (id) => {
    set(s => ({ goals: s.goals.filter(g => g.id !== id) }));
    get().saveAll();
  },

  addSaving: (goalId, amount) => {
    set(s => ({ goals: s.goals.map(g => g.id === goalId ? { ...g, saved: g.saved + amount } : g) }));
    get().saveAll();
  },

  withdraw: (goalId, amount) => {
    set(s => ({ goals: s.goals.map(g => g.id === goalId ? { ...g, saved: Math.max(0, g.saved - amount) } : g) }));
    get().saveAll();
  },

  setBudget: (cat, amount) => {
    set(s => ({ budgets: { ...s.budgets, [cat]: amount } }));
    get().saveAll();
  },

  deleteBudget: (cat) => {
    set(s => {
      const b = { ...s.budgets };
      delete b[cat];
      return { budgets: b };
    });
    get().saveAll();
  },

  addRecurring: (r) => {
    set(s => ({ recurrings: [...s.recurrings, { ...r, id: crypto.randomUUID() }] }));
    get().saveAll();
  },

  deleteRecurring: (id) => {
    set(s => ({ recurrings: s.recurrings.filter(r => r.id !== id) }));
    get().saveAll();
  },

  addAutoRule: (rule) => {
    set(s => ({ autoRules: [...s.autoRules, { ...rule, id: crypto.randomUUID() }] }));
    get().saveAll();
  },

  updateAutoRule: (rule) => {
    set(s => ({ autoRules: s.autoRules.map(r => r.id === rule.id ? rule : r) }));
    get().saveAll();
  },

  deleteAutoRule: (id) => {
    set(s => ({ autoRules: s.autoRules.filter(r => r.id !== id) }));
    get().saveAll();
  },

  toggleAutoRule: (id) => {
    set(s => ({ autoRules: s.autoRules.map(r => r.id === id ? { ...r, active: !r.active } : r) }));
    get().saveAll();
  },
}));
