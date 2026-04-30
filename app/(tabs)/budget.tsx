import { ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { C } from '../../constants/colors';
import { EXPENSE_CATS, CATEGORY_META } from '../../constants/categories';
import CategoryIcon from '../../components/CategoryIcon';
import { Target, Trash, Plus, X } from 'phosphor-react-native';
import { fmt, CURRENCY } from '../../utils/format';

export default function BudgetScreen() {
  const { txs, budgets, setBudget, deleteBudget } = useStore();
  const [addOpen, setAddOpen]   = useState(false);
  const [selCat, setSelCat]     = useState(EXPENSE_CATS[0]);
  const [limitVal, setLimitVal] = useState('');

  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const spent = useMemo(() => {
    const map: Record<string, number> = {};
    txs.filter(t => t.type === 'expense' && t.date.startsWith(monthStr))
       .forEach(t => { map[t.cat] = (map[t.cat] ?? 0) + t.amount; });
    return map;
  }, [txs, monthStr]);

  const budgetList = Object.entries(budgets).filter(([, v]) => v > 0);

  function handleSave() {
    const v = parseFloat(limitVal);
    if (!isNaN(v) && v > 0) setBudget(selCat, v);
    setAddOpen(false);
    setLimitVal('');
  }

  function pickCat(cat: string) {
    setSelCat(cat);
    setLimitVal(budgets[cat] ? String(budgets[cat]) : '');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageHint}>ЦЕЛИ</Text>
            <Text style={styles.pageTitle}>Бюджеты</Text>
            <Text style={styles.pageDesc}>Месячные лимиты по категориям</Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, addOpen && styles.addBtnClose]}
            onPress={() => { setAddOpen(v => !v); setLimitVal(''); setSelCat(EXPENSE_CATS[0]); }}
          >
            {addOpen
              ? <X size={20} weight="bold" color="#fff" />
              : <Plus size={20} weight="bold" color="#fff" />
            }
          </TouchableOpacity>
        </View>

        {/* Add form */}
        {addOpen && (
          <View style={styles.addForm}>
            <Text style={styles.lbl}>Категория</Text>
            <View style={styles.chips}>
              {EXPENSE_CATS.map(c => {
                const color = CATEGORY_META[c]?.color ?? '#888';
                const active = selCat === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, active && { backgroundColor: color + '28', borderColor: color }]}
                    onPress={() => pickCat(c)}
                  >
                    <Text style={[styles.chipText, active && { color }]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.lbl}>Месячный лимит, {CURRENCY}</Text>
            <TextInput
              style={styles.limitInput}
              value={limitVal}
              onChangeText={setLimitVal}
              keyboardType="numeric"
              placeholder="5000"
              placeholderTextColor={C.textSecondary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Budget cards */}
        {budgetList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Target size={52} weight="duotone" color={C.green} />
            <Text style={styles.emptyTitle}>Установите цель</Text>
            <Text style={styles.emptyDesc}>Добавьте первый бюджет — и следите за лимитами</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => { setAddOpen(true); setLimitVal(''); setSelCat(EXPENSE_CATS[0]); }}
            >
              <Text style={styles.emptyBtnText}>Добавить бюджет</Text>
            </TouchableOpacity>
          </View>
        ) : (
          budgetList.map(([cat, lim]) => {
            const meta = CATEGORY_META[cat];
            const spentAmt = spent[cat] ?? 0;
            const pct = lim > 0 ? Math.min(1, spentAmt / lim) : 0;
            const over = spentAmt > lim;
            const barColor = over ? '#e05a5a' : (meta?.color ?? C.green);
            return (
              <View key={cat} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <CategoryIcon cat={cat} size={22} boxSize={48} radius={14} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{cat}</Text>
                    <Text style={[styles.catSub, over && { color: '#e05a5a' }]}>
                      {CURRENCY} {fmt(spentAmt)} из {CURRENCY} {fmt(lim)}{over ? ' · Превышен!' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.pctText, over && { color: '#e05a5a' }]}>{Math.round(pct * 100)}%</Text>
                  <TouchableOpacity style={styles.delBtn} onPress={() => deleteBudget(cat)}>
                    <Trash size={18} weight="duotone" color="#e05a5a" />
                  </TouchableOpacity>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: barColor }]} />
                </View>
              </View>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 24 },

  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 2 },
  pageHint: { fontFamily: 'Outfit-SemiBold', fontSize: 11, color: C.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase' },
  pageTitle: { fontFamily: 'Outfit-Medium', fontSize: 28, color: C.text, letterSpacing: -0.5, marginTop: 2 },
  pageDesc: { fontFamily: 'Manrope-Regular', fontSize: 13, color: C.textSecondary, marginTop: 3 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.green,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
    shadowColor: C.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  addBtnClose: { backgroundColor: '#e05a5a' },
  addBtnText: { color: C.white, fontSize: 22, lineHeight: 26 },

  addForm: { backgroundColor: C.white, borderRadius: 20, padding: 20, gap: 4 },
  lbl: { fontFamily: 'Manrope-SemiBold', fontSize: 11, color: C.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 50, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white },
  chipText: { fontFamily: 'Manrope-Medium', fontSize: 13, color: C.text },
  limitInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 16,
    fontFamily: 'Manrope-Regular', fontSize: 18, color: C.text,
    backgroundColor: C.white, marginBottom: 4,
  },
  saveBtn: { backgroundColor: C.green, borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { fontFamily: 'Manrope-SemiBold', fontSize: 15, color: C.white },

  emptyBox:     { backgroundColor: C.white, borderRadius: 20, padding: 48, alignItems: 'center', borderWidth: 1.5, borderColor: C.borderLight },
  emptyTitle:   { fontFamily: 'Manrope-Bold', fontSize: 20, color: C.text, marginBottom: 8, marginTop: 12 },
  emptyDesc:    { fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  emptyBtn:     { backgroundColor: C.green, borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32, alignSelf: 'stretch', alignItems: 'center' },
  emptyBtnText: { fontFamily: 'Manrope-SemiBold', fontSize: 16, color: C.white },

  budgetCard: { backgroundColor: C.white, borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: C.borderLight, gap: 10 },
  budgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  catName: { fontFamily: 'Outfit-Medium', fontSize: 16, color: C.text },
  catSub: { fontFamily: 'Manrope-Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 },
  pctText: { fontFamily: 'Manrope-Bold', fontSize: 15, color: C.textSecondary, marginRight: 8 },
  delBtn: { padding: 4 },
  progressBg: { height: 8, backgroundColor: C.borderLight, borderRadius: 8 },
  progressFill: { height: 8, borderRadius: 8 },
});
