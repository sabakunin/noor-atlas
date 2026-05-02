import React from "react";
import { View } from "react-native";
import { useTheme } from "../theme";
import { Text } from "./Text";

export function HijriDateBar({ gregorian, hijri }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }}>
      <Text variant="bodySm" color="muted">
        {gregorian}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: colors.gold }} />
        <Text variant="bodySm" color="muted">
          {hijri}
        </Text>
      </View>
    </View>
  );
}
