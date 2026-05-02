import React, { useRef } from "react";
import { Animated, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useSettings } from "../../contexts/SettingsContext";

export function PressScale({
  children,
  onPress,
  scale = 0.96,
  haptic = "selection",
  disabled,
  containerStyle,
  wrapperStyle,
  style,
  hitSlop,
  accessibilityLabel,
  fullWidth = true,
}) {
  const settings = useSettings();
  const animScale = useRef(new Animated.Value(1)).current;

  function handleIn() {
    Animated.spring(animScale, {
      toValue: scale,
      stiffness: 360,
      damping: 22,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }

  function handleOut() {
    Animated.spring(animScale, {
      toValue: 1,
      stiffness: 220,
      damping: 16,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }

  function handlePress(e) {
    if (Platform.OS !== "web" && haptic && settings?.uiHaptics !== false) {
      try {
        if (haptic === "selection") Haptics.selectionAsync().catch(() => {});
        else if (haptic === "light") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        else if (haptic === "medium") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        else if (haptic === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {
        /* never block press */
      }
    }
    onPress?.(e);
  }

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: animScale }],
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        containerStyle,
        wrapperStyle,
      ]}
    >
      <Pressable
        accessibilityLabel={accessibilityLabel}
        hitSlop={hitSlop}
        onPress={disabled ? undefined : handlePress}
        onPressIn={disabled ? undefined : handleIn}
        onPressOut={disabled ? undefined : handleOut}
        disabled={disabled}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
