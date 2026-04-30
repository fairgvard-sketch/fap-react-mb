import { forwardRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView, type BottomSheetHandle } from '../BottomSheet';
import * as Haptics from 'expo-haptics';
import { useStore, type AutoRule } from '../../store/useStore';
import { C } from '../../constants/colors';
import { EXPENSE_CATS, INCOME_CATS, CATEGORY_META } from '../../constants/categories';
import { SVCS } from '../../constants/services';
import { CustomIcon } from '../BrandIcons';
import { fmt, CURRENCY } from '../../utils/format';
import { X, CalendarBlank, CaretLeft, CaretRight, CaretUp, CaretDown } from 'phosphor-react-native';

interface Props { editRule?: AutoRule | null; onClose?: () => void; }

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const RU_MONTHS_FULL = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const ENG_MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS       = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${ENG_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function todayISO() { return new Date().toISOString().slice(0, 10); }

// Calendar that allows selecting any date (past and future)
function CalendarAny({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const sel = new Date(value + 'T12:00:00');
  const today = todayISO();

  const [viewYear,  setViewYear]  = useState(sel.getFullYear());
  const [viewMonth, setViewMonth] = useState(sel.getMonth());

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const rawFirstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset  = (rawFirstDay + 6) % 7;

  const prevMonth = () => {
    Haptics.selectionAsync();
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    Haptics.selectionAsync();
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const isoForDay = (d: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <View style={cal.container}>
      <View style={cal.header}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
          <CaretLeft size={18} weight="bold" color={C.text} />
        </TouchableOpacity>
        <Text style={cal.monthLabel}>{RU_MONTHS_FULL[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <CaretRight size={18} weight="bold" color={C.text} />
        </TouchableOpacity>
      </View>

      <View style={cal.weekRow}>
        {WEEKDAYS.map(d => (
          <View key={d} style={cal.cell}>
            <Text style={cal.weekDay}>{d}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={cal.weekRow}>
          {row.map((day, ci) => {
            if (!day) return <View key={`e-${ri}-${ci}`} style={cal.cell} />;
            const iso = isoForDay(day);
            const selected = iso === value;
            const isToday  = iso === today;
            return (
              <TouchableOpacity
                key={day}
                style={cal.cell}
                onPress={() => { onChange(iso); Haptics.selectionAsync(); }}
                activeOpacity={0.7}
              >
                <View style={[cal.circle, selected && cal.circleSel, !selected && isToday && cal.circleToday]}>
                  <Text style={[cal.dayTxt, selected && cal.dayTxtSel, !selected && isToday && cal.dayTxtToday]}>
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

// ─────────────────────────────────────────────
const AddAutoRuleSheet = forwardRef<BottomSheetHandle, Props>(({ editRule, onClose }, ref) => {
  const { subs, addAutoRule, updateAutoRule, deleteAutoRule } = useStore();

  const [ruleType,   setRuleType]   = useState<'category' | 'subscription'>('category');
  const [txType,     setTxType]     = useState<'expense' | 'income'>('expense');
  const [name,       setName]       = useState('');
  const [amount,     setAmount]     = useState('');
  const [cat,        setCat]        = useState(EXPENSE_CATS[0]);
  const [day,        setDay]        = useState(1);
  const [active,     setActive]     = useState(true);
  const [selSubId,   setSelSubId]   = useState<string | null>(null);
  const [startFrom,  setStartFrom]  = useState(todayISO());
  const [showCal,    setShowCal]    = useState(false);

  useEffect(() => {
    if (editRule) {
      setRuleType(editRule.type);
      setTxType(editRule.txType ?? 'expense');
      setName(editRule.name);
      setAmount(String(editRule.amount));
      setCat(editRule.cat);
      setDay(editRule.day);
      setActive(editRule.active);
      setSelSubId(editRule.subId ?? null);
      setStartFrom(editRule.startFrom ?? todayISO());
    } else {
      setRuleType('category');
      setTxType('expense');
      setName('');
      setAmount('');
      setCat(EXPENSE_CATS[0]);
      setDay(1);
      setActive(true);
      setSelSubId(null);
      setStartFrom(todayISO());
    }
    setShowCal(false);
  }, [editRule]);

  useEffect(() => {
    if (ruleType !== 'category') return;
    const cats = txType === 'income' ? INCOME_CATS : EXPENSE_CATS;
    if (!cats.includes(cat)) setCat(cats[0]);
  }, [txType, ruleType]);

  const close = useCallback(() => {
    (ref as any)?.current?.close();
    onClose?.();
  }, [ref, onClose]);

  const handleSave = useCallback(() => {
    if (ruleType === 'subscription') {
      if (!selSubId) return;
      const sub = subs.find(s => s.id === selSubId);
      if (!sub) return;
      const svc = SVCS.find(s => s.n === sub.svc);
      const rule = {
        type: 'subscription' as const,
        subId: sub.id, name: sub.name, amount: sub.amount,
        cat: 'Подписки', day: sub.day, active,
        txType: 'expense' as const, startFrom,
        bg: svc?.bg,
      };
      if (editRule) updateAutoRule({ ...editRule, ...rule });
      else addAutoRule(rule);
    } else {
      const amt = parseFloat(amount);
      if (!name.trim() || !amt) return;
      const rule = { type: 'category' as const, name: name.trim(), amount: amt, cat, day, active, txType, startFrom };
      if (editRule) updateAutoRule({ ...editRule, ...rule });
      else addAutoRule(rule);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    close();
  }, [ruleType, selSubId, subs, name, amount, cat, day, active, txType, startFrom, editRule]);

  const handleDelete = () => {
    if (editRule) deleteAutoRule(editRule.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    close();
  };

  const cats = txType === 'income' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <BottomSheet ref={ref} index={-1} snapPoints={['92%']} enablePanDownToClose handleIndicatorStyle={s.handle} backgroundStyle={s.bg}>
      <BottomSheetScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        <View style={s.header}>
          <Text style={s.title}>{editRule ? 'Изменить авто-платёж' : 'Новый авто-платёж'}</Text>
          <TouchableOpacity onPress={close} style={s.closeBtn}>
            <X size={18} weight="bold" color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Rule type */}
        <View style={s.sw}>
          {(['category', 'subscription'] as const).map((t, i) => (
            <TouchableOpacity key={t} style={[s.swBtn, ruleType === t && s.swBtnOn]} onPress={() => { setRuleType(t); Haptics.selectionAsync(); }}>
              <Text style={[s.swTxt, ruleType === t && s.swTxtOn]}>{i === 0 ? 'По категории' : 'Из подписки'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {ruleType === 'category' ? (
          <>
            {/* Expense / Income */}
            <View style={[s.sw, { marginBottom: 18 }]}>
              {(['expense', 'income'] as const).map((t, i) => (
                <TouchableOpacity key={t} style={[s.swBtn, txType === t && s.swBtnOn]} onPress={() => { setTxType(t); Haptics.selectionAsync(); }}>
                  <Text style={[s.swTxt, txType === t && s.swTxtOn]}>{i === 0 ? 'Расход' : 'Доход'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.lbl}>Название</Text>
            <TextInput style={[s.field, { marginBottom: 18 }]} value={name} onChangeText={setName} placeholder="напр. Аренда квартиры" placeholderTextColor={C.textSecondary} />

            <Text style={s.lbl}>Сумма</Text>
            <View style={s.amtRow}>
              <TextInput style={s.amtInput} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={C.textSecondary} />
              <Text style={s.amtCur}>{CURRENCY} /мес.</Text>
            </View>

            <Text style={s.lbl}>Категория</Text>
            <View style={s.chips}>
              {cats.map(c => {
                const meta = CATEGORY_META[c];
                const color = meta?.color ?? '#888';
                const Icon = meta?.Icon;
                const active = cat === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[s.chip, active
                      ? { backgroundColor: color + '28', borderColor: color }
                      : { backgroundColor: '#fff', borderColor: '#E8E8E8' },
                    ]}
                    onPress={() => { setCat(c); Haptics.selectionAsync(); }}
                    activeOpacity={0.75}
                  >
                    {Icon && <Icon size={14} weight="duotone" color={color} />}
                    <Text style={[s.chipTxt, { color: active ? color : C.text }]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.lbl}>День списания</Text>
            <View style={s.dayGrid}>
              {DAYS.map(d => (
                <TouchableOpacity key={d} style={[s.dayBtn, day === d && s.dayBtnOn]} onPress={() => { setDay(d); Haptics.selectionAsync(); }}>
                  <Text style={[s.dayBtnTxt, day === d && s.dayBtnTxtOn]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={s.lbl}>Выберите подписку</Text>
            {subs.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyTxt}>Сначала добавьте подписку на главном экране</Text>
              </View>
            ) : (
              <View style={{ gap: 10, marginBottom: 18 }}>
                {subs.map(sub => {
                  const svc      = SVCS.find(sv => sv.n === sub.svc);
                  const selected = selSubId === sub.id;
                  return (
                    <TouchableOpacity key={sub.id} style={[s.subRow, selected && s.subRowOn]} onPress={() => { setSelSubId(sub.id); Haptics.selectionAsync(); }} activeOpacity={0.8}>
                      <View style={[s.subIcon, { backgroundColor: svc?.bg ?? C.green }]}>
                        {svc ? <svc.Icon size={22} /> : <CustomIcon size={22} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.subName}>{sub.name}</Text>
                        <Text style={s.subMeta}>{sub.day} числа · {fmt(sub.amount)} {CURRENCY}/мес.</Text>
                      </View>
                      {selected && <View style={s.check}><Text style={{ color: C.white, fontSize: 12 }}>✓</Text></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* ── Начать с ── */}
        <Text style={s.lbl}>Начать с</Text>
        <TouchableOpacity
          style={s.dateBtn}
          onPress={() => { setShowCal(v => !v); Haptics.selectionAsync(); }}
          activeOpacity={0.75}
        >
          <CalendarBlank size={16} weight="duotone" color={C.textSecondary} />
          <Text style={s.dateBtnTxt}>{formatDate(startFrom)}</Text>
          {showCal
            ? <CaretUp   size={14} weight="bold" color={C.textSecondary} />
            : <CaretDown size={14} weight="bold" color={C.textSecondary} />
          }
        </TouchableOpacity>

        {showCal && (
          <CalendarAny
            value={startFrom}
            onChange={iso => { setStartFrom(iso); setShowCal(false); }}
          />
        )}

        {/* Active toggle */}
        <TouchableOpacity style={s.toggleRow} onPress={() => { setActive(v => !v); Haptics.selectionAsync(); }} activeOpacity={0.8}>
          <View style={{ flex: 1 }}>
            <Text style={s.toggleTitle}>Активно</Text>
            <Text style={s.toggleSub}>Автоматически создавать запись каждый месяц</Text>
          </View>
          <View style={[s.toggle, active && s.toggleOn]}>
            <View style={[s.knob, active && s.knobOn]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={s.saveBtnTxt}>{editRule ? 'Сохранить' : 'Добавить'}</Text>
        </TouchableOpacity>

        {editRule && (
          <TouchableOpacity style={s.delBtn} onPress={handleDelete} activeOpacity={0.85}>
            <Text style={s.delBtnTxt}>Удалить правило</Text>
          </TouchableOpacity>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

AddAutoRuleSheet.displayName = 'AddAutoRuleSheet';
export default AddAutoRuleSheet;

// ─── Calendar styles ───────────────────────────────────────────────────────
const cal = StyleSheet.create({
  container:  { backgroundColor: C.white, borderRadius: 18, borderWidth: 1.5, borderColor: '#f0f0f0', padding: 12, marginBottom: 4 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn:     { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontFamily: 'Manrope-Bold', fontSize: 16, color: C.text },
  weekRow:    { flexDirection: 'row', marginBottom: 4 },
  cell:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  weekDay:    { fontFamily: 'Manrope-SemiBold', fontSize: 12, color: C.textSecondary },
  circle:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  circleSel:  { backgroundColor: C.green },
  circleToday:{ backgroundColor: '#e8f5ee' },
  dayTxt:     { fontFamily: 'Manrope-Medium', fontSize: 14, color: C.text },
  dayTxtSel:  { color: C.white, fontFamily: 'Manrope-Bold' },
  dayTxtToday:{ color: C.green, fontFamily: 'Manrope-Bold' },
});

// ─── Sheet styles ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  bg:      { backgroundColor: C.white },
  handle:  { backgroundColor: '#E0E0E5', width: 40 },
  content: { padding: 22, paddingTop: 8, paddingBottom: 44, gap: 4 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:   { fontFamily: 'Manrope-Bold', fontSize: 22, color: C.text, letterSpacing: -0.4 },
  closeBtn:{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },

  sw:      { flexDirection: 'row', backgroundColor: C.borderLight, borderRadius: 50, padding: 4, marginBottom: 22 },
  swBtn:   { flex: 1, paddingVertical: 12, borderRadius: 50, alignItems: 'center' },
  swBtnOn: { backgroundColor: C.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  swTxt:   { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.textSecondary },
  swTxtOn: { color: C.text },

  lbl:   { fontFamily: 'Manrope-SemiBold', fontSize: 11, color: C.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },
  field: { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, fontFamily: 'Manrope-Regular', fontSize: 15, color: C.text },

  amtRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, marginBottom: 18 },
  amtInput: { flex: 1, fontFamily: 'Manrope-Regular', fontSize: 22, fontWeight: '500', color: C.text, paddingVertical: 12 },
  amtCur:   { fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary },

  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 13, borderRadius: 50, borderWidth: 1.5 },
  chipTxt: { fontFamily: 'Manrope-Medium', fontSize: 13 },

  dayGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  dayBtn:      { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  dayBtnOn:    { backgroundColor: C.green, borderColor: C.green },
  dayBtnTxt:   { fontFamily: 'Manrope-Medium', fontSize: 13, color: C.text },
  dayBtnTxtOn: { color: C.white },

  emptyBox: { backgroundColor: C.borderLight, borderRadius: 14, padding: 20, marginBottom: 18, alignItems: 'center' },
  emptyTxt: { fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center' },

  subRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, borderWidth: 2, borderColor: C.borderLight, backgroundColor: C.white },
  subRowOn: { borderColor: C.green, backgroundColor: '#f0faf4' },
  subIcon:  { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  subName:  { fontFamily: 'Manrope-SemiBold', fontSize: 15, color: C.text },
  subMeta:  { fontFamily: 'Manrope-Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 },
  check:    { width: 22, height: 22, borderRadius: 11, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },

  dateBtn:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bg, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8 },
  dateBtnTxt: { flex: 1, fontFamily: 'Manrope-Medium', fontSize: 15, color: C.text },

  toggleRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: C.bg, borderRadius: 16, marginBottom: 20, marginTop: 8 },
  toggleTitle:{ fontFamily: 'Manrope-SemiBold', fontSize: 15, color: C.text },
  toggleSub:  { fontFamily: 'Manrope-Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 },
  toggle:     { width: 51, height: 31, borderRadius: 20, backgroundColor: '#e0e0e0', position: 'relative' },
  toggleOn:   { backgroundColor: C.green },
  knob:       { position: 'absolute', top: 3, left: 3, width: 25, height: 25, borderRadius: 13, backgroundColor: C.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3 },
  knobOn:     { left: 23 },

  saveBtn:    { backgroundColor: C.green, borderRadius: 50, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  saveBtnTxt: { fontFamily: 'Manrope-SemiBold', fontSize: 16, color: C.white },
  delBtn:     { borderRadius: 50, paddingVertical: 15, alignItems: 'center', marginTop: 10, borderWidth: 1.5, borderColor: '#e05a5a' },
  delBtnTxt:  { fontFamily: 'Manrope-SemiBold', fontSize: 16, color: '#e05a5a' },
});
