import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { forwardRef, useImperativeHandle, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, useCurrency } from '../../store/useStore';
import CategoryIcon from '../CategoryIcon';
import { tCat } from '../../constants/categories';
import { C } from '../../constants/colors';
import { fmt } from '../../utils/format';
import { X, TrendUp, TrendDown, CalendarBlank, Scales } from 'phosphor-react-native';

export interface OverviewSheetHandle {
  open(): void;
  close(): void;
}

const OverviewSheet = forwardRef<OverviewSheetHandle>((_, ref) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const { txs } = useStore();
  const currency = useCurrency();

  useImperativeHandle(ref, () => ({
    open:  () => setVisible(true),
    close: () => setVisible(false),
  }));

  const now      = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const allIncome  = useMemo(() => txs.filter(t => t.type === 'income' ).reduce((s, t) => s + t.amount, 0), [txs]);
  const allExpense = useMemo(() => txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [txs]);
  const balance    = allIncome - allExpense;

  const mInc = useMemo(() => txs.filter(t => t.type === 'income'  && t.date.startsWith(monthStr)).reduce((s, t) => s + t.amount, 0), [txs, monthStr]);
  const mExp = useMemo(() => txs.filter(t => t.type === 'expense' && t.date.startsWith(monthStr)).reduce((s, t) => s + t.amount, 0), [txs, monthStr]);

  const days     = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const avgDaily = mExp > 0 ? Math.round(mExp / days) : 0;

  const cats = useMemo(() => {
    const map: Record<string, number> = {};
    txs.filter(t => t.type === 'expense').forEach(t => { map[t.cat] = (map[t.cat] ?? 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [txs]);

  const top = cats[0];

  const STATS = [
    { Icon: TrendUp,       iconColor: '#1a4a35', bg: '#f0faf4', lbl: t('overview.incomeMonth'),  val: `${currency} ${fmt(mInc)}`,     cl: '#1a4a35' },
    { Icon: TrendDown,     iconColor: '#E88D67', bg: '#fff0f0', lbl: t('overview.expenseMonth'), val: `${currency} ${fmt(mExp)}`,     cl: '#E88D67' },
    { Icon: CalendarBlank, iconColor: '#8B7355', bg: '#f5f3ee', lbl: t('overview.avgDaily'),     val: `${currency} ${fmt(avgDaily)}`, cl: C.text    },
    { Icon: Scales,        iconColor: '#3d8b6b', bg: '#f0f5f0', lbl: t('overview.prevMonth'),    val: '—',                            cl: '#aaa'    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setVisible(false)}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} onPress={() => setVisible(false)} activeOpacity={1} />
        <View style={s.sheet}>

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.closeBtn} onPress={() => setVisible(false)}>
              <X size={18} weight="bold" color={C.textSecondary} />
            </TouchableOpacity>
            <View>
              <Text style={s.headerHint}>{t('overview.hint')}</Text>
              <Text style={s.headerTitle}>{t('overview.title')}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

            {/* Balance card */}
            <View style={s.balCard}>
              <View style={[s.circle, { width: 160, height: 160, right: -40, top: -40 }]} />
              <View style={[s.circle, { width: 90,  height: 90,  right: 55,  top: -25 }]} />
              <View style={[s.circle, { width: 120, height: 120, right: -10, bottom: -35 }]} />
              <View style={[s.circle, { width: 70,  height: 70,  right: 100, bottom: -15 }]} />
              <View style={[s.circle, { width: 80,  height: 80,  left: -20,  bottom: -25 }]} />
              <Text style={s.balLbl}>{t('overview.totalBalance')}</Text>
              <Text style={s.balAmt}>{currency} {fmt(balance)}</Text>
              <View style={s.balRow}>
                <View style={s.balSub}>
                  <Text style={s.balSubLbl}>{t('overview.allIncome')}</Text>
                  <Text style={s.balSubAmt}>{currency} {fmt(allIncome)}</Text>
                </View>
                <View style={s.balSub}>
                  <Text style={s.balSubLbl}>{t('overview.allExpense')}</Text>
                  <Text style={s.balSubAmt}>{currency} {fmt(allExpense)}</Text>
                </View>
              </View>
            </View>

            {/* Stats 2×2 */}
            <View style={s.grid}>
              {STATS.map(({ Icon, iconColor, bg, lbl, val, cl }) => (
                <View key={lbl} style={s.statCard}>
                  <View style={[s.statIco, { backgroundColor: bg }]}>
                    <Icon size={18} weight="duotone" color={iconColor} />
                  </View>
                  <Text style={s.statLbl}>{lbl}</Text>
                  <Text style={[s.statVal, { color: cl }]}>{val}</Text>
                </View>
              ))}
            </View>

            {/* Top category */}
            {top && (
              <View style={s.topCard}>
                <CategoryIcon cat={top[0]} size={22} boxSize={48} radius={14} />
                <View style={{ flex: 1 }}>
                  <Text style={s.topHint}>{t('overview.topCat')}</Text>
                  <Text style={s.topName}>{tCat(top[0], t)}</Text>
                </View>
                <Text style={s.topAmt}>{currency} {fmt(top[1])}</Text>
              </View>
            )}


          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

OverviewSheet.displayName = 'OverviewSheet';
export default OverviewSheet;

const s = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#f7f6f2',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '93%',
    overflow: 'hidden',
  },

  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  closeBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f7f6f2', alignItems: 'center', justifyContent: 'center' },
  headerHint:  { fontFamily: 'Outfit-SemiBold', fontSize: 11, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5 },
  headerTitle: { fontFamily: 'Outfit-Medium', fontSize: 20, color: C.text, letterSpacing: -0.3, marginTop: 2 },

  content: { padding: 14, gap: 12, paddingBottom: 44 },

  balCard:   { backgroundColor: C.green, borderRadius: 22, padding: 22, overflow: 'hidden', position: 'relative' },
  circle:    { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
  balLbl:    { fontFamily: 'Outfit-SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5, marginBottom: 6 },
  balAmt:    { fontFamily: 'Outfit-Medium', fontSize: 38, color: '#fff', letterSpacing: -1, marginBottom: 16 },
  balRow:    { flexDirection: 'row', gap: 10 },
  balSub:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 14, padding: 12 },
  balSubLbl: { fontFamily: 'Outfit-SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 4 },
  balSubAmt: { fontFamily: 'Outfit-Medium', fontSize: 17, color: '#fff' },

  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47.5%', backgroundColor: '#fff', borderRadius: 16, padding: 14 },
  statIco:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLbl:  { fontFamily: 'Manrope-Regular', fontSize: 11, color: C.textSecondary, marginBottom: 4 },
  statVal:  { fontFamily: 'Outfit-Medium', fontSize: 18 },

  topCard:  { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  topHint:  { fontFamily: 'Manrope-Regular', fontSize: 11, color: C.textSecondary },
  topName:  { fontFamily: 'Outfit-Medium', fontSize: 16, color: C.text, marginTop: 2 },
  topAmt:   { fontFamily: 'Outfit-Medium', fontSize: 16, color: C.text },

});
