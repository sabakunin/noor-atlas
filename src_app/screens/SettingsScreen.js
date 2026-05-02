import React, { useEffect, useState } from "react";
import { View, Linking, Platform, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal } from "../components/Modal";
import { Text } from "../components/Text";
import { Card } from "../components/Card";
import { PressScale } from "../components/motion/PressScale";
import { Switch } from "../components/Switch";
import { SegmentedControl } from "../components/SegmentedControl";
import { Button } from "../components/Button";
import { useTheme } from "../theme";
import { useSettings } from "../contexts/SettingsContext";
import { ArabicText } from "../components/ArabicText";
import { ARABIC_FONTS } from "../theme/fonts";
import { TAJWEED_LEGEND, tajweedPaletteFromColors } from "../services/tajweed";
import { calculationMethods } from "../data/methods";
import { scheduleTestNotification, scheduleDynamicIslandTest, requestNotificationPermission, getPermissionStatus } from "../services/notifications";
import { clearByPrefix, StorageKeys } from "../services/storage";
import { t } from "../i18n";

const PRAYER_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const LEAD_OPTIONS = [
  { value: 0, label: "0" },
  { value: 5, label: "5" },
  { value: 10, label: "10" },
  { value: 15, label: "15" },
];
const THEME_OPTIONS = [
  { value: "system", label: t("settings.themeSystem") },
  { value: "light", label: t("settings.themeLight") },
  { value: "dark", label: t("settings.themeDark") },
];
const MADHAB_OPTIONS = [
  { value: "shafi", label: t("settings.madhabShafi") },
  { value: "hanafi", label: t("settings.madhabHanafi") },
];

