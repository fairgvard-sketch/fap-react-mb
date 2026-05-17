import { View, StyleSheet, Modal, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, runOnJS,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash } from 'phosphor-react-native';
import { C } from '../constants/colors';

const SNAP_X   = -82;
const DELETE_X = -240;

export default function SwipeableRow({ onDelete, children, style }: {
  onDelete: () => void;
  children: React.ReactNode;
  style?: object;
}) {
  const { t } = useTranslation();
  const tx = useSharedValue(0);
  const isOpen = useSharedValue(false);
  const [confirming, setConfirming] = useState(false);

  function openConfirm() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfirming(true);
  }

  function handleCancel() {
    setConfirming(false);
    tx.value = withSpring(0, { damping: 22, stiffness: 280 });
    isOpen.value = false;
  }

  function handleConfirm() {
    setConfirming(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    tx.value = withSpring(-420, { damping: 22, stiffness: 130 });
    onDelete();
  }

  const gesture = Gesture.Pan()
    .activeOffsetX([-12, 1000])
    .failOffsetY([-18, 18])
    .onUpdate(e => {
      if (isOpen.value) {
        tx.value = Math.max(DELETE_X - 20, Math.min(0, SNAP_X + e.translationX));
      } else {
        tx.value = Math.max(-320, Math.min(0, e.translationX));
      }
    })
    .onEnd(e => {
      const vel = e.velocityX;
      const pos = tx.value;
      if (pos < DELETE_X || (vel < -700 && pos < SNAP_X)) {
        tx.value = withSpring(SNAP_X, { damping: 22, stiffness: 280 });
        isOpen.value = true;
        runOnJS(openConfirm)();
        return;
      }
      if (pos < SNAP_X / 2 || (vel < -400 && pos < -10)) {
        tx.value = withSpring(SNAP_X, { damping: 22, stiffness: 280 });
        isOpen.value = true;
        return;
      }
      tx.value = withSpring(0, { damping: 22, stiffness: 280 });
      isOpen.value = false;
    });

  const rowAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  const iconAnim = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [SNAP_X, -24, 0], [1, 0.25, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(tx.value, [SNAP_X, -20, 0], [1, 0.72, 0.55], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <View style={[StyleSheet.absoluteFillObject, s.back]}>
        <TouchableOpacity onPress={openConfirm} activeOpacity={0.8}>
          <Animated.View style={[s.circle, iconAnim]}>
            <Trash size={22} weight="duotone" color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ backgroundColor: C.white }, rowAnim]}>
          {children}
        </Animated.View>
      </GestureDetector>

      <Modal visible={confirming} transparent animationType="fade" onRequestClose={handleCancel}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.iconWrap}>
              <Trash size={28} weight="duotone" color="#E88D67" />
            </View>
            <Text style={s.title}>{t('delete.title')}</Text>
            <Text style={s.sub}>{t('delete.sub')}</Text>
            <TouchableOpacity style={s.btnDelete} onPress={handleConfirm} activeOpacity={0.8}>
              <Text style={s.btnDeleteTxt}>{t('delete.confirm')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnCancel} onPress={handleCancel} activeOpacity={0.7}>
              <Text style={s.btnCancelTxt}>{t('delete.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  back:   { alignItems: 'flex-end', justifyContent: 'center', paddingRight: 14, backgroundColor: C.white },
  circle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#f5b8a8', alignItems: 'center', justifyContent: 'center' },

  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, alignItems: 'center', gap: 6 },
  iconWrap:   { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fdf0ea', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title:      { fontFamily: 'Manrope-Bold', fontSize: 18, color: C.text },
  sub:        { fontFamily: 'Manrope-Regular', fontSize: 14, color: C.textSecondary, marginBottom: 12 },
  btnDelete:  { width: '100%', paddingVertical: 16, backgroundColor: '#E88D67', borderRadius: 18, alignItems: 'center' },
  btnDeleteTxt: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
  btnCancel:  { width: '100%', paddingVertical: 16, backgroundColor: C.bg, borderRadius: 18, alignItems: 'center', marginTop: 4 },
  btnCancelTxt: { fontFamily: 'Manrope-SemiBold', fontSize: 16, color: C.textSecondary },
});
