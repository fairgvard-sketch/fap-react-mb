import { forwardRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView, type BottomSheetHandle } from '../BottomSheet';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useStore, useCurrency, type Goal } from '../../store/useStore';
import { C } from '../../constants/colors';
import { X, CalendarBlank, CaretLeft, CaretRight, CaretUp, CaretDown } from 'phosphor-react-native';
import { GOAL_ICON_MAP, GOAL_ICON_KEYS } from '../../constants/goalIcons';

const GOAL_COLORS = ['#1a4a35','#3d8b6b','#f4a261','#e76f51','#457b9d','#a8dadc','#e9c46a','#264653','#95d5b2','#b7e4c7'];

function todayISO() { return new Date().toISOString().slice(0, 10); }

function formatDeadline(iso: string, monthsShort: string[]) {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${monthsShort[d.getMonth()]} ${d.getFullYear()}`;
}

function CalendarFuture({ value, onChange, monthsFull, weekDays }: {
  value: string;
  onChange: (iso: string) => void;
  monthsFull: string[];
  weekDays: string[];
}) {
  const today = todayISO();
  const init = value || today;
  const sel = new Date(init + 'T12:00:00');

  const [viewYear,  setViewYear]  = useState(sel.getFullYear());
  const [viewMonth, setViewMonth] = useState(sel.getMonth());

  const now = new Date();
  const isPastMonth = viewYear < now.getFullYear() || (viewYear === now.getFullYear() && viewMonth < now.getMonth());

  const prevMonth = () => {
    if (isPastMonth) return;
    Haptics.selectionAsync();
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    Haptics.selectionAsync();
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

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
        <TouchableOpacity onPress={prevMonth} style={[cal.navBtn, isPastMonth && cal.navBtnDisabled]}>
          <CaretLeft size={16} weight="bold" color={isPastMonth ? C.borderLight : C.text} />
        </TouchableOpacity>
        <Text style={cal.monthLabel}>{monthsFull[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <CaretRight size={16} weight="bold" color={C.text} />
        </TouchableOpacity>
      </View>

      <View style={cal.weekRow}>
        {weekDays.map(d => (
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
            const isPast = iso < today;
            const selected = iso === value;
            const isToday = iso === today;
            return (
              <TouchableOpacity
                key={day}
                style={cal.cell}
                onPress={() => { if (isPast) return; onChange(iso); Haptics.selectionAsync(); }}
                activeOpacity={isPast ? 1 : 0.7}
                disabled={isPast}
              >
                <View style={[cal.circle, selected && cal.circleSel, !selected && isToday && cal.circleToday]}>
                  <Text style={[cal.dayTxt, selected && cal.dayTxtSel, !selected && isToday && cal.dayTxtToday, isPast && cal.dayTxtPast]}>
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

interface Props { editGoal?: Goal | null; onClose?: () => void; }

const GoalSheet = forwardRef<BottomSheetHandle, Props>(({ editGoal, onClose }, ref) => {
  const { t } = useTranslation();
  const monthsFull  = t('common.monthsFull').split(',');
  const monthsShort = t('common.monthsShort').split(',');
  const weekDays    = t('common.weekDays').split(',');
  const { addGoal, updateGoal, deleteGoal } = useStore();
  const currency = useCurrency();
  const [icon,     setIcon]     = useState(GOAL_ICON_KEYS[0]);
  const [color,    setColor]    = useState(GOAL_COLORS[0]);
  const [name,     setName]     = useState('');
  const [target,   setTarget]   = useState('');
  const [deadline, setDeadline] = useState('');
  const [showCal,  setShowCal]  = useState(false);

  useEffect(() => {
    if (editGoal) {
      setIcon(editGoal.icon); setColor(editGoal.color); setName(editGoal.name);
      setTarget(String(editGoal.target)); setDeadline(editGoal.deadline ?? '');
    } else {
      setIcon(GOAL_ICON_KEYS[0]); setColor(GOAL_COLORS[0]); setName(''); setTarget(''); setDeadline('');
    }
    setShowCal(false);
  }, [editGoal]);

  const handleSave = useCallback(() => {
    const tgt = parseFloat(target);
    if (!name.trim() || !tgt) return;
    const data = { icon, color, name: name.trim(), target: tgt, deadline: deadline || undefined };
    if (editGoal) updateGoal({ ...editGoal, ...data });
    else addGoal(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    (ref as any)?.current?.close();
    onClose?.();
  }, [icon, color, name, target, deadline, editGoal]);

  const handleDelete = () => {
    if (editGoal) deleteGoal(editGoal.id);
    (ref as any)?.current?.close();
    onClose?.();
  };

  return (
    <BottomSheet ref={ref} index={-1} snapPoints={['88%']} enablePanDownToClose handleIndicatorStyle={styles.handle} backgroundStyle={styles.bg}>
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{t(editGoal ? 'goal.editTitle' : 'goal.addTitle')}</Text>
          <TouchableOpacity onPress={() => { (ref as any)?.current?.close(); onClose?.(); }} style={styles.closeBtn}>
            <X size={18} weight="bold" color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.lbl}>{t('goal.icon')}</Text>
        <View style={styles.iconsRow}>
          {GOAL_ICON_KEYS.map(key => {
            const Icon = GOAL_ICON_MAP[key];
            const active = icon === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.iconBtn, active && { borderColor: color, backgroundColor: color + '20' }]}
                onPress={() => { setIcon(key); Haptics.selectionAsync(); }}
                activeOpacity={0.7}
              >
                <Icon size={24} weight="duotone" color={active ? color : C.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.lbl}>{t('goal.color')}</Text>
        <View style={styles.colorsRow}>
          {GOAL_COLORS.map(cl => (
            <TouchableOpacity key={cl} style={[styles.colorBtn, { backgroundColor: cl }, color === cl && styles.colorBtnActive]} onPress={() => { setColor(cl); Haptics.selectionAsync(); }} />
          ))}
        </View>

        <Text style={styles.lbl}>{t('goal.name')}</Text>
        <TextInput style={[styles.field, { marginBottom: 18 }]} value={name} onChangeText={setName} placeholder={t('goal.namePlaceholder')} placeholderTextColor={C.textSecondary} />

        <Text style={styles.lbl}>{t('goal.amount', { currency: currency })}</Text>
        <TextInput style={[styles.field, { marginBottom: 18 }]} value={target} onChangeText={setTarget} keyboardType="numeric" placeholder="5000" placeholderTextColor={C.textSecondary} />

        <Text style={styles.lbl}>{t('goal.deadline')}</Text>
        <TouchableOpacity
          style={styles.dateBox}
          onPress={() => { setShowCal(v => !v); Haptics.selectionAsync(); }}
          activeOpacity={0.75}
        >
          <CalendarBlank size={16} weight="duotone" color={C.textSecondary} />
          <Text style={[styles.dateLabel, !deadline && styles.datePlaceholder]}>
            {deadline ? formatDeadline(deadline, monthsShort) : t('goal.noDeadline')}
          </Text>
          {deadline ? (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); setDeadline(''); setShowCal(false); Haptics.selectionAsync(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} weight="bold" color={C.textSecondary} />
            </TouchableOpacity>
          ) : (
            showCal
              ? <CaretUp size={14} weight="bold" color={C.textSecondary} />
              : <CaretDown size={14} weight="bold" color={C.textSecondary} />
          )}
        </TouchableOpacity>

        {showCal && (
          <CalendarFuture
            value={deadline}
            onChange={iso => { setDeadline(iso); setShowCal(false); }}
            monthsFull={monthsFull}
            weekDays={weekDays}
          />
        )}

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: color, marginTop: 24 }]} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>{t('goal.save')}</Text>
        </TouchableOpacity>
        {editGoal && (
          <TouchableOpacity style={styles.delBtn} onPress={handleDelete}>
            <Text style={styles.delBtnText}>{t('goal.delete')}</Text>
          </TouchableOpacity>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

GoalSheet.displayName = 'GoalSheet';
export default GoalSheet;

const cal = StyleSheet.create({
  container:      { backgroundColor: C.white, borderRadius: 18, borderWidth: 1.5, borderColor: '#f0f0f0', padding: 12, marginTop: 8, marginBottom: 4 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn:         { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { borderColor: '#f0f0f0' },
  monthLabel:     { fontFamily: 'Manrope-Bold', fontSize: 15, color: C.text },
  weekRow:        { flexDirection: 'row', marginBottom: 4 },
  cell:           { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  weekDay:        { fontFamily: 'Manrope-SemiBold', fontSize: 12, color: C.textSecondary },
  circle:         { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  circleSel:      { backgroundColor: C.green },
  circleToday:    { backgroundColor: '#e8f5ee' },
  dayTxt:         { fontFamily: 'Manrope-Medium', fontSize: 14, color: C.text },
  dayTxtSel:      { color: C.white, fontFamily: 'Manrope-Bold' },
  dayTxtToday:    { color: C.green, fontFamily: 'Manrope-Bold' },
  dayTxtPast:     { color: C.borderLight },
});

const styles = StyleSheet.create({
  bg:              { backgroundColor: C.white },
  handle:          { backgroundColor: '#E0E0E5', width: 40 },
  content:         { padding: 22, paddingTop: 8, paddingBottom: 40, gap: 4 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:           { fontFamily: 'Manrope-Bold', fontSize: 22, color: C.text },
  closeBtn:        { width: 34, height: 34, borderRadius: 17, backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },
  lbl:             { fontFamily: 'Outfit-SemiBold', fontSize: 11, color: C.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  iconsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  iconBtn:         { width: 48, height: 48, borderRadius: 14, backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  colorsRow:       { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  colorBtn:        { width: 36, height: 36, borderRadius: 18 },
  colorBtnActive:  { transform: [{ scale: 1.2 }], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  field:           { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, fontFamily: 'Manrope-Regular', fontSize: 16, color: C.text },
  dateBox:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bg, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 4 },
  dateLabel:       { flex: 1, fontFamily: 'Manrope-Medium', fontSize: 15, color: C.text },
  datePlaceholder: { color: C.textSecondary },
  saveBtn:         { borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  saveBtnText:     { fontFamily: 'Manrope-Bold', fontSize: 16, color: C.white },
  delBtn:          { borderRadius: 16, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: C.salmon, marginTop: 10 },
  delBtnText:      { fontFamily: 'Manrope-SemiBold', fontSize: 16, color: C.salmon },
});