export function SettingsScreen({ visible, onClose, onOpenVoiceCheck }) {
  const { colors, spacing, radius } = useTheme();
  const settings = useSettings();
  const [testStatus, setTestStatus] = useState(null);
  const [resetStatus, setResetStatus] = useState(null);
  const [permWarning, setPermWarning] = useState(false);
  const [diStatus, setDiStatus] = useState(null);

  async function handleTestNotification() {
    const perm = await getPermissionStatus();
    if (!perm.granted) {
      const req = await requestNotificationPermission();
      if (!req.granted) {
        setPermWarning(true);
        return;
      }
    }
    const r = await scheduleTestNotification();
    setTestStatus(r.ok ? t("settings.testSent") : t("common.error"));
    setTimeout(() => setTestStatus(null), 4000);
  }

  async function handleReset() {
    await clearByPrefix(StorageKeys.statsPrefix);
    setResetStatus(t("settings.resetCacheDone"));
    setTimeout(() => setResetStatus(null), 3000);
  }

  async function handleDynamicIslandTest() {
    const perm = await getPermissionStatus();
    if (!perm.granted) {
      const req = await requestNotificationPermission();
      if (!req.granted) {
        setDiStatus("Нужно разрешить уведомления");
        setTimeout(() => setDiStatus(null), 4000);
        return;
      }
    }
    const r = await scheduleDynamicIslandTest("Asr");
    setDiStatus(r.ok ? "Появится через 3 сек на Dynamic Island" : "Не удалось");
    setTimeout(() => setDiStatus(null), 5000);
  }

  return (
    <Modal visible={visible} onClose={onClose} title={t("settings.title")}>
      <SectionTitle text="Свой ключ Gemini" />
      <Text variant="caption" color="muted" style={{ marginBottom: spacing.sm, paddingHorizontal: 4, lineHeight: 17 }}>
        Общий ключ быстро упирается в лимиты. Вставь свой бесплатный — лимит сразу станет личным.
      </Text>
      <GeminiKeyField />
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
        <Button
          title="Как получить ключ →"
          variant="ghost"
          onPress={() => {
            Linking.openURL("https://aistudio.google.com/apikey").catch(() => {});
          }}
        />
      </View>

      <SectionTitle text={t("settings.appearance")} />
      <Card padding="lg" style={{ marginBottom: spacing.md }}>
        <Text variant="bodySm" color="muted" style={{ marginBottom: spacing.sm }}>
          {t("settings.theme")}
        </Text>
        <SegmentedControl
          value={settings.themeMode}
          onChange={settings.setTheme}
          options={THEME_OPTIONS}
        />
      </Card>

      <Card padding="lg" style={{ marginBottom: spacing.md }}>
        <Row label="Отклик при нажатиях">
          <Switch
            value={settings.uiHaptics !== false}
            onValueChange={settings.setUiHaptics}
          />
        </Row>
      </Card>

      <SectionTitle text="Арабский шрифт" />
      <View style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
        {Object.values(ARABIC_FONTS).map((font) => {
          const active = settings.arabicFont === font.id;
          return (
            <PressScale
              key={font.id}
              onPress={() => settings.setArabicFont(font.id)}
              haptic="selection"
              scale={0.99}
              style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: active ? colors.cardElevated : "transparent",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Text variant="bodySm" color={active ? "gold" : "text"} weight={active ? "700" : "600"}>
                      {font.label}
                    </Text>
                    {font.tajweed ? (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.gold }}>
                        <Text variant="caption" color="textInverse" weight="700" style={{ letterSpacing: 0.6, textTransform: "uppercase" }}>
                          Таджвид
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text variant="caption" color="muted" style={{ marginBottom: 8 }}>
                    {font.description}
                  </Text>
                  <ArabicText
                    fontKey={font.id}
                    variant="arabic"
                    color={active ? "gold" : "text"}
                  >
                    {font.sample}
                  </ArabicText>
                </View>
                {active ? (
                  <MaterialCommunityIcons name="check-circle" size={22} color={colors.gold} />
                ) : (
                  <View style={{ width: 22, height: 22, borderRadius: 999, opacity: 0.18, backgroundColor: colors.line }} />
                )}
              </View>
            </PressScale>
          );
        })}
      </View>

      {settings.arabicFont === "mushaf" ? (
        <Card padding="lg" style={{ marginBottom: spacing.md }}>
          <Text variant="caption" color="muted" style={{ letterSpacing: 1.4, textTransform: "uppercase", marginBottom: spacing.sm }}>
            Цветовая разметка
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {TAJWEED_LEGEND.map((item) => {
              const palette = tajweedPaletteFromColors(colors);
              return (
                <View
                  key={item.rule}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.line,
                    backgroundColor: colors.card,
                  }}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: palette[item.rule] }} />
                  <Text variant="caption" color="text" weight="600">
                    {item.label}
                  </Text>
                  <Text variant="caption" color="muted">
                    · {item.note}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      ) : null}

      <SectionTitle text="Отображение Корана" />
      <Card padding="lg" style={{ marginBottom: spacing.md }}>
        <Row label="Арабский текст">
          <Switch
            value={settings.quranDisplay?.showArabic !== false}
            onValueChange={(v) => settings.setQuranDisplay({ showArabic: v })}
          />
        </Row>
        <Divider />
        <Row label="Перевод (Кулиев)">
          <Switch
            value={settings.quranDisplay?.showTranslation !== false}
            onValueChange={(v) => settings.setQuranDisplay({ showTranslation: v })}
          />
        </Row>
        <Divider />
        <Row label="Транскрипция">
          <Switch
            value={settings.quranDisplay?.showTransliteration !== false}
            onValueChange={(v) => settings.setQuranDisplay({ showTransliteration: v })}
          />
        </Row>
      </Card>

      <SectionTitle text={t("settings.calculation")} />
      <Text variant="bodySm" color="muted" style={{ marginBottom: spacing.sm }}>
        {t("settings.method")}
      </Text>
      <View style={{ gap: 4, marginBottom: spacing.sm }}>
        {calculationMethods.map((m) => {
          const active = settings.calculationMethod === m.key;
          return (
            <PressScale
              key={m.key}
              onPress={() => settings.setMethod(m.key)}
              haptic="selection"
              scale={0.99}
              style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: active ? colors.cardElevated : "transparent",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text variant="bodySm" color={active ? "gold" : "text"} weight={active ? "700" : "600"}>
                    {m.title}
                  </Text>
                  <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
                    {m.subtitle}
                  </Text>
                </View>
                {active ? (
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.gold} />
                ) : (
                  <View style={{ width: 20, height: 20, borderRadius: 999, opacity: 0.18, backgroundColor: colors.line }} />
                )}
              </View>
            </PressScale>
          );
        })}
      </View>

      <Card padding="lg" style={{ marginBottom: spacing.md }}>
        <Text variant="bodySm" color="muted" style={{ marginBottom: spacing.sm }}>
          {t("settings.madhab")}
        </Text>
        <SegmentedControl
          value={settings.madhab}
          onChange={settings.setMadhab}
          options={MADHAB_OPTIONS}
        />
      </Card>

      <SectionTitle text={t("settings.notifications")} />
      <Card padding="lg" style={{ marginBottom: spacing.sm }}>
        <Row label={t("settings.notificationsEnabled")}>
          <Switch
            value={settings.notifications.enabled}
            onValueChange={(v) => settings.setNotifications({ enabled: v })}
          />
        </Row>
        <Divider />
        <Row label={t("settings.soundEnabled")} disabled={!settings.notifications.enabled}>
          <Switch
            value={settings.notifications.sound}
            onValueChange={(v) => settings.setNotifications({ sound: v })}
            disabled={!settings.notifications.enabled}
          />
        </Row>
        <Divider />
        <Row label={t("settings.vibrationEnabled")} disabled={!settings.notifications.enabled}>
          <Switch
            value={settings.notifications.vibration}
            onValueChange={(v) => settings.setNotifications({ vibration: v })}
            disabled={!settings.notifications.enabled}
          />
        </Row>
        <Divider />
        <View style={{ paddingVertical: 8, opacity: settings.notifications.enabled ? 1 : 0.5 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text variant="body" color="text" style={{ flex: 1, paddingRight: spacing.md }}>
              Напоминать пока не отмечу
            </Text>
            <Switch
              value={settings.notifications.nagUntilMarked !== false}
              onValueChange={(v) => settings.setNotifications({ nagUntilMarked: v })}
              disabled={!settings.notifications.enabled}
            />
          </View>
          <Text variant="caption" color="muted" style={{ marginTop: 4 }}>
            Серия напоминаний (0, 1, 3, 5, 10, 15 мин) — обрывается, как только отметишь намаз на главной
          </Text>
        </View>
      </Card>

      <Card padding="lg" style={{ marginBottom: spacing.sm }}>
        <Text variant="bodySm" color="muted" style={{ marginBottom: spacing.sm }}>
          {t("settings.leadMinutes")}
        </Text>
        <SegmentedControl
          value={settings.notifications.leadMinutes}
          onChange={(v) => settings.setNotifications({ leadMinutes: v })}
          options={LEAD_OPTIONS}
        />
        <Text variant="caption" color="muted" style={{ marginTop: spacing.sm }}>
          {t("settings.minutesBefore", undefined, settings.notifications.leadMinutes)}
        </Text>
      </Card>

      <Card padding="lg" style={{ marginBottom: spacing.md }}>
        <Text variant="bodySm" color="muted" style={{ marginBottom: spacing.sm }}>
          {t("settings.perPrayer")}
        </Text>
        {PRAYER_KEYS.map((key, idx) => (
          <View key={key}>
            <Row label={t(`prayers.${key}`)} disabled={!settings.notifications.enabled}>
              <Switch
                value={settings.notifications.perPrayer?.[key] !== false}
                onValueChange={(v) =>
                  settings.setNotifications({
                    perPrayer: { ...settings.notifications.perPrayer, [key]: v },
                  })
                }
                disabled={!settings.notifications.enabled}
              />
            </Row>
            {idx < PRAYER_KEYS.length - 1 ? <Divider /> : null}
          </View>
        ))}
      </Card>

      <View style={{ marginBottom: spacing.lg, gap: spacing.sm }}>
        <Button title={t("settings.test")} onPress={handleTestNotification} variant="ghost" />
        {testStatus ? (
          <Text variant="bodySm" color="success" align="center">
            {testStatus}
          </Text>
        ) : null}

        <Button
          title="Тест Dynamic Island (Аср)"
          onPress={handleDynamicIslandTest}
          variant="ghost"
          icon={<MaterialCommunityIcons name="island" size={16} color={colors.gold} />}
        />
        {diStatus ? (
          <Text variant="bodySm" color="muted" align="center">
            {diStatus}
          </Text>
        ) : null}
        <Text variant="caption" color="mutedSoft" align="center" style={{ paddingHorizontal: spacing.md, lineHeight: 16 }}>
          На iOS 16+ это отобразится как обычное «time-sensitive» уведомление с иконкой намаза. Полноценный Live Activity (компактная плашка в Dynamic Island) требует кастомной сборки — Expo Go его не поддерживает.
        </Text>
        {permWarning ? (
          <View style={{ alignItems: "center" }}>
            <Text variant="bodySm" color="warning" align="center">
              {t("settings.notificationsBlocked")}
            </Text>
            {Platform.OS !== "web" ? (
              <View style={{ marginTop: 6 }}>
                <Button title={t("settings.openSystemSettings")} variant="ghost" onPress={() => Linking.openSettings()} fullWidth={false} />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <SectionTitle text="Чтение Корана" />
      <Card padding="lg" style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text variant="body" color="text" weight="600">Напоминать читать Коран</Text>
            <Text variant="caption" color="muted" style={{ marginTop: 4, lineHeight: 16 }}>
              5 раз в день: 7:30, 12:30, 16:00, 19:30, 22:00. Уведомления приходят, даже если приложение закрыто.
            </Text>
          </View>
          <Switch
            value={settings.quranReminders === true}
            onValueChange={settings.setQuranReminders}
          />
        </View>
      </Card>

      <SectionTitle text="Бета-функции" />
      <View style={{ gap: 4, marginBottom: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingVertical: 8, gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text variant="body" color="text" weight="600">
                Проверка чтения голосом
              </Text>
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.gold }}>
                <Text variant="caption" color="textInverse" weight="700" style={{ letterSpacing: 0.6, textTransform: "uppercase" }}>
                  Бета
                </Text>
              </View>
            </View>
            <Text variant="caption" color="muted" style={{ marginTop: 4, lineHeight: 16 }}>
              Выбираешь суру и аят, читаешь вслух — Gemini сверяет с эталоном и подсвечивает золотым слова, которые ты прочитал верно.
            </Text>
          </View>
          <Switch
            value={settings.beta?.voiceCheck === true}
            onValueChange={(v) => settings.setBeta({ voiceCheck: v })}
          />
        </View>
        {settings.beta?.voiceCheck ? (
          <Button
            title="Открыть проверку чтения"
            onPress={() => {
              if (onOpenVoiceCheck) {
                onClose?.();
                setTimeout(() => onOpenVoiceCheck(), 200);
              }
            }}
            variant="ghost"
            icon={<MaterialCommunityIcons name="microphone-outline" size={16} color={colors.gold} />}
          />
        ) : null}
      </View>

      <View style={{ marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Button title={t("settings.resetCache")} onPress={handleReset} variant="ghost" />
        {resetStatus ? (
          <Text variant="bodySm" color="muted" align="center" style={{ marginTop: spacing.sm }}>
            {resetStatus}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

function SectionTitle({ text }) {
  const { spacing } = useTheme();
  return (
    <Text variant="caption" color="muted" style={{ letterSpacing: 1.4, textTransform: "uppercase", marginTop: spacing.md, marginBottom: spacing.sm }}>
      {text}
    </Text>
  );
}

function Row({ label, children, disabled }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, opacity: disabled ? 0.5 : 1 }}>
      <Text variant="body" color="text">
        {label}
      </Text>
      {children}
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.line }} />;
}

function GeminiKeyField() {
  const { colors, spacing, radius } = useTheme();
  const settings = useSettings();
  const [value, setValue] = useState(settings.geminiApiKey || "");
  const [reveal, setReveal] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setValue(settings.geminiApiKey || "");
  }, [settings.geminiApiKey]);

  function handleSave() {
    settings.setGeminiApiKey(value.trim());
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  function handleClear() {
    setValue("");
    settings.setGeminiApiKey("");
  }

  return (
    <Card padding="md" style={{ marginBottom: spacing.xs }}>
      <View
        style={{
          flexDirection: "row", alignItems: "center",
          backgroundColor: colors.cardElevated,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          height: 50,
          shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
        }}
      >
        <MaterialCommunityIcons name="key-variant" size={16} color={colors.gold} />
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="AIza…"
          placeholderTextColor={colors.mutedSoft}
          secureTextEntry={!reveal}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            flex: 1,
            marginLeft: 10,
            color: colors.text,
            fontSize: 14,
            paddingVertical: 0,
            ...(Platform.OS === "android" ? { textAlignVertical: "center" } : {}),
          }}
        />
        <PressScale
          onPress={() => setReveal((r) => !r)}
          haptic="selection"
          scale={0.95}
          style={{ paddingHorizontal: 6, paddingVertical: 6 }}
        >
          <MaterialCommunityIcons name={reveal ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
        </PressScale>
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button title={savedFlash ? "Сохранено" : "Сохранить ключ"} onPress={handleSave} variant="ghost" />
        </View>
        {value ? (
          <View style={{ width: 110 }}>
            <Button title="Сбросить" onPress={handleClear} variant="ghost" />
          </View>
        ) : null}
      </View>
    </Card>
  );
}
