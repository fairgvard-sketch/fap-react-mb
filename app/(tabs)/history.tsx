import { ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, useCurrency } from '../../store/useStore';
import { C } from '../../constants/colors';
import { CATEGORY_META, CAT_KEY, tCat } from '../../constants/categories';
import CategoryIcon from '../../components/CategoryIcon';
import { MagnifyingGlass, X, CalendarBlank, Mailbox, Package } from 'phosphor-react-native';
import { fmt, todayISO } from '../../utils/format';
import SwipeableRow from '../../components/SwipeableRow';

const FALLBACK_COLORS = ['#E88D67','#457b9d','#3d8b6b','#e9c46a','#9b72cf','#f4a261'];

// ─── Donut chart constants ────────────────────────────────────────────────────
const CHART_SIZE = 260;
const CX = CHART_SIZE / 2;   // 130
const CY = CHART_SIZE / 2;   // 130
const R_OUT  = 98;
const R_IN   = 70;            // кольцо 28px
const R_ICON  = Math.round((R_OUT + R_IN) / 2);  // 84
const R_LABEL = R_OUT + 22;                        // 120

function polarXY(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function segmentPath(startAngle: number, endAngle: number, gap = 2.5): string {
  const s = startAngle + gap / 2;
  const e = endAngle   - gap / 2;
  if (e <= s) return '';
  const sOut = polarXY(s, R_OUT), eOut = polarXY(e, R_OUT);
  const sIn  = polarXY(s, R_IN),  eIn  = polarXY(e, R_IN);
  const large = (e - s) > 180 ? 1 : 0;
  return [
    `M ${sOut.x.toFixed(2)} ${sOut.y.toFixed(2)}`,
    `A ${R_OUT} ${R_OUT} 0 ${large} 1 ${eOut.x.toFixed(2)} ${eOut.y.toFixed(2)}`,
    `L ${eIn.x.toFixed(2)} ${eIn.y.toFixed(2)}`,
    `A ${R_IN} ${R_IN} 0 ${large} 0 ${sIn.x.toFixed(2)} ${sIn.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function somISO(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function eomISO(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}
function labelFor(start: string, end: string, monthsFull: string[], monthsGen: string[], yearLabel: string): string {
  const s = new Date(start + 'T12:00:00'), e = new Date(end + 'T12:00:00');
  if (start === end) return `${s.getDate()} ${monthsGen[s.getMonth()]} ${s.getFullYear()}`;
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    if (start === somISO(start) && end === eomISO(start))
      return `${monthsFull[s.getMonth()]} ${s.getFullYear()}`;
    return `${s.getDate()} – ${e.getDate()} ${monthsGen[s.getMonth()]} ${s.getFullYear()}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    if (start === s.getFullYear() + '-01-01' && end === s.getFullYear() + '-12-31')
      return yearLabel.replace('{{year}}', String(s.getFullYear()));
  }
  return `${s.getDate()} ${monthsGen[s.getMonth()]} – ${e.getDate()} ${monthsGen[e.getMonth()]} ${e.getFullYear()}`;
}


// ─── Calendar ────────────────────────────────────────────────────────────────
function MonthCalendar({ year, month, startSel, endSel, onDay, today, monthsFull, weekDays }: {
  year: number; month: number;
  startSel: string | null; endSel: string | null;
  onDay: (iso: string) => void;
  today: string;
  monthsFull: string[];
  weekDays: string[];
}) {
  const ms = `${year}-${String(month + 1).padStart(2, '0')}`;
  const fd = new Date(year, month, 1).getDay();
  const offset = fd === 0 ? 6 : fd - 1;
  const dim = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={cal.monthLabel}>{monthsFull[month]}, {year}</Text>
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {weekDays.map(w => (
          <View key={w} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={cal.weekDay}>{w}</Text>
          </View>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {cells.slice(r * 7, r * 7 + 7).map((day, c) => {
            if (!day) return <View key={c} style={cal.emptyCell} />;
            const iso = `${ms}-${String(day).padStart(2, '0')}`;
            const isFuture = iso > today;
            const isSt = iso === startSel, isEn = iso === endSel;
            const inR = !!(startSel && endSel && iso > startSel && iso < endSel);
            return (
              <TouchableOpacity
                key={c}
                style={[cal.dayCell, inR && !isFuture && cal.dayInRange]}
                onPress={() => !isFuture && onDay(iso)}
                activeOpacity={isFuture ? 1 : 0.7}
              >
                <View style={[cal.dayDot, (isSt || isEn) && !isFuture && cal.dayDotSel]}>
                  <Text style={[cal.dayTxt, isFuture && cal.dayTxtFuture, (isSt || isEn) && !isFuture && cal.dayTxtSel]}>
                    {day}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ cats, total, accentColor, totalLabel }: {
  cats: [string, number][];
  total: number;
  accentColor: string;
  totalLabel: string;
}) {
  const currency = useCurrency();
  if (cats.length === 0) return null;
  const totalSafe = total || 1;
  const isSingle  = cats.length === 1;

  let cum = 0;
  const segments = cats.map(([cat, amt], i) => {
    const pct    = amt / totalSafe;
    const sweep  = pct * 360;
    const start  = cum;
    const end    = cum + sweep;
    const mid    = cum + sweep / 2;
    cum = end;
    const color    = CATEGORY_META[cat]?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
    const iconPos  = polarXY(mid, R_ICON);
    const labelPos = polarXY(mid, R_LABEL);
    return { cat, pct, start, end, mid, color, iconPos, labelPos };
  });

  const ICON_BOX = 28;
  const LBL_W    = 36;
  const LBL_H    = 18;

  return (
    <View style={{ width: CHART_SIZE, height: CHART_SIZE }}>

      {/* Segments (SVG) */}
      <Svg width={CHART_SIZE} height={CHART_SIZE} style={{ position: 'absolute' }}>
        {segments.map(({ cat, pct, start, end, color }) => {
          const path = isSingle ? segmentPath(0, 359.99, 0) : segmentPath(start, end);
          return <Path key={cat} d={path} fill={color} />;
        })}
      </Svg>

      {/* Category icons — one per segment */}
      {segments.map(({ cat, iconPos, color, pct }) => {
        if (pct < 0.04) return null;
        const meta = CATEGORY_META[cat];
        const Icon = meta?.Icon ?? Package;
        return (
          <View
            key={`icon-${cat}`}
            style={{
              position: 'absolute',
              left: iconPos.x - ICON_BOX / 2,
              top:  iconPos.y - ICON_BOX / 2,
              width: ICON_BOX, height: ICON_BOX,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon size={15} weight="duotone" color="#fff" />
          </View>
        );
      })}

      {/* % labels outside the ring */}
      {segments.map(({ cat, labelPos, pct }) => {
        const pctInt = Math.round(pct * 100);
        if (pctInt < 5) return null;
        return (
          <View
            key={`lbl-${cat}`}
            style={{
              position: 'absolute',
              left: labelPos.x - LBL_W / 2,
              top:  labelPos.y - LBL_H / 2,
              width: LBL_W, height: LBL_H,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 12, color: C.textSecondary }}>
              {pctInt}%
            </Text>
          </View>
        );
      })}

      {/* Center label (absolute, over the hole) */}
      <View
        style={{
          position: 'absolute',
          left: CX - 56, top: CY - 26,
          width: 112, height: 52,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: 'Manrope-SemiBold', fontSize: 10, color: C.textSecondary, letterSpacing: 1 }}>
          {totalLabel}
        </Text>
        <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 20, color: accentColor, letterSpacing: -0.5, marginTop: 2 }}>
          {fmt(total)} {currency}
        </Text>
      </View>

    </View>
  );
}

// ─── Category breakdown modal ─────────────────────────────────────────────────
function CategoryModal({
  visible, onClose, cats, total, label, accentColor, title, totalLabel, catLabel,
}: {
  visible: boolean;
  onClose: () => void;
  cats: [string, number][];
  total: number;
  label: string;
  accentColor: string;
  title: string;
  totalLabel: string;
  catLabel: (cat: string) => string;
}) {
  const currency = useCurrency();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.white }} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

          {/* ── Header: amount + X button ── */}
          <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 40, color: C.text, letterSpacing: -1.5, lineHeight: 46 }}>
                  {fmt(total)} {currency}
                </Text>
                <Text style={{ fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary, marginTop: 5 }}>
                  {title} · {label}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 38, height: 38, borderRadius: 19,
                  backgroundColor: C.borderLight,
                  alignItems: 'center', justifyContent: 'center',
                  marginTop: 4,
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} weight="bold" color={C.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Donut chart ── */}
          {cats.length > 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <DonutChart cats={cats} total={total} accentColor={accentColor} totalLabel={totalLabel} />

            </View>
          )}

          {/* ── 2-column pill legend ── */}
          {cats.length > 0 && (
            <View style={{ paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {cats.map(([cat, amt], i) => {
                  const meta  = CATEGORY_META[cat];
                  const color = meta?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                  const Icon  = meta?.Icon ?? Package;
                  return (
                    <View
                      key={cat}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: color + '18',
                        borderRadius: 50,
                        paddingVertical: 6,
                        paddingLeft: 6,
                        paddingRight: 11,
                        gap: 7,
                        width: '47%',
                      }}
                    >
                      <View style={{
                        width: 28, height: 28, borderRadius: 14,
                        backgroundColor: color,
                        alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={14} weight="duotone" color="#fff" />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{ fontFamily: 'Manrope-SemiBold', fontSize: 11, color: C.text }}>
                          {catLabel(cat)}
                        </Text>
                        <Text numberOfLines={1} style={{ fontFamily: 'Outfit-Medium', fontSize: 11, color: color, marginTop: 0 }}>
                          {fmt(amt)} {currency}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const { t } = useTranslation();
  const monthsFull = t('common.monthsFull').split(',');
  const monthsGen  = t('common.monthsGen').split(',');
  const weekDays   = t('common.weekDays').split(',');
  const { txs, deleteTx } = useStore();
  const currency = useCurrency();
  const [search, setSearch]     = useState('');
  const [calOpen, setCalOpen]   = useState(false);
  const [chartMode, setChartMode] = useState<'expense' | 'income' | null>(null);
  const [visibleCount, setVisibleCount] = useState(30);
  const now = todayISO();
  const [start, setStart]       = useState(somISO(now));
  const [end,   setEnd]         = useState(eomISO(now));
  const [active, setActive]     = useState(true);
  const [tmpS,  setTmpS]        = useState<string | null>(null);
  const [tmpE,  setTmpE]        = useState<string | null>(null);

  const calScrollRef   = useRef<ScrollView>(null);
  const currentMonthY  = useRef(0);

  const calMonths = useMemo(() => {
    const list: { year: number; month: number }[] = [];
    const d = new Date();
    const curYear = d.getFullYear();
    const curMonth = d.getMonth();
    // 11 прошлых месяцев → текущий → до конца года
    const monthsBack = 11;
    const monthsAhead = 11 - curMonth; // до декабря включительно
    for (let i = -monthsBack; i <= monthsAhead; i++) {
      const m = new Date(curYear, curMonth + i, 1);
      list.push({ year: m.getFullYear(), month: m.getMonth() });
    }
    return list;
  }, []);

  const filtered = useMemo(() => {
    setVisibleCount(30);
    let list = [...txs].sort((a, b) => b.date.localeCompare(a.date));
    if (active) list = list.filter(t => t.date >= start && t.date <= end);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(tx => (tx.note?.toLowerCase().includes(q)) || tx.cat.toLowerCase().includes(q));
    }
    return list;
  }, [txs, start, end, active, search]);

  const income  = useMemo(() => filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [filtered]);
  const expense = useMemo(() => filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [filtered]);

  const catParts = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense').forEach(t => { map[t.cat] = (map[t.cat] ?? 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [filtered]);

  const expenseCats = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense').forEach(t => { map[t.cat] = (map[t.cat] ?? 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const incomeCats = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === 'income').forEach(t => { map[t.cat] = (map[t.cat] ?? 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const groups = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    filtered.slice(0, visibleCount).forEach(t => { (map[t.date] = map[t.date] || []).push(t); });
    return Object.entries(map);
  }, [filtered, visibleCount]);

  const hasMore = filtered.length > visibleCount;

  function openCal() {
    setTmpS(start); setTmpE(end); setCalOpen(true);
    setTimeout(() => {
      calScrollRef.current?.scrollTo({ y: currentMonthY.current, animated: false });
    }, 120);
  }
  function handleDay(iso: string) {
    if (!tmpS || (tmpS && tmpE)) { setTmpS(iso); setTmpE(null); }
    else { if (iso < tmpS) { setTmpE(tmpS); setTmpS(iso); } else setTmpE(iso); }
  }
  function apply() {
    if (tmpS) { setStart(tmpS); setEnd(tmpE || tmpS); setActive(true); }
    setCalOpen(false);
  }
  function preset(p: 'today' | '7days' | 'month' | 'year') {
    const n = todayISO();
    if (p === 'today')  { setTmpS(n); setTmpE(n); }
    if (p === '7days')  { setTmpS(addDays(n, -6)); setTmpE(n); }
    if (p === 'month')  { setTmpS(somISO(n)); setTmpE(eomISO(n)); }
    if (p === 'year')   { setTmpS(n.slice(0, 4) + '-01-01'); setTmpE(n.slice(0, 4) + '-12-31'); }
  }
  function grpDate(d: string) {
    const dt = new Date(d + 'T12:00:00');
    return `${dt.getDate()} ${monthsGen[dt.getMonth()]}`;
  }

  const periodLabel = active
    ? labelFor(start, end, monthsFull, monthsGen, t('history.yearLabel'))
    : t('history.all');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Date chip */}
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={active ? styles.chipOn : styles.chipOff} onPress={openCal}>
            <CalendarBlank size={15} weight="duotone" color={C.textSecondary} />
            <Text style={[styles.chipTxt, !active && { color: C.textSecondary }]}>
              {active ? labelFor(start, end, monthsFull, monthsGen, t('history.yearLabel')) : t('history.all')}
            </Text>
            {active && (
              <TouchableOpacity onPress={() => setActive(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={14} weight="bold" color={C.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Summary cards — clickable */}
        <View style={styles.summRow}>
          <TouchableOpacity
            style={styles.summCard}
            activeOpacity={expense > 0 ? 0.7 : 1}
            onPress={() => expense > 0 && setChartMode('expense')}
          >
            <Text style={[styles.summAmt, { color: '#E88D67' }]} numberOfLines={1}>{fmt(expense)} {currency}</Text>
            <Text style={styles.summLbl}>{t('history.expense')} {expense > 0 && '›'}</Text>
            {expense > 0 && catParts.length > 0 && (
              <View style={{ flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
                {catParts.map(([cat, amt], i) => (
                  <View key={cat} style={{
                    flex: amt / expense, height: 4,
                    backgroundColor: CATEGORY_META[cat]?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                    marginRight: i < catParts.length - 1 ? 1 : 0,
                  }} />
                ))}
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summCard}
            activeOpacity={income > 0 ? 0.7 : 1}
            onPress={() => income > 0 && setChartMode('income')}
          >
            <Text style={[styles.summAmt, { color: '#1a4a35' }]} numberOfLines={1}>+{fmt(income)} {currency}</Text>
            <Text style={styles.summLbl}>{t('history.income')} {income > 0 && '›'}</Text>
            {income > 0 && (
              <View style={{ flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
                <View style={{ flex: 1, height: 4, backgroundColor: '#457b9d', borderRadius: 2 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <MagnifyingGlass size={18} weight="regular" color={C.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t('history.search')}
            placeholderTextColor={C.textSecondary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} weight="bold" color={C.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Transaction groups */}
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Mailbox size={52} weight="duotone" color={C.textSecondary} />
            <Text style={styles.emptyTitle}>{t('history.empty')}</Text>
            <Text style={styles.emptyDesc}>{t('history.emptyDesc')}</Text>
          </View>
        ) : (
          <>
            {groups.map(([date, items]) => {
              const dI = items.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
              const dE = items.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
              const dB = dI - dE;
              return (
                <View key={date}>
                  <View style={styles.grpHdr}>
                    <Text style={styles.grpDate}>{grpDate(date)}</Text>
                    <Text style={[styles.grpBal, { color: dB >= 0 ? '#1a4a35' : '#E88D67' }]}>
                      {dB >= 0 ? '+' : '−'}{fmt(Math.abs(dB))} {currency}
                    </Text>
                  </View>
                  <View style={styles.txCard}>
                    {items.map(tx => (
                      <SwipeableRow key={tx.id} onDelete={() => deleteTx(tx.id)}>
                        <View style={styles.txRow}>
                          <CategoryIcon cat={tx.cat} size={20} boxSize={44} radius={12} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.txNote} numberOfLines={1}>{(tx.note && !CAT_KEY[tx.note]) ? tx.note : tCat(tx.cat, t)}</Text>
                            <Text style={styles.txMeta}>{tCat(tx.cat, t)}</Text>
                          </View>
                          <Text style={[styles.txAmt, { color: tx.type === 'income' ? '#1a4a35' : '#E88D67' }]}>
                            {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)} {currency}
                          </Text>
                        </View>
                      </SwipeableRow>
                    ))}
                  </View>
                </View>
              );
            })}
            {hasMore && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => setVisibleCount(c => c + 30)}
                activeOpacity={0.7}
              >
                <Text style={styles.loadMoreTxt}>
                  {t('history.loadMore', { n: filtered.length - visibleCount })}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Calendar modal */}
      <Modal visible={calOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
          <View style={styles.mHdr}>
            <TouchableOpacity onPress={() => setCalOpen(false)}>
              <Text style={styles.mClose}>{t('history.close')}</Text>
            </TouchableOpacity>
            <Text style={styles.mTitle}>{t('history.selectPeriod')}</Text>
            <TouchableOpacity onPress={apply}>
              <Text style={styles.mDone}>{t('history.done')}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ backgroundColor: C.white }}>
            <View style={styles.drRow}>
              <View style={styles.drBox}>
                <Text style={styles.drLbl}>{t('history.dateFrom')}</Text>
                <Text style={styles.drVal}>{tmpS ? tmpS.split('-').reverse().join('.') : '—'}</Text>
              </View>
              <View style={styles.drBox}>
                <Text style={styles.drLbl}>{t('history.dateTo')}</Text>
                <Text style={styles.drVal}>{tmpE ? tmpE.split('-').reverse().join('.') : '—'}</Text>
              </View>
            </View>
            <View style={styles.presetsRow}>
              {(['today', '7days', 'month', 'year'] as const).map((p, i) => (
                <TouchableOpacity key={p} style={styles.presetBtn} onPress={() => preset(p)}>
                  <Text style={styles.presetTxt}>{[t('history.today'), t('history.sevenDays'), t('history.thisMonth'), t('history.thisYear')][i]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <ScrollView ref={calScrollRef} contentContainerStyle={{ padding: 16, paddingTop: 20 }}>
            {calMonths.map(({ year, month }) => {
              const isCurrent = year === new Date().getFullYear() && month === new Date().getMonth();
              return (
                <View
                  key={`${year}-${month}`}
                  onLayout={isCurrent ? e => { currentMonthY.current = e.nativeEvent.layout.y; } : undefined}
                >
                  <MonthCalendar
                    year={year} month={month}
                    startSel={tmpS} endSel={tmpE}
                    onDay={handleDay}
                    today={now}
                    monthsFull={monthsFull}
                    weekDays={weekDays}
                  />
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Expense breakdown modal */}
      <CategoryModal
        visible={chartMode === 'expense'}
        onClose={() => setChartMode(null)}
        cats={expenseCats}
        total={expense}
        label={periodLabel}
        accentColor="#E88D67"
        title={t('history.expenseCats')}
        totalLabel={t('history.total')}
        catLabel={cat => tCat(cat, t)}
      />

      {/* Income breakdown modal */}
      <CategoryModal
        visible={chartMode === 'income'}
        onClose={() => setChartMode(null)}
        cats={incomeCats}
        total={income}
        label={periodLabel}
        accentColor="#1a4a35"
        title={t('history.incomeSources')}
        totalLabel={t('history.total')}
        catLabel={cat => tCat(cat, t)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const cal = StyleSheet.create({
  monthLabel: { fontFamily: 'Manrope-Bold', fontSize: 17, color: C.text, marginBottom: 12 },
  weekDay: { fontFamily: 'Manrope-Medium', fontSize: 12, color: C.textSecondary },
  emptyCell: { flex: 1, height: 40 },
  dayCell: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' },
  dayInRange: { backgroundColor: '#dff0e8' },
  dayDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayDotSel: { backgroundColor: C.green },
  dayTxt: { fontFamily: 'Manrope-Regular', fontSize: 15, color: C.text },
  dayTxtSel: { color: '#fff', fontFamily: 'Manrope-Bold' },
  dayTxtFuture: { color: C.navInactive },
});


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 8, gap: 12, paddingBottom: 32 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchInput: { flex: 1, fontFamily: 'Manrope-Regular', fontSize: 15, color: C.text },

  chipOn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.green, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, gap: 8, alignSelf: 'flex-start' },
  chipOff: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, gap: 8, alignSelf: 'flex-start', borderWidth: 1.5, borderColor: C.border },
  chipTxt: { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: '#fff' },

  summRow: { flexDirection: 'row', gap: 12 },
  summCard: { flex: 1, backgroundColor: C.white, borderRadius: 18, padding: 16 },
  summAmt: { fontFamily: 'Outfit-Medium', fontSize: 22, letterSpacing: -0.5 },
  summLbl: { fontFamily: 'Outfit-SemiBold', fontSize: 11, color: C.textSecondary, letterSpacing: 1, marginTop: 4 },

  grpHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, paddingHorizontal: 4 },
  grpDate: { fontFamily: 'Outfit-Medium', fontSize: 17, color: C.text },
  grpBal: { fontFamily: 'Manrope-SemiBold', fontSize: 13 },

  txCard: { backgroundColor: C.white, borderRadius: 20, overflow: 'hidden', marginBottom: 4 },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: C.white },
  txNote: { fontFamily: 'Manrope-SemiBold', fontSize: 15, color: C.text },
  txMeta: { fontFamily: 'Manrope-Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 },
  txAmt: { fontFamily: 'Outfit-Medium', fontSize: 15 },

  loadMoreBtn: { alignItems: 'center', paddingVertical: 14, backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.border },
  loadMoreTxt: { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.textSecondary },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontFamily: 'Manrope-Bold', fontSize: 18, color: C.text },
  emptyDesc: { fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center' },

  mHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.borderLight, backgroundColor: C.white },
  mClose: { fontFamily: 'Manrope-SemiBold', fontSize: 16, color: C.textSecondary },
  mTitle: { fontFamily: 'Manrope-Bold', fontSize: 17, color: C.text },
  mDone: { fontFamily: 'Manrope-SemiBold', fontSize: 16, color: C.green },
  drRow: { flexDirection: 'row', padding: 16, paddingBottom: 12, gap: 16 },
  drBox: { flex: 1, borderBottomWidth: 2, borderBottomColor: C.green, paddingBottom: 8 },
  drLbl: { fontFamily: 'Manrope-Regular', fontSize: 11, color: C.textSecondary, marginBottom: 4 },
  drVal: { fontFamily: 'Manrope-SemiBold', fontSize: 16, color: C.text },
  presetsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16, flexWrap: 'wrap' },
  presetBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: C.border },
  presetTxt: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: C.text },
});
