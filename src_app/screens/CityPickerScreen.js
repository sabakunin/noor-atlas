import React, { useMemo, useState } from "react";
import { View, TextInput, FlatList, Platform, KeyboardAvoidingView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal } from "../components/Modal";
import { Text } from "../components/Text";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { PressScale } from "../components/motion/PressScale";
import { useTheme } from "../theme";
import { cities, findCityByCoords } from "../data/cities";
import { useSettings } from "../contexts/SettingsContext";
import { getCurrentCoords, reverseGeocode, requestLocationPermission } from "../services/location";
import { t } from "../i18n";

export function CityPickerScreen({ visible, onClose }) {
  const { colors, spacing, radius, fonts } = useTheme();
  const { city, setCity } = useSettings();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) => c.title.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    );
  }, [search]);

  async function detectCity() {
    setBusy(true);
    setError(null);
    try {
      if (Platform.OS !== "web") {
        const perm = await requestLocationPermission();
        if (!perm.granted) {
          setError(t("permissions.locationDenied"));
          setBusy(false);
          return;
        }
      }
      const coords = await getCurrentCoords();
      const reverse = await reverseGeocode(coords.lat, coords.lon);
      const matched = findCityByCoords(coords.lat, coords.lon, 0.8);
      const detectedCity = {
        id: matched?.id ?? `gps-${Date.now()}`,
        title: reverse?.city ?? matched?.title ?? "Текущее местоположение",
        country: reverse?.country ?? matched?.country ?? "—",
        lat: coords.lat,
        lon: coords.lon,
        tz: matched?.tz ?? null,
      };
      setCity(detectedCity);
      onClose?.();
    } catch (e) {
      setError(t("permissions.locationDenied"));
    } finally {
      setBusy(false);
    }
  }

  function pick(item) {
    setCity(item);
    onClose?.();
  }

  return (
    <Modal visible={visible} onClose={onClose} title={t("city.title")} scroll={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, paddingTop: spacing.xs }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.line,
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
            height: 54,
          }}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("city.search")}
            placeholderTextColor={colors.mutedSoft}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={{
              flex: 1,
              height: 22,
              lineHeight: 20,
              paddingVertical: 0,
              marginLeft: 8,
              color: colors.text,
              fontSize: 16,
              fontFamily: fonts.body,
              textAlignVertical: "center",
            }}
          />
        </View>

        <Button
          title={busy ? t("city.locating") : t("city.useGps")}
          onPress={detectCity}
          loading={busy}
          variant="ghost"
          icon={<MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.gold} />}
        />

        {error ? (
          <Text variant="bodySm" color="warning" align="center" style={{ marginTop: spacing.sm }}>
            {error}
          </Text>
        ) : null}

        <View style={{ height: spacing.md }} />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: spacing["2xl"] }}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const active = city?.id === item.id;
            return (
              <PressScale
                onPress={() => pick(item)}
                haptic="selection"
                scale={0.985}
                style={{
                  padding: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: active ? colors.gold : colors.line,
                  backgroundColor: active ? colors.cardElevated : colors.card,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="body" color="text" weight={active ? "700" : "600"}>
                    {item.title}
                  </Text>
                  <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
                    {item.country}
                  </Text>
                </View>
                {active ? <MaterialCommunityIcons name="check-circle" size={20} color={colors.gold} /> : null}
              </PressScale>
            );
          }}
        />
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
