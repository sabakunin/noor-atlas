import React from "react";
import { View, Linking } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal } from "../components/Modal";
import { Text } from "../components/Text";
import { Card } from "../components/Card";
import { useTheme } from "../theme";
import { t } from "../i18n";

export function AboutScreen({ visible, onClose }) {
  const { colors, spacing } = useTheme();
  return (
    <Modal visible={visible} onClose={onClose} title={t("profile.about")}>
      <Card padding="xl" style={{ alignItems: "center", marginBottom: spacing.lg }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: colors.gold,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.md,
          }}
        >
          <MaterialCommunityIcons name="star-crescent" size={42} color={colors.gold} />
        </View>
        <Text variant="h1" color="text" serif weight="700">
          Noor Atlas
        </Text>
        <Text variant="bodySm" color="muted" style={{ marginTop: 6 }}>
          {t("profile.version")} 1.0.0
        </Text>
      </Card>

      <Text variant="body" color="text" align="center" style={{ marginBottom: spacing.lg }}>
        {t("profile.aboutBody")}
      </Text>

      <Text variant="caption" color="muted" align="center" style={{ letterSpacing: 1.2, textTransform: "uppercase" }}>
        Сделано с уважением к традиции
      </Text>
    </Modal>
  );
}
