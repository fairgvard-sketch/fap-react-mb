import { forwardRef, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView, type BottomSheetHandle } from '../BottomSheet';
import * as Haptics from 'expo-haptics';
import { useStore, type Goal } from '../../store/useStore';
import { C } from '../../constants/colors';
import { fmt, CURRENCY } from '../../utils/format';
import { X } from 'phosphor-react-native';

interface Props { goal: Goal | null; onClose?: () => void; }

const WithdrawSheet = forwardRef<BottomSheetHandle, Props>(({ goal, onClose }, ref) => {
  const withdraw = useStore(s => s.withdraw);
  const [amount, setAmount] = useState('');

  const handleWithdraw = useCallback(() => {
    if (!goal) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    withdraw(goal.id, amt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setAmount('');
    (ref as any)?.current?.close();
    onClose?.();
  }, [goal, amount, withdraw]);

  return (
    <BottomSheet ref={ref} index={-1} snapPoints={['50%']} enablePanDownToClose handleIndicatorStyle={styles.handle} backgroundStyle={styles.bg}>
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Снять со счёта</Text>
          <TouchableOpacity onPress={() => { (ref as any)?.current?.close(); onClose?.(); }} style={styles.closeBtn}>
            <X size={18} weight="bold" color={C.textSecondary} />
          </TouchableOpacity>
        </View>
        {goal && (
          <View style={styles.goalInfo}>
            <Text style={{ fontSize: 24 }}>{goal.icon}</Text>
            <View>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.goalSaved}>Доступно: {CURRENCY} {fmt(goal.saved)}</Text>
            </View>
          </View>
        )}
        <Text style={styles.lbl}>Сумма снятия {CURRENCY}</Text>
        <View style={styles.amtRow}>
          <TextInput style={styles.amtInput} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={C.textSecondary} autoFocus />
          <Text style={styles.currency}>{CURRENCY}</Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleWithdraw} activeOpacity={0.85}>
          <Text style={styles.btnText}>− Снять</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
});

WithdrawSheet.displayName = 'WithdrawSheet';
export default WithdrawSheet;

const styles = StyleSheet.create({
  bg: { backgroundColor: C.white },
  handle: { backgroundColor: '#E0E0E5', width: 40 },
  content: { padding: 22, paddingTop: 8, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Manrope-Bold', fontSize: 22, color: C.text },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },
  goalInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.borderLight, borderRadius: 14, padding: 14 },
  goalName: { fontFamily: 'Manrope-SemiBold', fontSize: 15, color: C.text },
  goalSaved: { fontFamily: 'Manrope-Regular', fontSize: 13, color: C.textSecondary },
  lbl: { fontFamily: 'Outfit-SemiBold', fontSize: 11, color: C.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  amtRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: '#E0E0D8', paddingBottom: 10 },
  amtInput: { flex: 1, fontFamily: 'Manrope-Regular', fontSize: 36, fontWeight: '300', color: C.text },
  currency: { fontFamily: 'Manrope-Regular', fontSize: 22, color: C.textSecondary },
  btn: { borderRadius: 50, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white },
  btnText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: C.text },
});
