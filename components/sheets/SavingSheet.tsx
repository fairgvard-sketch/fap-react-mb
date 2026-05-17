import { forwardRef, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView, type BottomSheetHandle } from '../BottomSheet';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useStore, useCurrency, type Goal } from '../../store/useStore';
import { C } from '../../constants/colors';
import { fmt } from '../../utils/format';
import { X } from 'phosphor-react-native';

interface Props { goal: Goal | null; onClose?: () => void; }

const SavingSheet = forwardRef<BottomSheetHandle, Props>(({ goal, onClose }, ref) => {
  const { t } = useTranslation();
  const addSaving = useStore(s => s.addSaving);
  const currency = useCurrency();
  const [amount, setAmount] = useState('');

  const handleSave = useCallback(() => {
    if (!goal) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addSaving(goal.id, amt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAmount('');
    (ref as any)?.current?.close();
    onClose?.();
  }, [goal, amount, addSaving]);

  return (
    <BottomSheet ref={ref} index={-1} snapPoints={['50%']} enablePanDownToClose handleIndicatorStyle={styles.handle} backgroundStyle={styles.bg}>
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('saving.title')}</Text>
          <TouchableOpacity onPress={() => { (ref as any)?.current?.close(); onClose?.(); }} style={styles.closeBtn}>
            <X size={18} weight="bold" color={C.textSecondary} />
          </TouchableOpacity>
        </View>
        {goal && (
          <View style={styles.goalInfo}>
            <Text style={{ fontSize: 24 }}>{goal.icon}</Text>
            <View>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.goalSaved}>{t('saving.saved', { currency: currency, amount: fmt(goal.saved) })}</Text>
            </View>
          </View>
        )}
        <Text style={styles.lbl}>{t('saving.amtLabel', { currency: currency })}</Text>
        <View style={styles.amtRow}>
          <TextInput style={styles.amtInput} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={C.textSecondary} autoFocus />
          <Text style={styles.currency}>{currency}</Text>
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: goal?.color ?? C.green }]} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.btnText}>{t('saving.btn')}</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
});

SavingSheet.displayName = 'SavingSheet';
export default SavingSheet;

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
  btn: { borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  btnText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: C.white },
});
