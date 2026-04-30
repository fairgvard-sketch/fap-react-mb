import { forwardRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetScrollView, type BottomSheetHandle } from '../BottomSheet';
import * as Haptics from 'expo-haptics';
import { useStore, type Subscription } from '../../store/useStore';
import { C } from '../../constants/colors';
import { SVCS } from '../../constants/services';
import { X } from 'phosphor-react-native';
import { fmt, CURRENCY } from '../../utils/format';

interface Props {
  editSub?: Subscription | null;
  onClose?: () => void;
}

const AddSubscriptionSheet = forwardRef<BottomSheetHandle, Props>(({ editSub, onClose }, ref) => {
  const { addSub, updateSub, deleteSub } = useStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState(1);
  const [svc, setSvc] = useState('Своя');
  const [autoCharge, setAutoCharge] = useState(false);

  useEffect(() => {
    if (editSub) {
      setName(editSub.name);
      setAmount(String(editSub.amount));
      setDay(editSub.day);
      setSvc(editSub.svc);
      setAutoCharge(editSub.autoCharge);
    } else {
      setName(''); setAmount(''); setDay(1); setSvc('Своя'); setAutoCharge(false);
    }
  }, [editSub]);

  const handleSave = useCallback(() => {
    const amt = parseFloat(amount);
    if (!name.trim() || !amt) return;
    const data = { name: name.trim(), amount: amt, day, svc, autoCharge };
    if (editSub) updateSub({ ...editSub, ...data });
    else addSub(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    (ref as any)?.current?.close();
    onClose?.();
  }, [name, amount, day, svc, autoCharge, editSub]);

  const handleDelete = () => {
    if (editSub) deleteSub(editSub.id);
    (ref as any)?.current?.close();
    onClose?.();
  };

  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <BottomSheet ref={ref} index={-1} snapPoints={['90%']} enablePanDownToClose handleIndicatorStyle={styles.handle} backgroundStyle={styles.bg}>
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{editSub ? 'Изменить подписку' : 'Новая подписка'}</Text>
          <TouchableOpacity onPress={() => { (ref as any)?.current?.close(); onClose?.(); }} style={styles.closeBtn}>
            <X size={18} weight="bold" color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Service picker */}
        <Text style={styles.lbl}>Сервис</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {SVCS.map(s => (
              <TouchableOpacity
                key={s.n}
                style={[styles.svcItem, svc === s.n && styles.svcItemActive]}
                onPress={() => { setSvc(s.n); if (!editSub) setName(s.n === 'Своя' ? '' : s.n); Haptics.selectionAsync(); }}
              >
                <View style={[styles.svcIcon, { backgroundColor: s.bg }]}>
                  <s.Icon size={26} />
                </View>
                <Text style={styles.svcName}>{s.n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Name */}
        <Text style={styles.lbl}>Название</Text>
        <TextInput style={[styles.field, { marginBottom: 18 }]} value={name} onChangeText={setName} placeholder="Netflix" placeholderTextColor={C.textSecondary} />

        {/* Amount */}
        <Text style={styles.lbl}>Стоимость в месяц</Text>
        <View style={styles.amtRow}>
          <TextInput style={styles.amtInput} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={C.textSecondary} />
          <Text style={styles.amtCurrency}>{CURRENCY} / мес.</Text>
        </View>

        {/* Day of charge */}
        <Text style={styles.lbl}>День списания</Text>
        <View style={styles.dayGrid}>
          {days.map(d => (
            <TouchableOpacity key={d} style={[styles.dayBtn, day === d && styles.dayBtnActive]} onPress={() => { setDay(d); Haptics.selectionAsync(); }}>
              <Text style={[styles.dayBtnText, day === d && styles.dayBtnTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {editSub && (
          <TouchableOpacity style={styles.autoRow} onPress={() => setAutoCharge(v => !v)}>
            <Text style={styles.autoLabel}>Авто-списание</Text>
            <View style={[styles.toggle, autoCharge && styles.toggleOn]}>
              <View style={[styles.toggleKnob, autoCharge && styles.toggleKnobOn]} />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>{editSub ? 'Сохранить' : 'Добавить подписку'}</Text>
        </TouchableOpacity>
        {editSub && (
          <TouchableOpacity style={styles.delBtn} onPress={handleDelete}>
            <Text style={styles.delBtnText}>Удалить подписку</Text>
          </TouchableOpacity>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

AddSubscriptionSheet.displayName = 'AddSubscriptionSheet';
export default AddSubscriptionSheet;

const styles = StyleSheet.create({
  bg: { backgroundColor: C.white },
  handle: { backgroundColor: '#E0E0E5', width: 40 },
  content: { padding: 22, paddingTop: 8, paddingBottom: 40, gap: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  title: { fontFamily: 'Manrope-Bold', fontSize: 20, color: C.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },
  lbl: { fontFamily: 'Outfit-SemiBold', fontSize: 11, color: C.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  svcItem: { alignItems: 'center', gap: 6 },
  svcItemActive: { opacity: 1 },
  svcIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  svcName: { fontFamily: 'Manrope-Medium', fontSize: 11, color: C.textSecondary },
  field: { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, fontFamily: 'Manrope-Regular', fontSize: 15, color: C.text },
  amtRow: { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  amtInput: { flex: 1, fontFamily: 'Outfit-SemiBold', fontSize: 24, color: C.text, letterSpacing: -0.5 },
  amtCurrency: { fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 22 },
  dayBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  dayBtnActive: { backgroundColor: C.green, borderColor: C.green },
  dayBtnText: { fontFamily: 'Manrope-Medium', fontSize: 12, color: C.text },
  dayBtnTextActive: { color: C.white },
  autoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.white, borderRadius: 14, borderWidth: 1.5, borderColor: '#EFECE6', padding: 14, marginBottom: 18 },
  autoLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.text },
  toggle: { width: 51, height: 31, borderRadius: 16, backgroundColor: C.border, justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn: { backgroundColor: C.green },
  toggleKnob: { width: 27, height: 27, borderRadius: 14, backgroundColor: C.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  toggleKnobOn: { transform: [{ translateX: 20 }] },
  saveBtn: { backgroundColor: C.green, borderRadius: 50, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  saveBtnText: { fontFamily: 'Manrope-SemiBold', fontSize: 15, color: C.white },
  delBtn: { borderRadius: 50, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.salmon, marginTop: 10 },
  delBtnText: { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.salmon },
});
