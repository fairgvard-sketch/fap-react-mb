import { View, Text, TouchableOpacity, StyleSheet, Share, TextInput, ActivityIndicator } from 'react-native';
import { forwardRef, useState } from 'react';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { UsersFour, LinkSimple, X, Trash, CheckCircle } from 'phosphor-react-native';
import BottomSheet, { type BottomSheetHandle } from '../BottomSheet';
import { C } from '../../constants/colors';
import { useStore } from '../../store/useStore';
import { createInvite, resolveInvite, loadPartnerSummary } from '../../utils/firebase';

export type PartnerSheetHandle = BottomSheetHandle;

const PartnerSheet = forwardRef<PartnerSheetHandle>((_, ref) => {
  const user          = useStore(s => s.user);
  const partnerUid    = useStore(s => s.partnerUid);
  const partnerSummary = useStore(s => s.partnerSummary);
  const setPartner    = useStore(s => s.setPartner);
  const clearPartner  = useStore(s => s.clearPartner);

  const [tab, setTab]         = useState<'invite' | 'code'>('invite');
  const [loading, setLoading] = useState(false);
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [linked, setLinked]   = useState(false);

  async function handleShare() {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const inviteCode = await createInvite(user.uid);
      const url = Linking.createURL('invite', { queryParams: { code: inviteCode } });
      await Share.share({
        message: `Привет! Подключись к моему кошельку в Финансовый контроль: ${url}`,
        url,
      });
    } catch {
      // user cancelled share — no-op
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeemCode() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) { setError('Введите 6-значный код'); return; }
    setLoading(true);
    setError('');
    try {
      const uid = await resolveInvite(trimmed);
      if (!uid) { setError('Код не найден или истёк'); setLoading(false); return; }
      if (uid === user?.uid) { setError('Нельзя подключить себя'); setLoading(false); return; }
      const summary = await loadPartnerSummary(uid);
      if (!summary) { setError('Не удалось загрузить данные партнёра'); setLoading(false); return; }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPartner(uid, summary);
      setLinked(true);
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }

  function handleDisconnect() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearPartner();
    setLinked(false);
    setCode('');
    setError('');
  }

  return (
    <BottomSheet ref={ref} snapPoints={['55%']}>
      <View style={s.container}>

        {/* Title */}
        <View style={s.titleRow}>
          <View style={s.iconWrap}>
            <UsersFour size={22} weight="duotone" color={C.green} />
          </View>
          <Text style={s.title}>Сравнение кошельков</Text>
        </View>

        {/* Already linked */}
        {partnerUid ? (
          <View style={s.linkedBox}>
            <CheckCircle size={32} weight="duotone" color={C.green} style={{ marginBottom: 8 }} />
            <Text style={s.linkedTitle}>Партнёр подключён</Text>
            <Text style={s.linkedSub}>Данные обновляются при каждом открытии приложения</Text>
            <TouchableOpacity style={s.disconnectBtn} onPress={handleDisconnect} activeOpacity={0.8}>
              <Trash size={16} weight="duotone" color="#E88D67" />
              <Text style={s.disconnectTxt}>Отключить партнёра</Text>
            </TouchableOpacity>
          </View>
        ) : linked ? (
          <View style={s.linkedBox}>
            <CheckCircle size={32} weight="duotone" color={C.green} style={{ marginBottom: 8 }} />
            <Text style={s.linkedTitle}>Партнёр подключён!</Text>
            <Text style={s.linkedSub}>Теперь в разделе сравнения кошельков отображаются реальные данные</Text>
          </View>
        ) : (
          <>
            {/* Tabs */}
            <View style={s.tabs}>
              <TouchableOpacity style={[s.tab, tab === 'invite' && s.tabActive]} onPress={() => setTab('invite')} activeOpacity={0.8}>
                <Text style={[s.tabTxt, tab === 'invite' && s.tabTxtActive]}>Пригласить</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.tab, tab === 'code' && s.tabActive]} onPress={() => setTab('code')} activeOpacity={0.8}>
                <Text style={[s.tabTxt, tab === 'code' && s.tabTxtActive]}>Ввести код</Text>
              </TouchableOpacity>
            </View>

            {tab === 'invite' ? (
              <View style={s.panel}>
                <Text style={s.panelDesc}>
                  Отправь партнёру ссылку-приглашение. Когда он откроет её, кошельки свяжутся автоматически.
                </Text>
                <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.85} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <LinkSimple size={18} weight="bold" color="#fff" />
                        <Text style={s.shareBtnTxt}>Поделиться ссылкой</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.panel}>
                <Text style={s.panelDesc}>
                  Попроси партнёра нажать «Пригласить» и отправить тебе код. Введи его ниже.
                </Text>
                <TextInput
                  style={[s.codeInput, error ? s.codeInputErr : null]}
                  value={code}
                  onChangeText={t => { setCode(t.toUpperCase()); setError(''); }}
                  placeholder="AB12CD"
                  placeholderTextColor={C.textSecondary}
                  maxLength={6}
                  autoCapitalize="characters"
                  keyboardType="default"
                />
                {error ? <Text style={s.errorTxt}>{error}</Text> : null}
                <TouchableOpacity style={s.shareBtn} onPress={handleRedeemCode} activeOpacity={0.85} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.shareBtnTxt}>Подключить</Text>
                  }
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </BottomSheet>
  );
});

PartnerSheet.displayName = 'PartnerSheet';
export default PartnerSheet;

const s = StyleSheet.create({
  container:     { flex: 1, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },
  titleRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  iconWrap:      { width: 40, height: 40, borderRadius: 20, backgroundColor: C.green + '18', alignItems: 'center', justifyContent: 'center' },
  title:         { fontFamily: 'Manrope-Bold', fontSize: 18, color: C.text },

  tabs:          { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 14, padding: 4, marginBottom: 20 },
  tab:           { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 11 },
  tabActive:     { backgroundColor: C.white, shadowColor: '#000', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3 },
  tabTxt:        { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.textSecondary },
  tabTxtActive:  { color: C.text },

  panel:         { gap: 14 },
  panelDesc:     { fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary, lineHeight: 20 },

  shareBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.green, borderRadius: 18, paddingVertical: 16 },
  shareBtnTxt:   { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },

  codeInput:     { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'Manrope-SemiBold', fontSize: 22, color: C.text, letterSpacing: 6, textAlign: 'center', backgroundColor: C.white },
  codeInputErr:  { borderColor: '#E88D67' },
  errorTxt:      { fontFamily: 'Manrope-Regular', fontSize: 13, color: '#E88D67', textAlign: 'center' },

  linkedBox:     { alignItems: 'center', gap: 6, paddingTop: 12 },
  linkedTitle:   { fontFamily: 'Manrope-Bold', fontSize: 18, color: C.text },
  linkedSub:     { fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  disconnectBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1.5, borderColor: '#f5b8a8', marginTop: 8 },
  disconnectTxt: { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: '#E88D67' },
});
