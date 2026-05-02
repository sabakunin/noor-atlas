import React from "react";
import { Switch as RNSwitch, Platform } from "react-native";
import { useTheme } from "../theme";

export function Switch({ value, onValueChange, disabled }) {
  const { colors } = useTheme();
  return (
    <RNSwitch
      value={!!value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.line, true: colors.gold }}
      thumbColor={Platform.OS === "android" ? (value ? colors.goldSoft : colors.cardElevated) : undefined}
      ios_backgroundColor={colors.line}
    />
  );
}
