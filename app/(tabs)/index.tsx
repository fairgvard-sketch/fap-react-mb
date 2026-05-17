import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type BottomSheetHandle } from '../../components/BottomSheet';
import { useStore, useCurrency, type AutoRule } from '../../store/useStore';
import { C } from '../../constants/colors';
import { fmt } from '../../utils/format';
import { CATEGORY_META, CAT_KEY, tCat } from '../../constants/categories';
import { SVCS } from '../../constants/services';
import { CustomIcon } from '../../components/BrandIcons';
import { auth } from '../../utils/firebase';
import { PencilSimple, ArrowsClockwise, Lock, Plus, Leaf, Scales, ForkKnife, UsersFour, GearSix } from 'phosphor-react-native';
import CategoryIcon from '../../components/CategoryIcon';
import WalletSvg from '../../components/WalletSvg';
import SwipeableRow from '../../components/SwipeableRow';
import AddSubscriptionSheet from '../../components/sheets/AddSubscriptionSheet';
import AddAutoRuleSheet from '../../components/sheets/AddAutoRuleSheet';
import OverviewSheet, { type OverviewSheetHandle } from '../../components/sheets/OverviewSheet';
import IncomeDetailSheet from '../../components/sheets/IncomeDetailSheet';
import PartnerSheet, { type PartnerSheetHandle } from '../../components/sheets/PartnerSheet';
import SettingsSheet, { type SettingsSheetHandle } from '../../components/sheets/SettingsSheet';

