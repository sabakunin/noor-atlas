import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Screen } from "../components/Screen";
import { Text } from "../components/Text";
import { Card } from "../components/Card";
import { Compass } from "../components/Compass";
import { FadeSlideIn } from "../components/motion/FadeSlideIn";
import { useTheme } from "../theme";
import { useSettings } from "../contexts/SettingsContext";
import { useQibla } from "../hooks/useQibla";
import { t } from "../i18n";

export function QiblaScreen() {
  const { colors, spacing } = useTheme();
  const { city, uiHaptics } = useSettings();
  const { bearing, heading, relativeAngle, turnHint, distance, accuracyLabel, supported } = useQibla({ city });

  const alignedRef = useRef(false);
  useEffect(() => {
    if (turnHint?.aligned && !alignedRef.current) {
      alignedRef.current = true;
      if (uiHaptics !== false) {
        import("expo-haptics")
          .then((Haptics) => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}))
          .catch(() => {});
      }
    }
    if (!turnHint?.aligned) alignedRef.current = false;
  }, [turnHint?.aligned, uiHaptics]);

  const statusText = !supported
    ? t("qibla.sensorUnavailable")
    : turnHint?.aligned
    ? t("qibla.aligned")
    : accuracyLabel === "calibration"
    ? t("qibla.needCalibration")
    : turnHint?.direction === "right"
    ? t("qibla.turnRight", undefined, turnHint.degrees)
    : turnHint?.direction === "left"
    ? t("qibla.turnLeft", undefined, turnHint.degrees)
    : t("qibla.holdSteady");

  return (
    <Screen>
      <FadeSlideIn delay={40}>
        <View style={{ marginBottom: spacing.lg }}>
          <Text variant="caption" color="muted" style={{ letterSpacing: 1.4, textTransform: "uppercase" }}>
            {t("tabs.qibla")}
          </Text>
          <Text variant="display" color="text" serif weight="700" style={{ marginTop: 4 }}>
            {t("qibla.title")}
          </Text>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={100}>
        <Card padding="xl" elevated style={{ alignItems: "center" }}>
          <Compass
            heading={heading}
            qiblaBearing={bearing}
            relativeAngle={relativeAngle}
            aligned={turnHint?.aligned}
          />

          <Text
            variant="body"
            color={turnHint?.aligned ? "success" : "text"}
            weight="600"
            align="center"
            style={{ marginTop: spacing.lg }}
          >
            {statusText}
          </Text>

          {city ? (
            <Text variant="bodySm" color="muted" align="center" style={{ marginTop: 6 }}>
              {city.title}, {city.country}
            </Text>
          ) : null}
        </Card>
      </FadeSlideIn>

      <FadeSlideIn delay={160}>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
          <Card style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <MaterialCommunityIcons name="compass-outline" size={16} color={colors.gold} />
              <Text variant="caption" color="muted" style={{ letterSpacing: 1, textTransform: "uppercase" }}>
                {t("qibla.bearing")}
              </Text>
            </View>
            <Text variant="h2" color="text" weight="700" serif>
              {bearing != null ? `${Math.round(bearing)}°` : "—"}
            </Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <MaterialCommunityIcons name="map-marker-distance" size={16} color={colors.gold} />
              <Text variant="caption" color="muted" style={{ letterSpacing: 1, textTransform: "uppercase" }}>
                {t("qibla.distance")}
              </Text>
            </View>
            <Text variant="h2" color="text" weight="700" serif>
              {distance != null ? `${distance.toLocaleString("ru-RU")} км` : "—"}
            </Text>
          </Card>
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={220}>
        <Card style={{ marginTop: spacing.md, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.cardElevated,
            }}
          >
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.gold} />
          </View>
          <Text variant="bodySm" color="muted" style={{ flex: 1 }}>
            Поверни телефон в горизонтальной плоскости. Стрелка укажет направление на Каабу. Если рядом металл, отойди в сторону для точности.
          </Text>
        </Card>
      </FadeSlideIn>
    </Screen>
  );
}
