import React, { useEffect, useMemo, useState } from "react";
import { View, TextInput, FlatList, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Polygon } from "react-native-svg";
import { Screen } from "../components/Screen";
import { Text } from "../components/Text";
import { ArabicText } from "../components/ArabicText";
import { SegmentedControl } from "../components/SegmentedControl";
import { FadeSlideIn } from "../components/motion/FadeSlideIn";
import { PressScale } from "../components/motion/PressScale";
import { StaggerItem } from "../components/motion/Stagger";
import { AyahActionSheet } from "../components/AyahActionSheet";
import { useTheme } from "../theme";
import { useSettings } from "../contexts/SettingsContext";
import { surahs, getSura } from "../services/quran";
import { getLastRead, getLastReadCached } from "../services/lastRead";
import { addBookmark } from "../services/bookmarks";
import { explainSura, getCachedSuraExplanation } from "../services/ai";

const VIEW_OPTIONS = [
  { value: "sura", label: "Сура" },
  { value: "mushaf", label: "Мусхаф" },
  { value: "bookmarks", label: "Закладки" },
];

function HexBadge({ number, size = 44, color, textColor }) {
  const w = size;
  const h = size * 0.92;
  const points = [
    [w * 0.5, 0], [w, h * 0.27], [w, h * 0.73], [w * 0.5, h], [0, h * 0.73], [0, h * 0.27],
  ].map((p) => p.join(",")).join(" ");
  return (
    <View style={{ width: w, height: h, alignItems: "center", justifyContent: "center" }}>
      <Svg width={w} height={h} style={{ position: "absolute" }}>
        <Polygon points={points} fill={color} />
      </Svg>
      <Text variant="caption" color={textColor} weight="700" style={{ letterSpacing: 0.4 }}>
        {number}
      </Text>
    </View>
  );
}

