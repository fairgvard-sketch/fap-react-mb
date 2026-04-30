import { Modal, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { X } from 'phosphor-react-native';
import { C } from '../../constants/colors';
import { CATEGORY_META } from '../../constants/categories';
import CategoryIcon from '../CategoryIcon';
import { fmt, RU_GEN, RU_FULL, RU_SHORT, CURRENCY } from '../../utils/format';
import type { Transaction } from '../../store/useStore';

const CHART_H = 60;
type Tab = 'days' | 'months' | 'years';

function fmtDayLabel(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${RU_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtMonthLabel(ym: string) {
  const [y, m] = ym.split('-');
  return `${RU_FULL[parseInt(m) - 1]} ${y}`;
}

export default function IncomeDetailSheet({ cat, txs, onClose }: {
  cat: string | null;
  txs: Transaction[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('months');
  const meta = cat ? CATEGORY_META[cat] : null;
  const accentColor = meta?.color ?? C.green;

  const catTxs = useMemo(
    () => txs.filter(t => t.type === 'income' && t.cat === cat).sort((a, b) => b.date.localeCompare(a.date)),
    [txs, cat],
  );

  const allTotal = useMemo(() => catTxs.reduce((s, t) => s + t.amount, 0), [catTxs]);

  const avgPerMonth = useMemo(() => {
    const months = new Set(catTxs.map(t => t.date.slice(0, 7)));
    return months.size > 0 ? Math.round(allTotal / months.size) : 0;
  }, [catTxs, allTotal]);

  // Last 8 months for the sparkline chart
  const last8 = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const total = catTxs.filter(t => t.date.startsWith(ym)).reduce((s, t) => s + t.amount, 0);
      return { ym, total, isCurrent: i === 7, label: RU_SHORT[d.getMonth()] };
    });
  }, [catTxs]);

  const chartMax = useMemo(() => Math.max(...last8.map(m => m.total), 1), [last8]);

  const byDay = useMemo(() => {
    const totals: Record<string, number> = {};
    const items: Record<string, Transaction[]> = {};
    catTxs.forEach(t => {
      totals[t.date] = (totals[t.date] ?? 0) + t.amount;
      (items[t.date] = items[t.date] || []).push(t);
    });
    return Object.entries(totals)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, total]) => ({ date, total, items: items[date] }));
  }, [catTxs]);

  const byMonth = useMemo(() => {
    const map: Record<string, number> = {};
    catTxs.forEach(t => { const ym = t.date.slice(0, 7); map[ym] = (map[ym] ?? 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [catTxs]);

  const byYear = useMemo(() => {
    const map: Record<string, number> = {};
    catTxs.forEach(t => { const y = t.date.slice(0, 4); map[y] = (map[y] ?? 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [catTxs]);

  const maxMonth = useMemo(() => Math.max(...byMonth.map(([, v]) => v), 1), [byMonth]);
  const maxYear  = useMemo(() => Math.max(...byYear.map(([, v]) => v), 1), [byYear]);

  const currentYM = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'days',   label: 'По дням' },
    { key: 'months', label: 'По месяцам' },
    { key: 'years',  label: 'По годам' },
  ];

  return (
    <Modal visible={cat !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

          {/* ── Hero ── */}
          <View style={s.hero}>

            {/* Top row: icon + name + close */}
            <View style={s.heroTop}>
              <View style={s.heroLeft}>
                {cat ? <CategoryIcon cat={cat} size={22} boxSize={50} radius={16} /> : null}
                <Text style={s.heroCat}>{cat}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={18} weight="bold" color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* 3 stat chips */}
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={[s.statVal, { color: accentColor }]} numberOfLines={1} adjustsFontSizeToFit>
                  +{fmt(allTotal)} {CURRENCY}
                </Text>
                <Text style={s.statLbl}>ЗА ВСЁ ВРЕМЯ</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statVal} numberOfLines={1} adjustsFontSizeToFit>
                  {avgPerMonth > 0 ? `+${fmt(avgPerMonth)} ${CURRENCY}` : '—'}
                </Text>
                <Text style={s.statLbl}>СР. В МЕСЯЦ</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statVal}>{catTxs.length}</Text>
                <Text style={s.statLbl}>ВЫПЛАТ</Text>
              </View>
            </View>

            {/* Sparkline bar chart — last 8 months */}
            <View style={s.chart}>
              {last8.map(({ ym, total, isCurrent, label }) => {
                const barH = total > 0 ? Math.max(5, Math.round((total / chartMax) * CHART_H)) : 3;
                return (
                  <View key={ym} style={s.chartCol}>
                    <View style={s.chartColInner}>
                      <View style={[
                        s.chartBar,
                        {
                          height: barH,
                          backgroundColor: isCurrent ? accentColor : accentColor + '40',
                          borderRadius: barH <= 6 ? 2 : 5,
                        },
                      ]} />
                    </View>
                    <Text style={[s.chartLabel, isCurrent && { color: accentColor, fontFamily: 'Manrope-Bold' }]}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Tabs ── */}
          <View style={s.tabs}>
            {TABS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[s.tab, tab === key && { backgroundColor: accentColor }]}
                onPress={() => setTab(key)}
                activeOpacity={0.75}
              >
                <Text style={[s.tabTxt, tab === key && { color: '#fff' }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Content ── */}
          <View style={{ paddingHorizontal: 16, gap: 10 }}>

            {catTxs.length === 0 && (
              <Text style={s.empty}>Нет операций для этой категории</Text>
            )}

            {/* По дням */}
            {tab === 'days' && byDay.map(({ date, total, items }) => (
              <View key={date}>
                <View style={s.dayHeader}>
                  <Text style={s.dayDate}>{fmtDayLabel(date)}</Text>
                  <Text style={[s.dayTotal, { color: accentColor }]}>+{fmt(total)} {CURRENCY}</Text>
                </View>
                <View style={s.txCard}>
                  {items.map((tx, i) => (
                    <View key={tx.id} style={[s.txRow, i < items.length - 1 && s.txSep]}>
                      <Text style={s.txNote} numberOfLines={1}>{tx.note || tx.cat}</Text>
                      <Text style={[s.txAmt, { color: accentColor }]}>+{fmt(tx.amount)} {CURRENCY}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* По месяцам */}
            {tab === 'months' && byMonth.map(([ym, total]) => {
              const pct = Math.max(2, Math.round((total / maxMonth) * 100));
              const isCur = ym === currentYM;
              return (
                <View key={ym} style={[s.rowCard, isCur && { borderWidth: 1.5, borderColor: accentColor + '55' }]}>
                  {isCur && (
                    <View style={[s.badge, { backgroundColor: accentColor + '18' }]}>
                      <Text style={[s.badgeTxt, { color: accentColor }]}>этот месяц</Text>
                    </View>
                  )}
                  <View style={s.rowTop}>
                    <Text style={s.rowLabel}>{fmtMonthLabel(ym)}</Text>
                    <Text style={[s.rowAmt, { color: accentColor }]}>+{fmt(total)} {CURRENCY}</Text>
                  </View>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${pct}%`, backgroundColor: accentColor }]} />
                  </View>
                </View>
              );
            })}

            {/* По годам */}
            {tab === 'years' && byYear.map(([year, total], idx) => {
              const pct = Math.max(2, Math.round((total / maxYear) * 100));
              const prevTotal = byYear[idx + 1]?.[1];
              const diff = prevTotal != null ? Math.round((total / prevTotal - 1) * 100) : null;
              return (
                <View key={year} style={s.rowCard}>
                  <View style={s.rowTop}>
                    <View>
                      <Text style={s.rowLabel}>{year} год</Text>
                      {diff !== null && (
                        <Text style={[s.diffTxt, { color: diff >= 0 ? '#1b7a47' : '#c0392b' }]}>
                          {diff >= 0 ? '▲' : '▼'} {Math.abs(diff)}% к {byYear[idx + 1][0]} г.
                        </Text>
                      )}
                    </View>
                    <Text style={[s.rowAmt, { color: accentColor }]}>+{fmt(total)} {CURRENCY}</Text>
                  </View>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${pct}%`, backgroundColor: accentColor }]} />
                  </View>
                </View>
              );
            })}
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  // Hero
  hero:     { backgroundColor: C.white, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  heroTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroCat:  { fontFamily: 'Outfit-Medium', fontSize: 26, color: C.text, letterSpacing: -0.6 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },

  // Stats
  statsRow:    { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 16, padding: 14, marginBottom: 22, gap: 2 },
  statItem:    { flex: 1, alignItems: 'center', gap: 5 },
  statVal:     { fontFamily: 'Outfit-Medium', fontSize: 14, color: C.text, letterSpacing: -0.2 },
  statLbl:     { fontFamily: 'Outfit-SemiBold', fontSize: 9, color: C.textSecondary, letterSpacing: 0.7, textTransform: 'uppercase' },
  statDivider: { width: 1, backgroundColor: C.borderLight, marginHorizontal: 2 },

  // Sparkline
  chart:       { flexDirection: 'row', height: CHART_H + 18, alignItems: 'flex-end', gap: 5 },
  chartCol:    { flex: 1, alignItems: 'center', gap: 5 },
  chartColInner: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBar:    { width: '100%' },
  chartLabel:  { fontFamily: 'Manrope-Regular', fontSize: 9, color: C.navInactive },

  // Tabs
  tabs:   { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 12 },
  tab:    { flex: 1, paddingVertical: 10, borderRadius: 13, alignItems: 'center', backgroundColor: C.white },
  tabTxt: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: C.textSecondary },

  // Days
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4, marginBottom: 8 },
  dayDate:   { fontFamily: 'Outfit-Medium', fontSize: 17, color: C.text },
  dayTotal:  { fontFamily: 'Manrope-SemiBold', fontSize: 13 },
  txCard:    { backgroundColor: C.white, borderRadius: 18, overflow: 'hidden', marginBottom: 4 },
  txRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  txSep:     { borderBottomWidth: 1, borderBottomColor: C.borderLight },
  txNote:    { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.text, flex: 1, marginRight: 8 },
  txAmt:     { fontFamily: 'Outfit-Medium', fontSize: 14 },

  // Months / Years
  rowCard:  { backgroundColor: C.white, borderRadius: 18, padding: 16, gap: 10 },
  rowTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 15, color: C.text },
  rowAmt:   { fontFamily: 'Outfit-Medium', fontSize: 17, letterSpacing: -0.3 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: C.borderLight, overflow: 'hidden' },
  barFill:  { height: 8, borderRadius: 4 },
  badge:    { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 20, marginBottom: 4 },
  badgeTxt: { fontFamily: 'Manrope-SemiBold', fontSize: 11 },
  diffTxt:  { fontFamily: 'Manrope-Regular', fontSize: 12, marginTop: 3 },

  empty: { fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center', paddingTop: 40 },
});
