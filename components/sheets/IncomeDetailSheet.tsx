import { Modal, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { X, CaretLeft, CaretRight } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { C } from '../../constants/colors';
import { CATEGORY_META, CAT_KEY, tCat } from '../../constants/categories';
import CategoryIcon from '../CategoryIcon';
import { fmt } from '../../utils/format';
import { useCurrency, type Transaction } from '../../store/useStore';

const CHART_H = 60;
const MONTH_ROWS = [[0,1,2,3],[4,5,6,7],[8,9,10,11]];

function fmtDayLabel(iso: string, monthsGen: string[]) {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${monthsGen[d.getMonth()]}`;
}

export default function IncomeDetailSheet({ cat, txs, onClose }: {
  cat: string | null;
  txs: Transaction[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const monthsFull  = t('common.monthsFull').split(',');
  const monthsShort = t('common.monthsShort').split(',');
  const monthsGen   = t('common.monthsGen').split(',');

  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();

  const [selectedYear,  setSelectedYear]  = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const meta = cat ? CATEGORY_META[cat] : null;
  const accentColor = meta?.color ?? C.green;

  const catTxs = useMemo(
    () => txs.filter(tx => tx.type === 'income' && tx.cat === cat).sort((a, b) => b.date.localeCompare(a.date)),
    [txs, cat],
  );

  const allTotal = useMemo(() => catTxs.reduce((s, tx) => s + tx.amount, 0), [catTxs]);

  const avgPerMonth = useMemo(() => {
    const months = new Set(catTxs.map(tx => tx.date.slice(0, 7)));
    return months.size > 0 ? Math.round(allTotal / months.size) : 0;
  }, [catTxs, allTotal]);

  const last8 = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(currentYear, currentMonth - (7 - i), 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const total = catTxs.filter(tx => tx.date.startsWith(ym)).reduce((s, tx) => s + tx.amount, 0);
      return { ym, total, isCurrent: i === 7, label: monthsShort[d.getMonth()] };
    });
  }, [catTxs, monthsShort]);

  const chartMax = useMemo(() => Math.max(...last8.map(m => m.total), 1), [last8]);

  const minYear = useMemo(() => {
    const years = catTxs.map(tx => parseInt(tx.date.slice(0, 4)));
    return years.length > 0 ? Math.min(...years) : currentYear;
  }, [catTxs, currentYear]);

  const byDayFiltered = useMemo(() => {
    const prefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const totals: Record<string, number> = {};
    const items: Record<string, Transaction[]> = {};
    catTxs.forEach(tx => {
      if (!tx.date.startsWith(prefix)) return;
      totals[tx.date] = (totals[tx.date] ?? 0) + tx.amount;
      (items[tx.date] = items[tx.date] || []).push(tx);
    });
    return Object.entries(totals)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, total]) => ({ date, total, items: items[date] }));
  }, [catTxs, selectedYear, selectedMonth]);

  const selectedMonthTotal = useMemo(
    () => byDayFiltered.reduce((s, d) => s + d.total, 0),
    [byDayFiltered],
  );

  function isFutureMonth(year: number, month: number) {
    return year > currentYear || (year === currentYear && month > currentMonth);
  }

  return (
    <Modal visible={cat !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

          {/* ── Hero ── */}
          <View style={s.hero}>
            <View style={s.heroTop}>
              <View style={s.heroLeft}>
                {cat ? <CategoryIcon cat={cat} size={22} boxSize={50} radius={16} /> : null}
                <Text style={s.heroCat}>{cat ? tCat(cat, t) : ''}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={18} weight="bold" color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={[s.statVal, { color: accentColor }]} numberOfLines={1} adjustsFontSizeToFit>
                  +{fmt(allTotal)} {currency}
                </Text>
                <Text style={s.statLbl}>{t('incomeDetail.allTime')}</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statVal} numberOfLines={1} adjustsFontSizeToFit>
                  {avgPerMonth > 0 ? `+${fmt(avgPerMonth)} ${currency}` : '—'}
                </Text>
                <Text style={s.statLbl}>{t('incomeDetail.avgMonth')}</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statVal}>{catTxs.length}</Text>
                <Text style={s.statLbl}>{t('incomeDetail.payments')}</Text>
              </View>
            </View>

            <View style={s.chart}>
              {last8.map(({ ym, total, isCurrent, label }) => {
                const barH = total > 0 ? Math.max(5, Math.round((total / chartMax) * CHART_H)) : 3;
                return (
                  <View key={ym} style={s.chartCol}>
                    <View style={s.chartColInner}>
                      <View style={[
                        s.chartBar,
                        { height: barH, backgroundColor: isCurrent ? accentColor : accentColor + '40', borderRadius: barH <= 6 ? 2 : 5 },
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

          {/* ── Calendar picker ── */}
          <View style={s.calendarWrap}>
            <View style={s.yearRow}>
              <TouchableOpacity
                onPress={() => setSelectedYear(y => Math.max(minYear, y - 1))}
                disabled={selectedYear <= minYear}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <CaretLeft size={18} weight="bold" color={selectedYear <= minYear ? C.borderLight : C.text} />
              </TouchableOpacity>
              <Text style={s.yearTxt}>{selectedYear}</Text>
              <TouchableOpacity
                onPress={() => setSelectedYear(y => Math.min(currentYear, y + 1))}
                disabled={selectedYear >= currentYear}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <CaretRight size={18} weight="bold" color={selectedYear >= currentYear ? C.borderLight : C.text} />
              </TouchableOpacity>
            </View>

            <View style={s.monthGrid}>
              {MONTH_ROWS.map((row, ri) => (
                <View key={ri} style={s.monthGridRow}>
                  {row.map(mi => {
                    const active    = selectedMonth === mi;
                    const isCurrent = mi === currentMonth && selectedYear === currentYear;
                    const disabled  = isFutureMonth(selectedYear, mi);
                    return (
                      <TouchableOpacity
                        key={mi}
                        style={[
                          s.monthCell,
                          active    && { backgroundColor: accentColor },
                          isCurrent && !active && { borderWidth: 1.5, borderColor: accentColor + '80' },
                          disabled  && s.monthCellDisabled,
                        ]}
                        onPress={() => !disabled && setSelectedMonth(mi)}
                        activeOpacity={disabled ? 1 : 0.75}
                      >
                        <Text style={[
                          s.monthCellTxt,
                          active   && { color: '#fff', fontFamily: 'Manrope-Bold' },
                          disabled && { color: C.borderLight },
                        ]}>
                          {monthsShort[mi]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            <View style={s.monthTotalRow}>
              <Text style={s.monthTotalLbl}>{monthsFull[selectedMonth]} {selectedYear}</Text>
              <Text style={[s.monthTotalAmt, { color: accentColor }]}>
                {selectedMonthTotal > 0 ? `+${fmt(selectedMonthTotal)} ${currency}` : '—'}
              </Text>
            </View>
          </View>

          {/* ── Days list ── */}
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            {catTxs.length === 0 && (
              <Text style={s.empty}>{t('incomeDetail.empty')}</Text>
            )}
            {byDayFiltered.length === 0 && catTxs.length > 0 && (
              <Text style={s.empty}>{t('incomeDetail.noDataPeriod')}</Text>
            )}
            {byDayFiltered.map(({ date, total, items }) => (
              <View key={date}>
                <View style={s.dayHeader}>
                  <Text style={s.dayDate}>{fmtDayLabel(date, monthsGen)}</Text>
                  <Text style={[s.dayTotal, { color: accentColor }]}>+{fmt(total)} {currency}</Text>
                </View>
                <View style={s.txCard}>
                  {items.map((tx, i) => (
                    <View key={tx.id} style={[s.txRow, i < items.length - 1 && s.txSep]}>
                      <Text style={s.txNote} numberOfLines={1}>{(tx.note && !CAT_KEY[tx.note]) ? tx.note : tCat(tx.cat, t)}</Text>
                      <Text style={[s.txAmt, { color: accentColor }]}>+{fmt(tx.amount)} {currency}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  hero:          { backgroundColor: C.white, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  heroTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  heroLeft:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroCat:       { fontFamily: 'Outfit-Medium', fontSize: 26, color: C.text, letterSpacing: -0.6 },
  closeBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },

  statsRow:      { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 16, padding: 14, marginBottom: 22, gap: 2 },
  statItem:      { flex: 1, alignItems: 'center', gap: 5 },
  statVal:       { fontFamily: 'Outfit-Medium', fontSize: 14, color: C.text, letterSpacing: -0.2 },
  statLbl:       { fontFamily: 'Outfit-SemiBold', fontSize: 9, color: C.textSecondary, letterSpacing: 0.7, textTransform: 'uppercase' },
  statDivider:   { width: 1, backgroundColor: C.borderLight, marginHorizontal: 2 },

  chart:         { flexDirection: 'row', height: CHART_H + 18, alignItems: 'flex-end', gap: 5 },
  chartCol:      { flex: 1, alignItems: 'center', gap: 5 },
  chartColInner: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBar:      { width: '100%' },
  chartLabel:    { fontFamily: 'Manrope-Regular', fontSize: 9, color: C.navInactive },

  calendarWrap:      { backgroundColor: C.white, margin: 16, marginBottom: 4, borderRadius: 20, padding: 16 },
  yearRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  yearTxt:           { fontFamily: 'Outfit-Medium', fontSize: 20, color: C.text, letterSpacing: -0.4 },
  monthGrid:         { gap: 8 },
  monthGridRow:      { flexDirection: 'row', gap: 8 },
  monthCell:         { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: C.bg },
  monthCellDisabled: { opacity: 0.35 },
  monthCellTxt:      { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: C.text },
  monthTotalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.borderLight },
  monthTotalLbl:     { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.textSecondary },
  monthTotalAmt:     { fontFamily: 'Outfit-Medium', fontSize: 17, letterSpacing: -0.3 },

  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4, marginBottom: 8 },
  dayDate:   { fontFamily: 'Outfit-Medium', fontSize: 17, color: C.text },
  dayTotal:  { fontFamily: 'Manrope-SemiBold', fontSize: 13 },
  txCard:    { backgroundColor: C.white, borderRadius: 18, overflow: 'hidden', marginBottom: 4 },
  txRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  txSep:     { borderBottomWidth: 1, borderBottomColor: C.borderLight },
  txNote:    { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.text, flex: 1, marginRight: 8 },
  txAmt:     { fontFamily: 'Outfit-Medium', fontSize: 14 },

  empty: { fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center', paddingTop: 40 },
});
