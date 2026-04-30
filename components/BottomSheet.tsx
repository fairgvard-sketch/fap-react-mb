import { forwardRef, useImperativeHandle, useState, ReactNode } from 'react';
import { Modal, View, ScrollView, TouchableWithoutFeedback, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, Easing } from 'react-native-reanimated';

export interface BottomSheetHandle {
  expand(): void;
  close(): void;
  snapToIndex(index: number): void;
}

interface BottomSheetProps {
  children?: ReactNode;
  index?: number;
  snapPoints?: (string | number)[];
  enablePanDownToClose?: boolean;
  handleIndicatorStyle?: object;
  backgroundStyle?: object;
}

const OFFSCREEN = 900;

const easeOut = Easing.out(Easing.cubic);
const easeIn  = Easing.in(Easing.cubic);

const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(({
  children, backgroundStyle, handleIndicatorStyle, enablePanDownToClose = true,
}, ref) => {
  const [visible, setVisible] = useState(false);
  const translateY = useSharedValue(OFFSCREEN);

  function doOpen() {
    translateY.value = OFFSCREEN;
    setVisible(true);
    // onShow springs the sheet in after the modal is mounted
  }

  function doClose() {
    translateY.value = withTiming(OFFSCREEN, { duration: 300, easing: easeIn }, (finished) => {
      if (finished) runOnJS(setVisible)(false);
    });
  }

  useImperativeHandle(ref, () => ({
    expand: doOpen,
    close: doClose,
    snapToIndex: (i) => { if (i >= 0) doOpen(); else doClose(); },
  }));

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd(e => {
      if (!enablePanDownToClose) {
        translateY.value = withTiming(0, { duration: 220, easing: easeOut });
        return;
      }
      if (e.translationY > 80 || e.velocityY > 1000) {
        const remaining = OFFSCREEN - e.translationY;
        const ms = Math.max(100, Math.min(250, remaining / Math.max(e.velocityY, 1) * 1000));
        translateY.value = withTiming(OFFSCREEN, { duration: ms, easing: easeIn }, (finished) => {
          if (finished) runOnJS(setVisible)(false);
        });
      } else {
        translateY.value = withTiming(0, { duration: 220, easing: easeOut });
      }
    });

  const sheetAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onShow={() => {
        translateY.value = withTiming(0, { duration: 340, easing: easeOut });
      }}
      onRequestClose={() => enablePanDownToClose && doClose()}
    >
      <GestureHandlerRootView style={styles.flex}>
        <View style={styles.overlay} pointerEvents="none" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <TouchableWithoutFeedback onPress={() => enablePanDownToClose && doClose()}>
            <View style={styles.flex} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.sheet, backgroundStyle, sheetAnim]}>
            <GestureDetector gesture={panGesture}>
              <View style={styles.dragArea}>
                <View style={[styles.handle, handleIndicatorStyle]} />
              </View>
            </GestureDetector>
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
});

BottomSheet.displayName = 'BottomSheet';
export default BottomSheet;

export function BottomSheetView({ children, style }: { children?: ReactNode; style?: object }) {
  return <View style={style}>{children}</View>;
}

export function BottomSheetScrollView({
  children, contentContainerStyle, keyboardShouldPersistTaps,
}: {
  children?: ReactNode;
  contentContainerStyle?: object;
  keyboardShouldPersistTaps?: 'handled' | 'always' | 'never';
}) {
  return (
    <ScrollView contentContainerStyle={contentContainerStyle} keyboardShouldPersistTaps={keyboardShouldPersistTaps}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    paddingBottom: 34,
    maxHeight: '92%',
  },
  dragArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E5',
    borderRadius: 2,
  },
});