export function QuranScreen({ onOpenSura, onOpenVoiceCheck, onOpenMushaf, onOpenBookmarks }) {
  const { colors, spacing, radius, fonts } = useTheme();
  const settings = useSettings();
  const [view, setView] = useState("sura");
  const [search, setSearch] = useState("");
  const [lastRead, setLastRead] = useState(getLastReadCached());
  const [actionSura, setActionSura] = useState(null);
  const [explainPanel, setExplainPanel] = useState(null);

  useEffect(() => {
    let alive = true;
    getLastRead().then((v) => { if (alive) setLastRead(v); });
    return () => { alive = false; };
  }, []);

  // refresh cache after sura close
  useEffect(() => {
    const id = setInterval(() => {
      const cached = getLastReadCached();
      if (cached && (!lastRead || cached.at !== lastRead.at)) setLastRead(cached);
    }, 1500);
    return () => clearInterval(id);
  }, [lastRead]);

  const filteredSuras = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter(
      (s) =>
        s.russianName.toLowerCase().includes(q) ||
        s.translation.toLowerCase().includes(q) ||
        String(s.number) === q
    );
  }, [search]);

  function handleSelectView(next) {
    if (next === "mushaf") {
      onOpenMushaf?.();
      return;
    }
    if (next === "bookmarks") {
      onOpenBookmarks?.();
      return;
    }
    setView(next);
  }

  return (
    <Screen scroll={false} padded={false} contentStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 0, flex: 1 }}>
      <FadeSlideIn delay={20}>
        <View style={{ marginBottom: spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text variant="caption" color="muted" style={{ letterSpacing: 1.6, textTransform: "uppercase" }}>
              КОРАН
            </Text>
            <Text variant="h1" color="text" weight="700" style={{ marginTop: 2 }}>
              Священный Коран
            </Text>
          </View>
          <ArabicText fontKey="naskh" tajweed={false} variant="arabic" color="gold" align="right" style={{ fontSize: 26, lineHeight: 36 }}>
            القرآن
          </ArabicText>
        </View>
      </FadeSlideIn>

      {lastRead?.suraNumber ? (
        <FadeSlideIn delay={50}>
          <ContinueChip
            lastRead={lastRead}
            onResume={() => onOpenSura?.(lastRead.suraNumber, lastRead.ayahNumber)}
          />
        </FadeSlideIn>
      ) : null}

      <FadeSlideIn delay={70}>
        <View
          style={{
            flexDirection: "row", alignItems: "center",
            backgroundColor: colors.cardElevated,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
            marginBottom: spacing.sm, height: 48,
            shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
            elevation: 2,
          }}
        >
          <MaterialCommunityIcons name="magnify" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Найти суру"
            placeholderTextColor={colors.mutedSoft}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              flex: 1, height: 22, lineHeight: 20, paddingVertical: 0, marginLeft: 8,
              color: colors.text, fontSize: 15, fontFamily: fonts.body,
              textAlignVertical: "center",
            }}
          />
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={120}>
        <View style={{ marginBottom: spacing.sm }}>
          <SegmentedControl value={view} onChange={handleSelectView} options={VIEW_OPTIONS} />
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={150}>
        <PressScale
          onPress={() => onOpenVoiceCheck?.()}
          haptic="selection"
          scale={0.98}
          style={{
            flexDirection: "row", alignItems: "center", gap: 10,
            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
            borderRadius: radius.lg, backgroundColor: colors.cardElevated,
            marginBottom: spacing.sm,
            shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
          }}
        >
          <MaterialCommunityIcons name="microphone-outline" size={18} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text variant="bodySm" color="text" weight="700">Проверка чтения</Text>
            <Text variant="caption" color="muted" style={{ marginTop: 1 }}>
              Читай аят вслух — ИИ строго сверит таджвид
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} />
        </PressScale>
      </FadeSlideIn>

      <View style={{ flex: 1 }}>
        <SuraList
          suras={filteredSuras}
          onOpenSura={onOpenSura}
          onLongPress={(item) => setActionSura(item)}
        />
      </View>

      <AyahActionSheet
        visible={!!actionSura}
        onClose={() => setActionSura(null)}
        title={actionSura?.russianName ?? ""}
        subtitle={actionSura ? `Сура ${actionSura?.number} · ${actionSura.translation}` : ""}
        arabicPreview={actionSura?.arabicName?.replace("سُورَةُ ", "")}
        actions={[
          {
            key: "open",
            icon: "book-open-variant",
            iconColor: colors.gold,
            tint: colors.gold + "22",
            label: "Открыть суру",
            hint: "Чтение с аятом 1",
            onPress: () => onOpenSura?.(actionSura?.number, 1),
          },
          {
            key: "play",
            icon: "play-circle-outline",
            iconColor: colors.teal,
            tint: colors.teal + "22",
            label: "Воспроизвести",
            hint: "Чтение с выбранного кари",
            onPress: () => onOpenSura?.(actionSura?.number, 1, { autoPlay: true }),
          },
          {
            key: "explain",
            icon: "lightbulb-on-outline",
            iconColor: colors.gold,
            tint: colors.gold + "22",
            label: "Объяснить",
            hint: "О чём сура — кратко от ИИ",
            onPress: () => setExplainPanel(actionSura),
          },
          {
            key: "bookmark",
            icon: "bookmark-plus-outline",
            iconColor: colors.text,
            label: "В закладки",
            hint: "Первый аят с твоим именем",
          },
        ]}
        bookmarkInput
        onSubmitBookmark={async (label) => {
          if (!actionSura) return;
          const sura = getSura(actionSura.number);
          const firstAyah = sura?.ayahs?.[0];
          if (!firstAyah) return;
          await addBookmark({
            suraNumber: actionSura.number,
            ayahNumber: 1,
            suraName: actionSura.russianName,
            label: label || `${actionSura.russianName} 1`,
            preview: firstAyah.arabic,
          });
        }}
      />

      <SuraExplainSheet sura={explainPanel} onClose={() => setExplainPanel(null)} />
    </Screen>
  );
}

function ContinueChip({ lastRead, onResume }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <PressScale
      onPress={onResume}
      haptic="selection"
      scale={0.98}
      style={{
        flexDirection: "row", alignItems: "center", gap: 10,
        paddingHorizontal: spacing.md, paddingVertical: 12,
        borderRadius: radius.lg,
        backgroundColor: colors.gold + "1A",
        marginBottom: spacing.sm,
        shadowColor: colors.gold, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 5 },
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 36, height: 36, borderRadius: 999,
          alignItems: "center", justifyContent: "center",
          backgroundColor: colors.gold,
        }}
      >
        <MaterialCommunityIcons name="bookmark-check" size={18} color={colors.textInverse} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="caption" color="muted" style={{ letterSpacing: 0.6, textTransform: "uppercase" }}>
          Продолжить чтение
        </Text>
        <Text variant="bodySm" color="text" weight="700" style={{ marginTop: 1 }}>
          {lastRead.suraName} · аят {lastRead.ayahNumber}
        </Text>
      </View>
      <MaterialCommunityIcons name="arrow-right" size={18} color={colors.gold} />
    </PressScale>
  );
}