export default function HomeScreen() {
  const { t } = useTranslation();
  const monthsGen = t('common.monthsGen').split(',');
  const fmtDateLocale = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return `${d.getDate()} ${monthsGen[d.getMonth()]}`;
  };
  const { txs, subs, autoRules, deleteTx, user, checkAutoRules, partnerUid, partnerSummary } = useStore();
  const currency = useCurrency();
  const subSheetRef      = useRef<BottomSheetHandle>(null);
  const autoRuleSheetRef = useRef<BottomSheetHandle>(null);
  const overviewRef      = useRef<OverviewSheetHandle>(null);
  const partnerSheetRef  = useRef<PartnerSheetHandle>(null);
  const settingsSheetRef = useRef<SettingsSheetHandle>(null);
  const editSubRef       = useRef<any>(null);
  const editRuleRef      = useRef<AutoRule | null>(null);
  const [, forceUpdate]      = useState(0);
  const [incomeDetailCat, setIncomeDetailCat] = useState<string | null>(null);

  useEffect(() => { checkAutoRules(); }, []);

  const now      = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const yearStr  = String(now.getFullYear());

  const allIncome  = useMemo(() => txs.filter(t => t.type === 'income' ).reduce((s, t) => s + t.amount, 0), [txs]);
  const allExpense = useMemo(() => txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [txs]);
  const balance    = allIncome - allExpense;

  const recent = useMemo(() => [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [txs]);

  const incomeBreakdown = useMemo(() => {
    return ['Зарплата', 'Чаевые'].map(cat => ({
      cat,
      month: txs.filter(t => t.type === 'income' && t.cat === cat && t.date.startsWith(monthStr)).reduce((s, t) => s + t.amount, 0),
      year:  txs.filter(t => t.type === 'income' && t.cat === cat && t.date.startsWith(yearStr )).reduce((s, t) => s + t.amount, 0),
    }));
  }, [txs, monthStr, yearStr]);

  const userName = user?.displayName?.split(' ')[0] ?? '';

  const pExpDiff = partnerSummary
    ? Math.round((1 - allExpense / (partnerSummary.expense || 1)) * 100)
    : null;
  const pIncDiff = partnerSummary
    ? Math.round(Math.abs(allIncome - partnerSummary.income) / (partnerSummary.income || 1) * 100)
    : null;

  const COMPARE_ROWS = partnerSummary ? [
    {
      Icon: Leaf, iconColor: '#3d8b6b', bg: '#f0f5f0',
      title: pExpDiff !== null
        ? t(pExpDiff >= 0 ? 'home.spendLess' : 'home.spendMore', { pct: Math.abs(pExpDiff) })
        : t('home.noExpenseData'),
      sub: t('home.comparedToPartner'),
    },
    {
      Icon: Scales, iconColor: '#8B7355', bg: '#f5f3ee',
      title: pIncDiff !== null && pIncDiff <= 10
        ? t('home.incomeEqual')
        : pIncDiff !== null
          ? t('home.incomeDiff', { pct: pIncDiff })
          : t('home.noIncomeData'),
      sub: t('home.allTime'),
    },
    {
      Icon: ForkKnife, iconColor: '#E88D67', bg: '#fff0eb',
      title: partnerSummary.topCat
        ? t('home.partnerSpends', { cat: tCat(partnerSummary.topCat, t) })
        : t('home.noTopCat'),
      sub: t('home.partnerTopCat'),
    },
  ] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.appIcon}>
              <WalletSvg size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.appTitleBlack} numberOfLines={1} adjustsFontSizeToFit>{t('home.title1')}</Text>
              <Text style={styles.appTitleGreen} numberOfLines={1} adjustsFontSizeToFit>{t('home.title2')}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {user?.photoURL
              ? <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              : null
            }
            {user?.photoURL ? <Text style={styles.headerName}>{userName}</Text> : null}
            <TouchableOpacity onPress={() => settingsSheetRef.current?.expand()} style={styles.settingsBtn} activeOpacity={0.75}>
              <GearSix size={18} weight="duotone" color={C.green} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card — opens Overview */}
        <TouchableOpacity style={styles.balanceCard} onPress={() => overviewRef.current?.open()} activeOpacity={0.88}>
          <View style={[styles.circle, { width: 160, height: 160, right: -40, top: -40 }]} />
          <View style={[styles.circle, { width: 90,  height: 90,  right: 60,  top: -20 }]} />
          <View style={[styles.circle, { width: 120, height: 120, right: -10, bottom: -30 }]} />
          <View style={[styles.circle, { width: 70,  height: 70,  right: 110, bottom: -10 }]} />
          <View style={[styles.circle, { width: 80,  height: 80,  left: -20,  bottom: -20 }]} />
          <Text style={styles.balanceLbl}>{t('home.balance')}</Text>
          <Text style={styles.balanceAmt}>{currency} {fmt(balance)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceSubCard}>
              <Text style={styles.balanceSubLbl}>{t('home.allIncome')}</Text>
              <Text style={styles.balanceSubAmt}>{currency} {fmt(allIncome)}</Text>
            </View>
            <View style={styles.balanceSubCard}>
              <Text style={styles.balanceSubLbl}>{t('home.allExpense')}</Text>
              <Text style={styles.balanceSubAmt}>{currency} {fmt(allExpense)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Subscriptions */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.subscriptions')}</Text>
            <TouchableOpacity style={styles.addRoundBtn} onPress={() => { editSubRef.current = null; subSheetRef.current?.expand(); }}>
              <Plus size={20} weight="bold" color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subsScroll}>
            {subs.map(sub => {
              const svc = SVCS.find(s => s.n === sub.svc);
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={styles.subCard}
                  onPress={() => { editSubRef.current = sub; subSheetRef.current?.expand(); }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.subCardIcon, { backgroundColor: svc?.bg ?? C.green }]}>
                    {svc ? <svc.Icon size={28} /> : <CustomIcon size={28} />}
                  </View>
                  <Text style={styles.subCardName}>{sub.name}</Text>
                  <Text style={styles.subCardDay}>{sub.day} {t('common.monthsShort').split(',')[now.getMonth()]}</Text>
                  <Text style={styles.subCardAmt}>
                    {fmt(sub.amount)} {currency}<Text style={styles.subCardAmtSub}> {t('sub.perMonth')}</Text>
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.subAddCard}
              onPress={() => { editSubRef.current = null; subSheetRef.current?.expand(); }}
              activeOpacity={0.7}
            >
              <Text style={styles.subAddPlus}>+</Text>
              <Text style={styles.subAddText}>{t('home.add')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Auto-payments */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.autoPayments')}</Text>
            <TouchableOpacity style={styles.addRoundBtn} onPress={() => { editRuleRef.current = null; autoRuleSheetRef.current?.expand(); }}>
              <Plus size={20} weight="bold" color="#fff" />
            </TouchableOpacity>
          </View>
          {autoRules.length === 0 ? (
            <TouchableOpacity style={styles.emptyDashed} onPress={() => { editRuleRef.current = null; autoRuleSheetRef.current?.expand(); }} activeOpacity={0.7}>
              <View style={styles.emptyDashedIcon}><ArrowsClockwise size={24} weight="duotone" color={C.green} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyDashedTitle}>{t('home.addAutoPayment')}</Text>
                <Text style={styles.emptyDashedSub}>{t('home.autoPaymentDesc')}</Text>
              </View>
              <Text style={styles.emptyDashedPlus}>+</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 10 }}>
              {autoRules.map(rule => {
                const todayDay = now.getDate();
                const fired    = txs.some(tx => tx.autoRuleId === rule.id && tx.date.startsWith(monthStr));
                const due      = todayDay >= rule.day;
                const ruleSub  = rule.type === 'subscription' ? subs.find(s => s.id === rule.subId) : null;
                const svc      = ruleSub ? SVCS.find(s => s.n === ruleSub.svc) : null;
                let badgeText  = t('autoRule.day', { day: rule.day });
                let badgeBg    = '#f2f2f7';
                let badgeColor = '#555';
                if (!rule.active) { badgeText = t('autoRule.off');     badgeBg = '#f2f2f7'; badgeColor = C.textSecondary; }
                else if (fired)   { badgeText = t('autoRule.charged'); badgeBg = '#e8f8ef'; badgeColor = '#1b7a47'; }
                else if (due)     { badgeText = t('autoRule.today');   badgeBg = '#fff8e8'; badgeColor = '#c8960a'; }
                return (
                  <View key={rule.id} style={styles.ruleCard}>
                    {rule.type === 'subscription'
                      ? <View style={[styles.ruleIcon, { backgroundColor: svc?.bg ?? rule.bg ?? C.borderLight }]}>{svc ? <svc.Icon size={20} /> : <CustomIcon size={20} />}</View>
                      : <CategoryIcon cat={rule.cat} size={20} boxSize={42} radius={12} />
                    }
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ruleName}>{rule.name}</Text>
                      <View style={styles.ruleBadgeRow}>
                        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={styles.ruleAmt}>−{currency} {fmt(rule.amount)}</Text>
                      <TouchableOpacity
                        style={styles.editRuleBtn}
                        onPress={() => { editRuleRef.current = rule; forceUpdate(n => n + 1); autoRuleSheetRef.current?.expand(); }}
                      >
                        <PencilSimple size={13} weight="duotone" color={C.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Wallet comparison */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.walletCompare')}</Text>
            <TouchableOpacity onPress={() => partnerSheetRef.current?.expand()} activeOpacity={0.7}>
              <Text style={styles.sectionHint}>{partnerUid ? t('home.connected') : t('home.connect')}</Text>
            </TouchableOpacity>
          </View>
          {COMPARE_ROWS ? (
            <View style={styles.card}>
              {COMPARE_ROWS.map((row, i) => (
                <View key={i} style={[styles.compareRow, i === COMPARE_ROWS.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.compareIcon, { backgroundColor: row.bg }]}>
                    <row.Icon size={20} weight="duotone" color={row.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compareTitle}>{row.title}</Text>
                    <Text style={styles.compareSub}>{row.sub}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.compareLock}>
                <Lock size={14} weight="duotone" color={C.textSecondary} />
                <Text style={styles.compareLockTxt}>{t('home.privacyNote')}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.partnerEmptyCard} onPress={() => partnerSheetRef.current?.expand()} activeOpacity={0.8}>
              <View style={styles.partnerEmptyIcon}>
                <UsersFour size={28} weight="duotone" color={C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.partnerEmptyTitle}>{t('home.connectPartner')}</Text>
                <Text style={styles.partnerEmptySub}>{t('home.connectPartnerSub')}</Text>
              </View>
              <Text style={{ fontSize: 18, color: C.textSecondary }}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Income breakdown */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.income')}</Text>
            <Text style={styles.sectionHint}>{t('home.yearLabel', { year: now.getFullYear() })}</Text>
          </View>
          <View style={styles.incomeRow}>
            {incomeBreakdown.map(({ cat, month, year }) => {
              const meta = CATEGORY_META[cat];
              return (
                <TouchableOpacity key={cat} style={styles.incomeCard} onPress={() => setIncomeDetailCat(cat)} activeOpacity={0.82}>
                  <View style={[styles.incomeCircle, { backgroundColor: meta?.color ?? C.green }]} />
                  <View style={styles.incomeCardHeader}>
                    <CategoryIcon cat={cat} size={18} boxSize={32} radius={12} />
                    <Text style={styles.incomeCat}>{tCat(cat, t)}</Text>
                  </View>
                  <Text style={styles.incomeSubLbl}>{t('home.thisMonth')}</Text>
                  <Text style={styles.incomeAmt}>+{fmt(month)} <Text style={styles.incomeAmtSub}>{currency}</Text></Text>
                  <View style={styles.incomeDivider} />
                  <Text style={styles.incomeSubLbl}>{t('home.thisYear')}</Text>
                  <Text style={styles.incomeYearAmt}>{fmt(year)} {currency}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recent transactions */}
        <View>
          <Text style={styles.sectionTitle}>{t('home.recentTxs')}</Text>
          <View style={styles.txCard}>
            {recent.length === 0 ? (
              <Text style={styles.empty}>{t('home.noTxs')}</Text>
            ) : (
              recent.map((tx) => (
                <SwipeableRow key={tx.id} onDelete={() => deleteTx(tx.id)}>
                  <View style={styles.txRow}>
                    <CategoryIcon cat={tx.cat} size={20} boxSize={44} radius={12} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txNote} numberOfLines={1}>{(tx.note && !CAT_KEY[tx.note]) ? tx.note : tCat(tx.cat, t)}</Text>
                      <Text style={styles.txMeta}>{tCat(tx.cat, t)} · {fmtDateLocale(tx.date)}</Text>
                    </View>
                    <Text style={[styles.txAmt, { color: tx.type === 'income' ? '#1a4a35' : '#E88D67' }]}>
                      {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)} {currency}
                    </Text>
                  </View>
                </SwipeableRow>
              ))
            )}
          </View>
        </View>

      </ScrollView>

      <AddSubscriptionSheet ref={subSheetRef} editSub={editSubRef.current} onClose={() => { editSubRef.current = null; }} />
      <AddAutoRuleSheet ref={autoRuleSheetRef} editRule={editRuleRef.current} onClose={() => { editRuleRef.current = null; }} />
      <OverviewSheet ref={overviewRef} />
      <IncomeDetailSheet cat={incomeDetailCat} txs={txs} onClose={() => setIncomeDetailCat(null)} />
      <PartnerSheet ref={partnerSheetRef} />
      <SettingsSheet ref={settingsSheetRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 24 },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appIcon:      { width: 52, height: 52, borderRadius: 16, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  appTitleBlack: { fontFamily: 'Unbounded-Bold', fontSize: 22, color: C.text,  letterSpacing: -0.8, lineHeight: 25 },
  appTitleGreen: { fontFamily: 'Unbounded-Bold', fontSize: 22, color: C.green, letterSpacing: -0.8, lineHeight: 25 },
  avatar:       { width: 36, height: 36, borderRadius: 18, backgroundColor: C.borderLight },
  headerName:   { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.text },
  settingsBtn:  { width: 42, height: 42, borderRadius: 21, backgroundColor: '#e8f5ee', alignItems: 'center', justifyContent: 'center' },

  // Balance card
  balanceCard: {
    backgroundColor: C.green,
    borderRadius: 26,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  balanceLbl:    { fontFamily: 'Outfit-SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  balanceAmt:    { fontFamily: 'Outfit-Medium', fontSize: 42, color: C.white, letterSpacing: -1, marginBottom: 16 },
  balanceRow:    { flexDirection: 'row', gap: 10 },
  balanceSubCard:{ flex: 1, backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: 14, padding: 12 },
  balanceSubLbl: { fontFamily: 'Outfit-SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  balanceSubAmt: { fontFamily: 'Outfit-Medium', fontSize: 18, color: C.white },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontFamily: 'Outfit-Medium', fontSize: 22, color: C.text, letterSpacing: -0.3, flex: 1 },
  sectionHint:   { fontFamily: 'Manrope-Medium', fontSize: 13, color: C.textSecondary },
  addRoundBtn:   {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.green,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },

  // Empty dashed state
  emptyDashed: {
    borderWidth: 2, borderColor: '#c8e6d4', borderStyle: 'dashed',
    borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.white,
  },
  emptyDashedIcon:  { width: 48, height: 48, borderRadius: 14, backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },
  emptyDashedTitle: { fontFamily: 'Manrope-SemiBold', fontSize: 15, color: C.text },
  emptyDashedSub:   { fontFamily: 'Manrope-Regular', fontSize: 12, color: C.textSecondary, marginTop: 3, lineHeight: 17 },
  emptyDashedPlus:  { fontSize: 22, color: C.textSecondary },

  // Subscriptions
  subsScroll:    { gap: 10, paddingBottom: 4, paddingRight: 16 },
  subCard:       { width: 170, backgroundColor: C.white, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#EFECE6' },
  subCardIcon:   { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  subCardName:   { fontFamily: 'Manrope-Bold', fontSize: 13, color: C.text },
  subCardDay:    { fontFamily: 'Manrope-Regular', fontSize: 11, color: C.navInactive, marginTop: 2 },
  subCardAmt:    { fontFamily: 'Outfit-Medium', fontSize: 15, color: C.green, marginTop: 8 },
  subCardAmtSub: { fontFamily: 'Manrope-Regular', fontSize: 11, color: C.navInactive },
  subAddCard:    { width: 150, minHeight: 160, borderRadius: 24, borderWidth: 1.5, borderColor: '#EFECE6', borderStyle: 'dashed', backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', gap: 8 },
  subAddPlus:    { fontSize: 32, color: C.textSecondary, lineHeight: 38 },
  subAddText:    { fontFamily: 'Manrope-Regular', fontSize: 13, color: C.textSecondary },

  // Auto-rule cards
  ruleCard:     { backgroundColor: C.white, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: C.borderLight },
  ruleIcon:     { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ruleName:     { fontFamily: 'Manrope-Bold', fontSize: 14, color: C.text },
  ruleBadgeRow: { flexDirection: 'row', marginTop: 4 },
  badge:        { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  badgeText:    { fontFamily: 'Manrope-SemiBold', fontSize: 10 },
  ruleAmt:      { fontFamily: 'Outfit-Medium', fontSize: 15, color: '#E88D67' },
  editRuleBtn:  { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },

  // Wallet comparison
  card: { backgroundColor: C.white, borderRadius: 22, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12 },
  compareRow:   { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  compareIcon:  { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  compareTitle: { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: C.text },
  compareSub:   { fontFamily: 'Manrope-Regular', fontSize: 12, color: C.textSecondary, marginTop: 1 },
  compareLock:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.borderLight },
  compareLockTxt: { fontFamily: 'Manrope-Regular', fontSize: 12, color: C.textSecondary, flex: 1, lineHeight: 17 },

  // Income
  incomeRow:       { flexDirection: 'row', gap: 12 },
  incomeCard:      { flex: 1, backgroundColor: C.white, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#EFECE6', overflow: 'hidden', position: 'relative' },
  incomeCircle:    { position: 'absolute', width: 70, height: 70, borderRadius: 35, opacity: 0.1, right: -20, top: -20 },
  incomeCardHeader:{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  incomeCat:       { fontFamily: 'Manrope-Bold', fontSize: 15, color: C.text, flex: 1 },

  incomeSubLbl:    { fontFamily: 'Outfit-SemiBold', fontSize: 10, color: C.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  incomeAmt:       { fontFamily: 'Outfit-Medium', fontSize: 24, color: C.green, marginTop: 4, letterSpacing: -0.5 },
  incomeAmtSub:    { fontSize: 16 },
  incomeDivider:   { height: 1, backgroundColor: C.borderLight, marginVertical: 12 },
  incomeYearAmt:   { fontFamily: 'Outfit-Medium', fontSize: 17, color: C.text, marginTop: 4 },

  // Partner empty state
  partnerEmptyCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 20, padding: 16, gap: 14 },
  partnerEmptyIcon:  { width: 52, height: 52, borderRadius: 16, backgroundColor: C.green + '18', alignItems: 'center', justifyContent: 'center' },
  partnerEmptyTitle: { fontFamily: 'Manrope-SemiBold', fontSize: 15, color: C.text },
  partnerEmptySub:   { fontFamily: 'Manrope-Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 },

  // Recent transactions
  empty:       { fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center', paddingVertical: 24 },
  txCard:      { backgroundColor: C.white, borderRadius: 20, overflow: 'hidden' },
  txSeparator: { borderBottomWidth: 1, borderBottomColor: C.borderLight },
  txRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: C.white },
  txNote:      { fontFamily: 'Manrope-SemiBold', fontSize: 15, color: C.text },
  txMeta:      { fontFamily: 'Manrope-Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 },
  txAmt:       { fontFamily: 'Outfit-Medium', fontSize: 15 },
});
