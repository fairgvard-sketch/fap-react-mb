import { forwardRef, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView, type BottomSheetHandle } from '../BottomSheet';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../store/useStore';
import { C } from '../../constants/colors';
import { EXPENSE_CATS, INCOME_CATS, CATEGORY_META } from '../../constants/categories';
import { Package, X, CalendarBlank, CaretLeft, CaretRight, CaretUp, CaretDown } from 'phosphor-react-native';
import { todayISO, CURRENCY } from '../../utils/format';

type TxType = 'expense' | 'income';
const ENG_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const RU_MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function formatDateLabel(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${ENG_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function MiniCalendar({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().slice(0, 10);

  const selected = new Date(value + 'T12:00:00');
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const rawFirstDay = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = (rawFirstDay + 6) % 7;

  // Can we navigate forward? Only if current view is before this month
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const isFutureMonth = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    Haptics.selectionAsync();
  };
  const nextMonth = () => {
    if (isCurrentMonth || isFutureMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    Haptics.selectionAsync();
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const isoForDay = (d: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${viewYear}-${mm}-${dd}`;
  };

  const isSelected = (d: number) => isoForDay(d) === value;
  const isToday = (d: number) => isoForDay(d) === todayISO;
  const isFuture = (d: number) => isoForDay(d) > todayISO;

  return (
    <View style={calStyles.container}>
      <View style={calStyles.header}>
        <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
          <CaretLeft size={18} weight="bold" color={C.text} />
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>{RU_MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={[calStyles.navBtn, (isCurrentMonth || isFutureMonth) && calStyles.navBtnDisabled]}
        >
          <CaretRight size={18} weight="bold" color={(isCurrentMonth || isFutureMonth) ? C.borderLight : C.text} />
        </TouchableOpacity>
      </View>

      <View style={calStyles.weekRow}>
        {WEEKDAYS.map(d => (
          <View key={d} style={calStyles.cell}>
            <Text style={calStyles.weekDay}>{d}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={calStyles.weekRow}>
          {row.map((day, ci) => {
            if (!day) return <View key={`e-${ri}-${ci}`} style={calStyles.cell} />;
            const sel = isSelected(day);
            const tod = isToday(day);
            const future = isFuture(day);
            return (
              <TouchableOpacity
                key={day}
                style={calStyles.cell}
                onPress={() => {
                  if (future) return;
                  onChange(isoForDay(day));
                  Haptics.selectionAsync();
                }}
                activeOpacity={future ? 1 : 0.7}
                disabled={future}
              >
                <View style={[
                  calStyles.dayCircle,
                  sel && calStyles.dayCircleSel,
                  !sel && tod && calStyles.dayCircleToday,
                ]}>
                  <Text style={[
                    calStyles.dayText,
                    sel && calStyles.dayTextSel,
                    !sel && tod && calStyles.dayTextToday,
                    future && calStyles.dayTextFuture,
                  ]}>
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

const AddTransactionSheet = forwardRef<BottomSheetHandle>((_, ref) => {
  const addTx = useStore(s => s.addTx);
  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState(EXPENSE_CATS[0]);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [showCalendar, setShowCalendar] = useState(false);

  const cats = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;

  const handleTypeChange = (t: TxType) => {
    setType(t);
    setCat(t === 'expense' ? EXPENSE_CATS[0] : INCOME_CATS[0]);
    Haptics.selectionAsync();
  };

  const handleCalendarSelect = (iso: string) => {
    setDate(iso);
    setShowCalendar(false);
  };

  const close = () => {
    (ref as any)?.current?.close();
    setShowCalendar(false);
  };

  const handleAdd = useCallback(() => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addTx({ type, amount: amt, cat, note: note || cat, date });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAmount('');
    setNote('');
    setDate(todayISO());
    setShowCalendar(false);
    close();
  }, [amount, type, cat, note, date, addTx]);

  return (
    <BottomSheet ref={ref} index={-1} snapPoints={['88%']} enablePanDownToClose handleIndicatorStyle={styles.handle} backgroundStyle={styles.bg}>
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.title}>Новая запись</Text>
          <TouchableOpacity onPress={close} style={styles.closeBtn}>
            <X size={18} weight="bold" color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Type */}
        <View style={styles.typeSwitcher}>
          <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]} onPress={() => handleTypeChange('expense')}>
            <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Расход</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]} onPress={() => handleTypeChange('income')}>
            <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Доход</Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <Text style={styles.lbl}>Сумма</Text>
        <View style={styles.amtRow}>
          <TextInput
            style={styles.amtInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={C.textSecondary}
          />
          <Text style={styles.currency}>{CURRENCY}</Text>
        </View>

        {/* Date */}
        <Text style={styles.lbl}>Дата</Text>
        <TouchableOpacity
          style={styles.dateBox}
          onPress={() => { setShowCalendar(s => !s); Haptics.selectionAsync(); }}
          activeOpacity={0.75}
        >
          <CalendarBlank size={16} weight="duotone" color={C.textSecondary} />
          <Text style={styles.dateLabel}>{formatDateLabel(date)}</Text>
          {showCalendar
            ? <CaretUp size={14} weight="bold" color={C.textSecondary} />
            : <CaretDown size={14} weight="bold" color={C.textSecondary} />
          }
        </TouchableOpacity>

        {showCalendar && (
          <MiniCalendar value={date} onChange={handleCalendarSelect} />
        )}

        {/* Note */}
        <Text style={styles.lbl}>Описание</Text>
        <TextInput
          style={styles.field}
          value={note}
          onChangeText={setNote}
          placeholder="напр. Wolt, такси, iPhone"
          placeholderTextColor={C.textSecondary}
        />

        {/* Categories */}
        <Text style={styles.lbl}>Категория</Text>
        <View style={styles.chips}>
          {cats.map(c => {
            const meta = CATEGORY_META[c];
            const baseColor = meta?.color ?? '#888';
            const Icon = meta?.Icon ?? Package;
            const active = cat === c;
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: baseColor + '28', borderColor: baseColor, borderWidth: 1.5 }
                    : { backgroundColor: '#fff', borderColor: '#E8E8E8', borderWidth: 1.5 },
                ]}
                onPress={() => { setCat(c); Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                <Icon size={15} weight="duotone" color={baseColor} />
                <Text style={[styles.chipText, { color: '#1c1c1e' }]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>Добавить</Text>
        </TouchableOpacity>

      </BottomSheetScrollView>
    </BottomSheet>
  );
});

AddTransactionSheet.displayName = 'AddTransactionSheet';
export default AddTransactionSheet;

const C_GREEN = '#1a4a35';

const calStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
    padding: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { borderColor: '#f0f0f0' },
  monthLabel: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#1c1c1e' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  weekDay: { fontFamily: 'Manrope-SemiBold', fontSize: 12, color: '#8e8e93' },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSel: { backgroundColor: C_GREEN },
  dayCircleToday: { backgroundColor: '#e8f5ee' },
  dayText: { fontFamily: 'Manrope-Medium', fontSize: 14, color: '#1c1c1e' },
  dayTextSel: { color: '#fff', fontFamily: 'Manrope-Bold' },
  dayTextToday: { color: C_GREEN, fontFamily: 'Manrope-Bold' },
  dayTextFuture: { color: '#d0d0d0' },
});

const styles = StyleSheet.create({
  bg: { backgroundColor: C.white },
  handle: { backgroundColor: '#E0E0E5', width: 40 },
  content: { padding: 22, paddingTop: 8, gap: 4, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: 'Manrope-Bold', fontSize: 22, color: C.text, letterSpacing: -0.4 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },
  typeSwitcher: { flexDirection: 'row', backgroundColor: C.borderLight, borderRadius: 50, padding: 4, marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 50, alignItems: 'center' },
  typeBtnActive: { backgroundColor: C.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  typeBtnText: { fontFamily: 'Manrope-SemiBold', fontSize: 15, color: C.textSecondary },
  typeBtnTextActive: { color: C.text },
  lbl: { fontFamily: 'Manrope-SemiBold', fontSize: 11, color: C.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 12 },
  amtRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: '#E0E0D8', paddingBottom: 10, marginBottom: 4 },
  amtInput: { flex: 1, fontFamily: 'Manrope-Regular', fontSize: 36, fontWeight: '300', color: C.text },
  currency: { fontFamily: 'Manrope-Regular', fontSize: 22, color: C.textSecondary },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  dateLabel: { flex: 1, fontFamily: 'Manrope-Medium', fontSize: 15, color: C.text },
  field: { borderWidth: 1.5, borderColor: C.border, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, fontFamily: 'Manrope-Regular', fontSize: 15, color: C.text, backgroundColor: C.white },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 50,
  },

  chipText: { fontFamily: 'Manrope-Medium', fontSize: 12 },
  addBtn: { backgroundColor: C_GREEN, borderRadius: 50, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  addBtnText: { fontFamily: 'Manrope-SemiBold', fontSize: 16, color: C.white, letterSpacing: -0.2 },
});
