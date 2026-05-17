import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, CurrencyCircleDollar, UsersFour, SignOut as SignOutIcon, Trash } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import BottomSheet, { type BottomSheetHandle } from '../BottomSheet';
import { C } from '../../constants/colors';
import { useStore } from '../../store/useStore';
import { auth, signOut } from '../../utils/firebase';
import type { Lang } from '../../utils/i18n';
import type { CurrencyKey } from '../../utils/format';

export type SettingsSheetHandle = { expand: () => void };

const LANG_OPTIONS: { key: Lang; labelKey: string }[] = [
  { key: 'auto', labelKey: 'settings.auto' },
  { key: 'ru',   labelKey: 'settings.ru'   },
  { key: 'en',   labelKey: 'settings.en'   },
];

const CURRENCY_OPTIONS: { key: CurrencyKey; labelKey: string }[] = [
  { key: 'RUB', labelKey: 'settings.RUB' },
  { key: 'USD', labelKey: 'settings.USD' },
  { key: 'EUR', labelKey: 'settings.EUR' },
  { key: 'ILS', labelKey: 'settings.ILS' },
];

const SettingsSheet = forwardRef<SettingsSheetHandle>((_, ref) => {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const lang        = useStore(s => s.lang);
  const setLang     = useStore(s => s.setLang);
  const currency    = useStore(s => s.currency);
  const setCurrency = useStore(s => s.setCurrency);
  const partnerUid  = useStore(s => s.partnerUid);
  const clearPartner = useStore(s => s.clearPartner);
  const user        = useStore(s => s.user);

  useImperativeHandle(ref, () => ({
    expand: () => sheetRef.current?.expand(),
  }));

  function handleDisconnect() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearPartner();
  }

  function handleSignOut() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signOut(auth);
  }

  return (
    <BottomSheet ref={sheetRef}>
      <View style={s.container}>

        {/* Title */}
        <Text style={s.title}>{t('settings.title')}</Text>

        {/* Language */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <View style={[s.sectionIcon, { backgroundColor: '#e8f5ee' }]}>
              <Globe size={18} weight="duotone" color={C.green} />
            </View>
            <Text style={s.sectionLabel}>{t('settings.language')}</Text>
          </View>
          <View style={s.langPills}>
            {LANG_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[s.pill, lang === opt.key && s.pillActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setLang(opt.key);
                }}
                activeOpacity={0.75}
              >
                <Text style={[s.pillTxt, lang === opt.key && s.pillTxtActive]}>
                  {t(opt.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Currency */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <View style={[s.sectionIcon, { backgroundColor: '#e8f5ee' }]}>
              <CurrencyCircleDollar size={18} weight="duotone" color={C.green} />
            </View>
            <Text style={s.sectionLabel}>{t('settings.currency')}</Text>
          </View>
          <View style={s.langPills}>
            {CURRENCY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[s.pill, currency === opt.key && s.pillActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCurrency(opt.key);
                }}
                activeOpacity={0.75}
              >
                <Text style={[s.pillTxt, currency === opt.key && s.pillTxtActive]}>
                  {t(opt.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Partner */}
        {partnerUid ? (
          <View style={s.section}>
            <View style={s.sectionRow}>
              <View style={[s.sectionIcon, { backgroundColor: '#e8f5ee' }]}>
                <UsersFour size={18} weight="duotone" color={C.green} />
              </View>
              <Text style={s.sectionLabel}>{t('settings.partner')}</Text>
            </View>
            <TouchableOpacity style={s.dangerBtn} onPress={handleDisconnect} activeOpacity={0.8}>
              <Trash size={16} weight="duotone" color="#E88D67" />
              <Text style={s.dangerTxt}>{t('settings.disconnectPartner')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Sign out */}
        {user ? (
          <TouchableOpacity style={s.dangerBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <SignOutIcon size={16} weight="duotone" color="#E88D67" />
            <Text style={s.dangerTxt}>{t('settings.signOut')}</Text>
          </TouchableOpacity>
        ) : null}

      </View>
    </BottomSheet>
  );
});

SettingsSheet.displayName = 'SettingsSheet';
export default SettingsSheet;

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32, gap: 24 },

  title: { fontFamily: 'Manrope-Bold', fontSize: 20, color: C.text },

  section: { gap: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 15, color: C.text },

  langPills: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.borderLight,
  },
  pillActive: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  pillTxt:       { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.textSecondary },
  pillTxtActive: { color: '#fff' },

  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#f5b8a8',
    backgroundColor: '#fffaf9',
  },
  dangerTxt: { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: '#E88D67' },
});
