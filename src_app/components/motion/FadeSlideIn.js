import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export function FadeSlideIn({
  children,
  delay = 0,
  duration = 480,
  distance = 18,
  direction = "up",
  spring = true,
  scale = true,
  style,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(distance)).current;
  const scaleVal = useRef(new Animated.Value(scale ? 0.985 : 1)).current;

  useEffect(() => {
    const animations = [
      Animated.timing(opacity, {
        toValue: 1,
        duration: Math.max(220, duration * 0.8),
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      spring
        ? Animated.spring(offset, {
            toValue: 0,
            delay,
            stiffness: 170,
            damping: 22,
            mass: 0.85,
            useNativeDriver: true,
          })
        : Animated.timing(offset, {
            toValue: 0,
            duration,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
    ];
    if (scale) {
      animations.push(
        Animated.spring(scaleVal, {
          toValue: 1,
          delay,
          stiffness: 200,
          damping: 22,
          mass: 0.7,
          useNativeDriver: true,
        })
      );
    }
    Animated.parallel(animations).start();
  }, [opacity, offset, scaleVal, delay, duration, spring, scale]);

  const transform = [];
  if (direction === "up") transform.push({ translateY: offset });
  else if (direction === "down") transform.push({ translateY: Animated.multiply(offset, -1) });
  else if (direction === "left") transform.push({ translateX: offset });
  else transform.push({ translateX: Animated.multiply(offset, -1) });
  if (scale) transform.push({ scale: scaleVal });

  return <Animated.View style={[{ opacity, transform }, style]}>{children}</Animated.View>;
}

export function Stagger({ children, baseDelay = 0, step = 60, ...rest }) {
  const items = React.Children.toArray(children);
  return items.map((child, i) => (
    <FadeSlideIn key={child.key ?? i} delay={baseDelay + i * step} {...rest}>
      {child}
    </FadeSlideIn>
  ));
}
