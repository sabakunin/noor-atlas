import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { Text } from "./Text";
import { ArabicText } from "./ArabicText";
import { Card } from "./Card";

export function AyahCard({ ayah, onPress, icon = "book-open-page-variant-outline" }) {
  const { colors, spacing } = useTheme();
  if (!ayah) return null;

  return (
    <Card onPress={onPress} padding="lg">
      <LinearGradient
        colors={[colors.overlayOrbGold, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 90,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      />

      <View
        style={{
          paddingBottom: spacing.xs,
          marginBottom: spacing.md,
        }}
      >
        <ArabicText
          variant="arabicLarge"
          color="text"
          style={{
            lineHeight: 64,
          }}
        >
          {ayah.arabic}
        </ArabicText>
      </View>

      <Text variant="body" color="text" style={{ marginTop: 2 }}>
        {ayah.translation}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: spacing.sm,
        }}
      >
        {ayah.source ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
            <MaterialCommunityIcons name={icon} size={14} color={colors.gold} />
            <Text variant="bodySm" color="muted">
              {ayah.source}
            </Text>
          </View>
        ) : <View style={{ flex: 1 }} />}
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
      </View>
    </Card>
  );
}
