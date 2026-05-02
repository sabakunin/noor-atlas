import React from "react";
import { SafeAreaView, View, StatusBar, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme";

export function Screen({ children, scroll = true, padded = true, contentStyle }) {
  const { colors, scheme, spacing } = useTheme();

  const content = (
    <View
      style={[
        padded ? { paddingHorizontal: spacing.lg, paddingBottom: spacing["3xl"] } : null,
        !scroll ? { flex: 1 } : null,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <LinearGradient
        colors={colors.bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Orbs />
      <SafeAreaView style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing["4xl"] + 80 }}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, paddingTop: spacing.lg }}>{content}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

function Orbs() {
  const { colors } = useTheme();
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: 999,
          backgroundColor: colors.overlayOrbGold,
          opacity: 0.9,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -160,
          left: -100,
          width: 380,
          height: 380,
          borderRadius: 999,
          backgroundColor: colors.overlayOrbTeal,
          opacity: 0.9,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: "28%",
          alignSelf: "center",
          width: 240,
          height: 240,
          borderRadius: 999,
          backgroundColor: colors.overlayNoise ?? "rgba(255,255,255,0.015)",
          opacity: 0.9,
        }}
      />
    </>
  );
}
