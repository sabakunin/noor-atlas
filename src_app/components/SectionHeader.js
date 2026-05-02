import React from "react";
import { View } from "react-native";
import { useTheme } from "../theme";
import { Text } from "./Text";

export function SectionHeader({ title, eyebrow, action, right }) {
  const { spacing } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {eyebrow ? (
        <Text variant="caption" color="muted" style={{ textTransform: "uppercase", marginBottom: 6 }}>
          {eyebrow}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <Text variant="h2" color="text" serif weight="600">
          {title}
        </Text>
        {right ?? action ?? null}
      </View>
    </View>
  );
}
