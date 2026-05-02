import React, { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { Text } from "./Text";
import { PressScale } from "./motion/PressScale";

const TABS = [
  { id: "home", label: "Главная", icon: "home-variant-outline", iconActive: "home-variant" },
  { id: "qibla", label: "Кибла", icon: "compass-outline", iconActive: "compass" },
  { id: "quran", label: "Коран", icon: "book-open-page-variant-outline", iconActive: "book-open-page-variant" },
  { id: "tasbih", label: "Тасбих", icon: "star-four-points-outline", iconActive: "star-four-points" },
  { id: "profile", label: "Профиль", icon: "account-outline", iconActive: "account" },
];

export function BottomTabs({ active, onChange }) {
  const { colors, spacing, radius } = useTheme();
  const [width, setWidth] = useState(0);
  const tabCount = TABS.length;
  const anim = useRef(new Animated.Value(TABS.findIndex((tab) => tab.id === active))).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: TABS.findIndex((tab) => tab.id === active),
      stiffness: 260,
      damping: 24,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [active, anim]);

  const itemWidth = width > 0 ? width / tabCount : 0;
  const highlightTranslate = itemWidth
    ? anim.interpolate({
        inputRange: TABS.map((_, index) => index),
        outputRange: TABS.map((_, index) => index * itemWidth),
      })
    : 0;

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        position: "absolute",
        left: spacing.md,
        right: spacing.md,
        bottom: spacing.md,
        backgroundColor: colors.cardStrong,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.line,
        paddingHorizontal: 6,
        paddingVertical: 6,
        flexDirection: "row",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 14 },
        elevation: 12,
      }}
    >
      {itemWidth ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            width: itemWidth - 12,
            bottom: 6,
            borderRadius: radius.lg,
            backgroundColor: colors.activeGradient[0],
            borderWidth: 1,
            borderColor: colors.line,
            transform: [{ translateX: highlightTranslate }],
          }}
        />
      ) : null}
      {TABS.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          active={tab.id === active}
          onPress={() => onChange(tab.id)}
        />
      ))}
    </View>
  );
}

function TabButton({ tab, active, onPress }) {
  const { colors, radius } = useTheme();
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: active ? 1 : 0,
      stiffness: 260,
      damping: 22,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [active, anim]);

  const bubbleOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const bubbleScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
  const lift = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const labelOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });

  return (
    <PressScale
      onPress={onPress}
      scale={0.97}
      haptic="selection"
      wrapperStyle={{ flex: 1 }}
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: radius.lg,
        overflow: "hidden",
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          borderRadius: radius.lg,
          backgroundColor: colors.card,
          opacity: bubbleOpacity,
          transform: [{ scale: bubbleScale }],
        }}
      />
      <Animated.View style={{ alignItems: "center", transform: [{ translateY: lift }] }}>
        <MaterialCommunityIcons
          name={active ? tab.iconActive : tab.icon}
          size={22}
          color={active ? colors.gold : colors.muted}
        />
        <Animated.View style={{ opacity: labelOpacity }}>
          <Text
            variant="caption"
            color={active ? "text" : "muted"}
            style={{ marginTop: 4, letterSpacing: 0.4 }}
            weight={active ? "600" : "500"}
          >
            {tab.label}
          </Text>
        </Animated.View>
      </Animated.View>
    </PressScale>
  );
}
