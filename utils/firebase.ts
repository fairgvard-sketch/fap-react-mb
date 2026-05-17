import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, signInAnonymously, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { getDatabase, ref, set, get, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL:       process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export type { User };
export { GoogleAuthProvider, signInWithCredential, signInAnonymously, signOut, onAuthStateChanged };

export async function loadUserData(uid: string) {
  try {
    const snap = await get(ref(db, `users/${uid}`));
    if (snap.exists()) return snap.val();
    return null;
  } catch {
    return null;
  }
}

export async function saveUserData(uid: string, data: object) {
  await set(ref(db, `users/${uid}`), data);
}

export async function createInvite(uid: string): Promise<string> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  await set(ref(db, `invites/${code}`), { uid, createdAt: Date.now() });
  return code;
}

export async function resolveInvite(code: string): Promise<string | null> {
  try {
    const snap = await get(ref(db, `invites/${code.toUpperCase()}`));
    if (!snap.exists()) return null;
    const { uid, createdAt } = snap.val();
    if (Date.now() - createdAt > 48 * 60 * 60 * 1000) return null;
    await remove(ref(db, `invites/${code.toUpperCase()}`));
    return uid;
  } catch {
    return null;
  }
}

export interface PartnerSummary {
  expense: number;
  income: number;
  topCat: string | null;
}

export async function loadPartnerSummary(uid: string): Promise<PartnerSummary | null> {
  const data = await loadUserData(uid);
  if (!data?.txs) return null;
  const txs: { type: string; amount: number; cat: string }[] = data.txs;
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const income  = txs.filter(t => t.type === 'income' ).reduce((s, t) => s + t.amount, 0);
  const catMap: Record<string, number> = {};
  txs.filter(t => t.type === 'expense').forEach(t => { catMap[t.cat] = (catMap[t.cat] ?? 0) + t.amount; });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return { expense, income, topCat };
}
