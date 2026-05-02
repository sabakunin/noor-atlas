import React, { useState } from "react";
import { View, Linking, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { Text } from "../components/Text";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { requestLocationPermission } from "../services/location";
import { requestNotificationPermission } from "../services/notifications";
import { setItem, StorageKeys } from "../services/storage";
import { t } from "../i18n";

export function PermissionGateScreen({ onDone }) {
  const { colors, spacing } = useTheme();
  const [busy, setBusy] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState(null);

  async function handleGrant() {
    setBusy(true);
    const loc = await requestLocationPermission();
    setLocationStatus(loc.status);
    const notif = await requestNotificationPermission();
    setNotificationStatus(notif.status);
    await setItem(StorageKeys.permissionsDone, "true");
    setBusy(false);
    onDone?.({ locationGranted: loc.granted, notificationGranted: notif.granted });
  }

  async function handleSkip() {
    await setItem(StorageKeys.permissionsDone, "true");
    onDone?.({ locationGranted: false, notificationGranted: false });
  }

  const locationDenied = locationStatus && locationStatus !== "granted";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={colors.bgGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
        <View style={{ marginBottom: spacing.xl }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.gold,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing.md,
            }}
          >
            <MaterialCommunityIcons name="shield-check-outline" size={28} color={colors.gold} />
          </View>
          <Text variant="display" color="text" serif weight="700">
            {t("permissions.title")}
          </Text>
          <Text variant="body" color="muted" style={{ marginTop: 8 }}>
            {t("permissions.body")}
          </Text>
        </View>

        <Card padding="lg" style={{ marginBottom: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                backgroundColor: colors.cardElevated,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.gold} />
            </View>
            <Text variant="h3" color="text" weight="600">
              {t("permissions.locationTitle")}
            </Text>
          </View>
          <Text variant="bodySm" color="muted">
            {t("permissions.locationBody")}
          </Text>
        </Card>

        <Card padding="lg" style={{ marginBottom: spacing.xl }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                backgroundColor: colors.cardElevated,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons name="bell-outline" size={20} color={colors.gold} />
            </View>
            <Text variant="h3" color="text" weight="600">
              {t("permissions.notificationsTitle")}
            </Text>
          </View>
          <Text variant="bodySm" color="muted">
            {t("permissions.notificationsBody")}
          </Text>
        </Card>

        <Button title={t("permissions.grant")} onPress={handleGrant} loading={busy} />
        <View style={{ height: spacing.sm }} />
        <Button title={t("permissions.skip")} onPress={handleSkip} variant="ghost" />

        {locationDenied ? (
          <View style={{ marginTop: spacing.md, alignItems: "center" }}>
            <Text variant="bodySm" color="warning" align="center">
              {t("permissions.locationDenied")}
            </Text>
            {Platform.OS !== "web" ? (
              <View style={{ marginTop: spacing.sm }}>
                <Button title={t("permissions.openSettings")} onPress={() => Linking.openSettings()} variant="outline" fullWidth={false} />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
