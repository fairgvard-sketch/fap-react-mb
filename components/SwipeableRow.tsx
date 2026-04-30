import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, runOnJS,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Trash } from 'phosphor-react-native';
import { C } from '../constants/colors';

const SNAP_X   = -82;
const DELETE_X = -240;

export default function SwipeableRow({ onDelete, children, style }: {
  onDelete: () => void;
  children: React.ReactNode;
  style?: object;
}) {
  const tx = useSharedValue(0);
  const isOpen = useSharedValue(false);

  function deleteWithHaptic() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      if (pos < DELETE_X || (!isOpen.value && vel < -900 && pos < SNAP_X)) {
        tx.value = withSpring(-420, { damping: 22, stiffness: 130 });
        runOnJS(deleteWithHaptic)();
        isOpen.value = false;
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
        <Animated.View style={[s.circle, iconAnim]}>
          <Trash size={22} weight="duotone" color="#fff" />
        </Animated.View>
      </View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ backgroundColor: C.white }, rowAnim]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const s = StyleSheet.create({
  back:   { alignItems: 'flex-end', justifyContent: 'center', paddingRight: 14, backgroundColor: C.white },
  circle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#f5b8a8', alignItems: 'center', justifyContent: 'center' },
});
