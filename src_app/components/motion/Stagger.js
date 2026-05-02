import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export function StaggerItem({ index = 0, baseDelay = 30, duration = 380, distance = 16, children, style }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const delay = baseDelay * index;
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, delay, stiffness: 180, damping: 22, mass: 0.7, useNativeDriver: true }),
    ]).start();
  }, [fade, slide, index, baseDelay, duration]);

  return (
    <Animated.View style={[{ opacity: fade, transform: [{ translateY: slide }] }, style]}>
      {children}
    </Animated.View>
  );
}
