import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential, signInAnonymously, auth } from '../utils/firebase';
import { useStore } from '../store/useStore';
import { C } from '../constants/colors';
import { loadUserData } from '../utils/firebase';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!;

export default function LoginScreen() {
  const router = useRouter();
  const user = useStore(s => s.user);
  const authReady = useStore(s => s.authReady);
  const setUser = useStore(s => s.setUser);
  const loadFromFirebase = useStore(s => s.loadFromFirebase);
  const applyRecurringsNow = useStore(s => s.applyRecurringsNow);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'financeapp' }),
    },
    discovery,
  );

  useEffect(() => {
    if (authReady && user) router.replace('/(tabs)');
  }, [user, authReady]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token, access_token);
      signInWithCredential(auth, credential).then(async (result) => {
        setUser(result.user);
        const data = await loadUserData(result.user.uid);
        if (data) {
          loadFromFirebase(data);
          applyRecurringsNow();
        }
        router.replace('/(tabs)');
      });
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>💼</Text>
        </View>

        <Text style={[styles.title, { color: C.text }]}>Финансовый</Text>
        <Text style={[styles.title, { color: C.green }]}>контроль</Text>

        <Text style={styles.desc}>
          Войдите, чтобы получить свой кошелёк — доходы, расходы, подписки, копилка и бюджеты в одном месте.
        </Text>

        <TouchableOpacity
          style={styles.googleBtn}
          onPress={() => promptAsync()}
          disabled={!request}
          activeOpacity={0.85}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>Войти через Google</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Защищённый вход через Google. Данные каждого аккаунта изолированы.</Text>

        {__DEV__ && (
          <TouchableOpacity
            style={styles.devBtn}
            onPress={async () => {
              const result = await signInAnonymously(auth);
              setUser(result.user);
              router.replace('/(tabs)');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.devBtnText}>Войти как гость (dev)</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.footer}>Personal Finance For Two</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0ede6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 28,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  iconBox: {
    width: 60, height: 60,
    backgroundColor: C.green,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  iconText: { fontSize: 28 },
  title: {
    fontFamily: 'Unbounded-Bold',
    fontSize: 28,
    letterSpacing: -1,
    lineHeight: 34,
  },
  desc: {
    fontFamily: 'Manrope-Regular',
    fontSize: 15,
    color: C.textSecondary,
    lineHeight: 23,
    marginTop: 18,
    marginBottom: 32,
  },
  googleBtn: {
    backgroundColor: C.green,
    borderRadius: 50,
    paddingVertical: 17,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 18,
  },
  googleIcon: {
    color: C.white,
    fontSize: 18,
    fontFamily: 'Manrope-Bold',
  },
  googleText: {
    color: C.white,
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
    letterSpacing: -0.2,
  },
  hint: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: C.navInactive,
    textAlign: 'center',
    lineHeight: 18,
  },
  devBtn: {
    marginTop: 12,
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
  },
  devBtnText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 13,
    color: C.textSecondary,
  },
  footer: {
    marginTop: 32,
    fontFamily: 'Manrope-SemiBold',
    fontSize: 11,
    color: '#b0a89a',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
