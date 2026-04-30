import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import { type BottomSheetHandle } from '../../components/BottomSheet';
import { useStore } from '../../store/useStore';
import { C } from '../../constants/colors';
import AddTransactionSheet from '../../components/sheets/AddTransactionSheet';
import { House, ChartBar, ClockCounterClockwise, Plus } from 'phosphor-react-native';
import PiggyBankSvg from '../../components/PiggyBankSvg';

type PhosphorIcon = React.ComponentType<{ size?: number; weight?: string; color?: string }>;

function TabBarIcon({ focused, label, Icon }: { focused: boolean; label: string; Icon: PhosphorIcon }) {
  const color = focused ? C.green : C.navInactive;
  return (
    <View style={styles.tabItem}>
      <Icon size={22} weight={focused ? 'duotone' : 'regular'} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </View>
  );
}

function PiggyTabIcon({ focused }: { focused: boolean }) {
  const color = focused ? C.green : C.navInactive;
  return (
    <View style={styles.tabItem}>
      <PiggyBankSvg size={22} color={color} />
      <Text style={[styles.tabLabel, { color }]}>Копилка</Text>
    </View>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const user = useStore(s => s.user);
  const authReady = useStore(s => s.authReady);
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetHandle>(null);

  useEffect(() => {
    if (authReady && !user) router.replace('/login');
  }, [user, authReady]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            ...styles.tabBar,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          tabBarActiveTintColor: C.green,
          tabBarInactiveTintColor: C.navInactive,
          tabBarShowLabel: false,
        }}
        tabBar={(props) => <CustomTabBar {...props} onAdd={() => sheetRef.current?.expand()} insets={insets} />}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Главная', tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="Главная" Icon={House} /> }}
        />
        <Tabs.Screen
          name="piggy"
          options={{ title: 'Копилка', tabBarIcon: ({ focused }) => <PiggyTabIcon focused={focused} /> }}
        />
        <Tabs.Screen name="__add" options={{ href: null }} />
        <Tabs.Screen
          name="budget"
          options={{ title: 'Бюджеты', tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="Бюджеты" Icon={ChartBar} /> }}
        />
        <Tabs.Screen
          name="history"
          options={{ title: 'История', tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="История" Icon={ClockCounterClockwise} /> }}
        />
      </Tabs>
      <AddTransactionSheet ref={sheetRef} />
    </>
  );
}

function CustomTabBar({ state, descriptors, navigation, onAdd, insets }: any) {
  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom, height: 60 + insets.bottom }]}>
      {state.routes.map((route: any, index: number) => {
        if (route.name === '__add') {
          return (
            <TouchableOpacity key="add" style={styles.addBtn} onPress={onAdd} activeOpacity={0.85}>
              <Plus size={26} weight="bold" color="#fff" />
            </TouchableOpacity>
          );
        }
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <TouchableOpacity key={route.key} style={styles.tabBtn} onPress={onPress} activeOpacity={0.7}>
            {options.tabBarIcon?.({ focused, color: focused ? C.green : C.navInactive, size: 24 })}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  tabItem: { alignItems: 'center', gap: 2 },
  tabLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 10, letterSpacing: 0.2, marginTop: 2 },
  addBtn: {
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  addBtnText: { color: C.white, fontSize: 26, lineHeight: 30 },
});
