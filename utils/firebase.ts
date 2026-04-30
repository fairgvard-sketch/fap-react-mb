import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, signInAnonymously, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';

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
