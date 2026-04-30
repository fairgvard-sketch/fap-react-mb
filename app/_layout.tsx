import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  Unbounded_700Bold,
} from '@expo-google-fonts/unbounded';
import { auth, onAuthStateChanged, loadUserData } from '../utils/firebase';
import { useStore } from '../store/useStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const setUser = useStore(s => s.setUser);
  const setAuthReady = useStore(s => s.setAuthReady);
  const loadFromFirebase = useStore(s => s.loadFromFirebase);
  const loadFromStorage = useStore(s => s.loadFromStorage);
  const applyRecurringsNow = useStore(s => s.applyRecurringsNow);
  const checkAutoRules = useStore(s => s.checkAutoRules);

  const [fontsLoaded, fontError] = useFonts({
    'Manrope-Regular':  Manrope_400Regular,
    'Manrope-Medium':   Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold':     Manrope_700Bold,
    'Outfit-Regular':   Outfit_400Regular,
    'Outfit-Medium':    Outfit_500Medium,
    'Outfit-SemiBold':  Outfit_600SemiBold,
    'Outfit-Bold':      Outfit_700Bold,
    'Unbounded-Bold':   Unbounded_700Bold,
  });

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    const unsub = onAuthStateChanged(auth, async (user: any) => {
      setUser(user);
      setAuthReady(true);
      if (user) {
        const data = await loadUserData(user.uid);
        if (data) {
          loadFromFirebase(data);
          applyRecurringsNow();
          checkAutoRules();
        } else {
          checkAutoRules();
        }
      }
      SplashScreen.hideAsync();
    });
    return unsub;
  }, [fontsLoaded, fontError]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
