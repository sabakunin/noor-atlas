import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { Text } from "../components/Text";
import { Card } from "../components/Card";
import { FadeSlideIn } from "../components/motion/FadeSlideIn";
import { useTheme } from "../theme";
import { useSettings } from "../contexts/SettingsContext";
import { getMethodMeta } from "../data/methods";
import { t } from "../i18n";

function MenuRow({ icon, title, subtitle, onPress }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Card onPress={onPress} padding="lg" style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: radius.md,
            backgroundColor: colors.cardElevated,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons name={icon} size={20} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h3" color="text" weight="600">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodySm" color="muted" style={{ marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
      </View>
    </Card>
  );
}

export function ProfileScreen({ onOpenSettings, onOpenStatistics, onOpenAbout, onOpenCity }) {
  const { colors, spacing } = useTheme();
  const { city, calculationMethod, madhab } = useSettings();
  const methodMeta = getMethodMeta(calculationMethod);

  return (
    <Screen>
      <FadeSlideIn delay={40}>
        <View style={{ marginBottom: spacing.lg }}>
          <Text variant="caption" color="muted" style={{ letterSpacing: 1.4, textTransform: "uppercase" }}>
            {t("tabs.profile")}
          </Text>
          <Text variant="display" color="text" serif weight="700" style={{ marginTop: 4 }}>
            {t("profile.title")}
          </Text>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={100}>
        <Card onPress={onOpenCity} padding="lg" style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text variant="caption" color="muted" style={{ letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
                {t("profile.location")}
              </Text>
              <Text variant="h2" color="text" serif weight="700">
                {city?.title ?? "—"}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Text variant="bodySm" color="muted">
                  {city?.country ?? ""}
                </Text>
                <Text variant="bodySm" color="gold" weight="600">
                  · {t("profile.changeCity")}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </View>
        </Card>
      </FadeSlideIn>

      <FadeSlideIn delay={160}>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
          <Card style={{ flex: 1 }} padding="md">
            <Text variant="caption" color="muted" style={{ letterSpacing: 1.2, textTransform: "uppercase" }}>
              {t("profile.method")}
            </Text>
            <Text variant="h3" color="text" weight="600" style={{ marginTop: 6 }}>
              {methodMeta.title.split(" ")[0]}
            </Text>
          </Card>
          <Card style={{ flex: 1 }} padding="md">
            <Text variant="caption" color="muted" style={{ letterSpacing: 1.2, textTransform: "uppercase" }}>
              {t("profile.madhab")}
            </Text>
            <Text variant="h3" color="text" weight="600" style={{ marginTop: 6 }}>
              {madhab === "hanafi" ? t("settings.madhabHanafi") : t("settings.madhabShafi")}
            </Text>
          </Card>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={220}>
        <MenuRow icon="cog-outline" title={t("profile.settings")} subtitle="Тема, методы, уведомления" onPress={onOpenSettings} />
      </FadeSlideIn>
      <FadeSlideIn delay={260}>
        <MenuRow icon="chart-line" title={t("profile.statistics")} subtitle="История прочитанных намазов" onPress={onOpenStatistics} />
      </FadeSlideIn>
      <FadeSlideIn delay={300}>
        <MenuRow icon="information-outline" title={t("profile.about")} subtitle="Версия 1.0.0" onPress={onOpenAbout} />
      </FadeSlideIn>
    </Screen>
  );
}