function SuraList({ suras, onOpenSura, onLongPress }) {
  const { colors, spacing } = useTheme();
  return (
    <FlatList
      data={suras}
      keyExtractor={(item) => `sura-${item.number}`}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={10}
      maxToRenderPerBatch={6}
      windowSize={5}
      removeClippedSubviews
      renderItem={({ item, index }) => (
        <StaggerItem index={Math.min(index, 8)} baseDelay={32}>
          <Pressable
            onPress={() => onOpenSura?.(item.number)}
            onLongPress={() => onLongPress?.(item)}
            delayLongPress={280}
            android_ripple={{ color: colors.line }}
            style={({ pressed }) => ({
              marginBottom: 8,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              borderRadius: 16,
              backgroundColor: colors.cardElevated,
              opacity: pressed ? 0.85 : 1,
              shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
              elevation: 1,
            })}
          >
            <HexBadge number={item.number} size={42} color={colors.teal} textColor="textInverse" />
            <View style={{ flex: 1 }}>
              <Text variant="body" color="text" weight="600">{item.russianName}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                <Text variant="caption" color="muted">{item.translation}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <MaterialCommunityIcons name="star-four-points-outline" size={11} color={colors.muted} />
                  <Text variant="caption" color="muted">{item.ayahCount}</Text>
                </View>
              </View>
            </View>
            <ArabicText
              fontKey="naskh"
              tajweed={false}
              variant="arabic"
              color="text"
              style={{ fontSize: 22, lineHeight: 32 }}
            >
              {item.arabicName.replace("سُورَةُ ", "").replace("سُورَةُ ", "")}
            </ArabicText>
          </Pressable>
        </StaggerItem>
      )}
    />
  );
}

function SuraExplainSheet({ sura, onClose }) {
  const { colors, spacing, radius } = useTheme();
  const [text, setText] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const visible = !!sura;

  useEffect(() => {
    if (!sura) { setText(null); setError(null); return; }
    const cached = getCachedSuraExplanation(sura.number);
    if (cached) { setText(cached); return; }
    setLoading(true);
    setError(null);
    explainSura({
      suraNumber: sura.number,
      suraName: sura.russianName,
      translation: sura.translation,
      revelation: sura.revelation,
      ayahCount: sura.ayahCount,
    })
      .then((r) => { if (r.ok) setText(r.text); else setError(r.error || "Ошибка"); })
      .finally(() => setLoading(false));
  }, [sura]);

  if (!visible) return null;

  return (
    <Pressable onPress={onClose} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
      <Pressable
        onPress={() => {}}
        style={{
          margin: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.xl,
          backgroundColor: colors.bg,
          borderWidth: 1, borderColor: colors.line,
          shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 22, shadowOffset: { width: 0, height: 8 },
          elevation: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.sm }}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={colors.gold} />
          <Text variant="caption" color="muted" style={{ letterSpacing: 0.6, textTransform: "uppercase" }}>
            О суре
          </Text>
        </View>
        <Text variant="h3" color="text" weight="700">{sura.russianName}</Text>
        <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
          {sura.translation} · {sura.revelation} · {sura.ayahCount} аят{sura.ayahCount < 5 ? "а" : "ов"}
        </Text>

        <View style={{ marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.cardElevated, minHeight: 90 }}>
          {loading ? (
            <Text variant="bodySm" color="muted">Думаю над сурой…</Text>
          ) : error ? (
            <Text variant="bodySm" color="warning">Не удалось получить объяснение: {error}</Text>
          ) : text ? (
            <Text variant="body" color="text" style={{ lineHeight: 24 }}>{text}</Text>
          ) : null}
        </View>

        <PressScale
          onPress={onClose}
          haptic="light"
          scale={0.97}
          style={{
            marginTop: spacing.md,
            height: 48,
            alignItems: "center", justifyContent: "center",
            borderRadius: radius.md,
            backgroundColor: colors.card,
          }}
        >
          <Text variant="body" color="text" weight="600">Закрыть</Text>
        </PressScale>
      </Pressable>
    </Pressable>
  );
}
