import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { Text } from "../components/Text";

export function SplashScreen() {
  const { colors } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, stiffness: 130, damping: 18, mass: 0.9, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, stiffness: 150, damping: 20, mass: 0.85, useNativeDriver: true }),
      Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(halo, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(halo, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, [fade, scale, spin, halo, rise]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
      <LinearGradient
        colors={colors.bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 360, height: 360, borderRadius: 999,
          backgroundColor: colors.gold,
          opacity: haloOpacity,
          transform: [{ scale: haloScale }],
          shadowColor: colors.gold,
          shadowOpacity: 0.45,
          shadowRadius: 60,
        }}
      />

      <Animated.View style={{ opacity: fade, alignItems: "center", transform: [{ scale }, { translateY: rise }] }}>
        <Animated.View style={{ transform: [{ rotate }], marginBottom: 28 }}>
          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: colors.gold,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.gold, shadowOpacity: 0.3, shadowRadius: 18,
            }}
          >
            <MaterialCommunityIcons name="star-crescent" size={48} color={colors.gold} />
          </View>
        </Animated.View>
        <Text variant="display" color="text" weight="700" style={{ letterSpacing: -1.6 }}>
          NOOR ATLAS
        </Text>
        <Text variant="caption" color="muted" weight="500" style={{ marginTop: 14, letterSpacing: 3.6, textTransform: "uppercase" }}>
          молитвенный · спутник
        </Text>
      </Animated.View>
    </View>
  );
}
