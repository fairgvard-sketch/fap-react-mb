import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useState } from 'react';
import { type BottomSheetHandle } from '../../components/BottomSheet';
import { useStore, type Goal } from '../../store/useStore';
import { C } from '../../constants/colors';
import { fmt, CURRENCY } from '../../utils/format';
import GoalSheet from '../../components/sheets/GoalSheet';
import SavingSheet from '../../components/sheets/SavingSheet';
import WithdrawSheet from '../../components/sheets/WithdrawSheet';
import { PencilSimple, Plus } from 'phosphor-react-native';
import PiggyBankSvg from '../../components/PiggyBankSvg';
import { GOAL_ICON_MAP } from '../../constants/goalIcons';

function deadlineLabel(deadline: string): string {
  const d = new Date(deadline + 'T12:00:00');
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? ` · осталось ${diff} дн.` : ' · срок истёк';
}

export default function PiggyScreen() {
  const { goals } = useStore();
  const goalSheetRef    = useRef<BottomSheetHandle>(null);
  const savingSheetRef  = useRef<BottomSheetHandle>(null);
  const withdrawSheetRef = useRef<BottomSheetHandle>(null);
  const [editGoal, setEditGoal]   = useState<Goal | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);

  const totalSaved  = goals.reduce((s, g) => s + g.saved,  0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalPct    = totalTarget > 0 ? Math.min(100, Math.round(totalSaved / totalTarget * 100)) : 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.subtitle}>НАКОПЛЕНИЯ</Text>
            <Text style={s.title}>Копилка</Text>
          </View>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => { setEditGoal(null); goalSheetRef.current?.expand(); }}
          >
            <Plus size={20} weight="bold" color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Total card */}
        <View style={s.totalCard}>
          <View style={s.deco1} />
          <View style={s.deco2} />
          <View style={s.piggyDeco} pointerEvents="none">
            <PiggyBankSvg size={80} color="rgba(255,255,255,0.12)" />
          </View>
          <Text style={s.totalLbl}>ВСЕГО НАКОПЛЕНО</Text>
          <Text style={s.totalAmt}>
            {fmt(totalSaved)} <Text style={s.totalCur}>{CURRENCY}</Text>
          </Text>
          {totalTarget > 0 && (
            <>
              <Text style={s.totalSub}>из {fmt(totalTarget)} {CURRENCY} · {totalPct}%</Text>
              <View style={s.totalBarBg}>
                <View style={[s.totalBarFill, { width: `${totalPct}%` as any }]} />
              </View>
            </>
          )}
        </View>

        {/* Goals list or empty state */}
        {goals.length === 0 ? (
          <View style={s.emptyBox}>
            <PiggyBankSvg size={72} color={C.green} />
            <Text style={s.emptyTitle}>Начните копить</Text>
            <Text style={s.emptyDesc}>
              Создайте первую цель — например, «На отпуск» или «На новый телефон»
            </Text>
            <TouchableOpacity
              style={s.emptyBtn}
              onPress={() => { setEditGoal(null); goalSheetRef.current?.expand(); }}
            >
              <Text style={s.emptyBtnText}>Создать цель</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map(goal => {
            const pct = goal.target > 0 ? Math.min(goal.saved / goal.target, 1) : 0;
            const pctRound = Math.round(pct * 100);
            return (
              <View key={goal.id} style={s.goalCard}>
                {/* Goal header */}
                <View style={s.goalHeader}>
                  <View style={[s.goalIconBox, { backgroundColor: goal.color + '18' }]}>
                    {(() => { const Icon = GOAL_ICON_MAP[goal.icon] ?? GOAL_ICON_MAP['savings']; return <Icon size={26} weight="duotone" color={goal.color} />; })()}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.goalName}>{goal.name}</Text>
                    <Text style={s.goalSub}>
                      {fmt(goal.saved)} {CURRENCY} / {fmt(goal.target)} {CURRENCY}
                      {goal.deadline ? deadlineLabel(goal.deadline) : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => { setEditGoal(goal); goalSheetRef.current?.expand(); }}
                  >
                    <PencilSimple size={16} weight="duotone" color={C.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Progress bar */}
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${pctRound}%` as any, backgroundColor: goal.color }]} />
                </View>
                <Text style={s.pctTxt}>{pctRound}%</Text>

                {/* Actions */}
                <View style={s.actions}>
                  <TouchableOpacity
                    style={[s.btnFill, { backgroundColor: goal.color }]}
                    onPress={() => { setActiveGoal(goal); savingSheetRef.current?.expand(); }}
                  >
                    <Text style={s.btnFillTxt}>+ Пополнить</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.btnOutline}
                    onPress={() => { setActiveGoal(goal); withdrawSheetRef.current?.expand(); }}
                  >
                    <Text style={s.btnOutlineTxt}>− Снять</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <GoalSheet ref={goalSheetRef} editGoal={editGoal} onClose={() => setEditGoal(null)} />
      <SavingSheet ref={savingSheetRef} goal={activeGoal} onClose={() => setActiveGoal(null)} />
      <WithdrawSheet ref={withdrawSheetRef} goal={activeGoal} onClose={() => setActiveGoal(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },

  /* Header */
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 },
  subtitle: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: C.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase' },
  title:    { fontFamily: 'Outfit-Medium', fontSize: 32, color: C.text, letterSpacing: -0.5, marginTop: 2 },
  addBtn:   { width: 44, height: 44, borderRadius: 22, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: C.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  addBtnText: { fontSize: 26, color: C.white, lineHeight: 30 },

  /* Total card */
  totalCard:    { backgroundColor: C.green, borderRadius: 22, padding: 22, paddingBottom: 18, overflow: 'hidden', position: 'relative' },
  deco1:        { position: 'absolute', right: -20, top: '50%', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)' },
  deco2:        { position: 'absolute', right: 90,  top: -20,   width: 80,  height: 80,  borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)' },
  piggyDeco:    { position: 'absolute', right: 20, top: 0, bottom: 0, justifyContent: 'center' },
  totalLbl:     { fontFamily: 'Outfit-SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5, marginBottom: 6 },
  totalAmt:     { fontFamily: 'Outfit-Medium', fontSize: 40, color: C.white, letterSpacing: -1 },
  totalCur:     { fontSize: 24 },
  totalSub:     { fontFamily: 'Manrope-Regular', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, marginBottom: 12 },
  totalBarBg:   { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, height: 6 },
  totalBarFill: { backgroundColor: C.white, height: 6, borderRadius: 6 },

  /* Empty state */
  emptyBox:     { backgroundColor: C.white, borderRadius: 20, padding: 48, alignItems: 'center', borderWidth: 1.5, borderColor: C.borderLight },
  emptyEmoji:   { fontSize: 64, marginBottom: 12 },
  emptyTitle:   { fontFamily: 'Manrope-Bold', fontSize: 20, color: C.text, marginBottom: 8 },
  emptyDesc:    { fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  emptyBtn:     { backgroundColor: C.green, borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32, alignSelf: 'stretch', alignItems: 'center' },
  emptyBtnText: { fontFamily: 'Manrope-SemiBold', fontSize: 16, color: C.white },

  /* Goal card */
  goalCard:    { backgroundColor: C.white, borderRadius: 22, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12 },
  goalHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  goalIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  goalName:    { fontFamily: 'Outfit-Medium', fontSize: 16, color: C.text, letterSpacing: -0.2 },
  goalSub:     { fontFamily: 'Manrope-Regular', fontSize: 13, color: C.textSecondary, marginTop: 2 },
  editLink:    { fontSize: 20, color: C.textSecondary, padding: 4 },

  barBg:   { height: 8, backgroundColor: C.borderLight, borderRadius: 8, marginBottom: 6 },
  barFill: { height: 8, borderRadius: 8 },
  pctTxt:  { fontFamily: 'Manrope-Medium', fontSize: 12, color: C.textSecondary, marginBottom: 14 },

  actions:      { flexDirection: 'row', gap: 10 },
  btnFill:      { flex: 1, paddingVertical: 13, borderRadius: 50, alignItems: 'center' },
  btnFillTxt:   { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.white },
  btnOutline:   { flex: 1, paddingVertical: 13, borderRadius: 50, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white },
  btnOutlineTxt: { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.text },
});
