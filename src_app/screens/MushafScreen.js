import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, FlatList, ScrollView, Animated, Easing } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal } from "../components/Modal";
import { Text } from "../components/Text";
import { ArabicText } from "../components/ArabicText";
import { PressScale } from "../components/motion/PressScale";
import { StaggerItem } from "../components/motion/Stagger";
import { useTheme } from "../theme";
import { MUSHAFS, getMushaf } from "../services/mushafPages";
import { surahs, getSura } from "../services/quran";
import { getItem, setItem, StorageKeys } from "../services/storage";

// 1..114 → cumulative ayah offset (so we can flatten to a single stream)
const SURA_OFFSETS = (() => {
  const offsets = [0];
  for (let i = 0; i < surahs.length; i += 1) offsets.push(offsets[i] + surahs[i].ayahCount);
  return offsets;
})();
const TOTAL_AYAHS = SURA_OFFSETS[SURA_OFFSETS.length - 1];
const TEXT_PAGES = 604;
const AYAHS_PER_PAGE = TOTAL_AYAHS / TEXT_PAGES;

function ayahRangeForPage(page) {
  const startGlobal = Math.floor((page - 1) * AYAHS_PER_PAGE);
  const endGlobal = Math.min(TOTAL_AYAHS - 1, Math.floor(page * AYAHS_PER_PAGE) - 1);
  return [startGlobal, endGlobal];
}

function globalToSuraAyah(globalIndex) {
  for (let i = 0; i < surahs.length; i += 1) {
    if (globalIndex < SURA_OFFSETS[i + 1]) {
      return { suraNumber: i + 1, ayahNumber: globalIndex - SURA_OFFSETS[i] + 1 };
    }
  }
  return { suraNumber: 114, ayahNumber: 6 };
}

export function MushafScreen({ visible, onClose }) {
  const [mushafId, setMushafId] = useState(null);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    if (visible) {
      (async () => {
        const saved = await getItem(StorageKeys.preferredMushaf, null);
        if (saved && getMushaf(saved)) {
          setMushafId(saved);
        } else {
          setMushafId(null);
        }
      })();
    } else {
      setReading(false);
    }
  }, [visible]);

  function pickAndOpen(id) {
    setMushafId(id);
    setItem(StorageKeys.preferredMushaf, id);
    setReading(true);
  }

  const title = reading && mushafId ? getMushaf(mushafId).short : "Мусхаф";

  return (
    <Modal visible={visible} onClose={onClose} title={title} scroll={false} fullScreen>
      {reading && mushafId ? (
        <MushafReader mushafId={mushafId} onChooseEdition={() => setReading(false)} />
      ) : (
        <MushafPicker activeId={mushafId} onPick={pickAndOpen} />
      )}
    </Modal>
  );
}

function MushafPicker({ activeId, onPick }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text variant="caption" color="muted" style={{ marginBottom: spacing.md, letterSpacing: 0.4, lineHeight: 17 }}>
        Все издания работают полностью оффлайн — текст Корана отрисован разными каллиграфическими шрифтами и оформлен под разные традиции печатных мусхафов.
      </Text>
      <FlatList
        data={MUSHAFS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        renderItem={({ item, index }) => (
          <StaggerItem index={index} baseDelay={60} style={{ marginBottom: spacing.sm }}>
            <PressScale
              onPress={() => onPick(item.id)}
              haptic="medium"
              scale={0.985}
              style={{
                padding: spacing.md,
                borderRadius: radius.xl,
                backgroundColor: activeId === item.id ? item.accent + "1A" : colors.cardElevated,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                shadowColor: item.accent,
                shadowOpacity: activeId === item.id ? 0.18 : 0.05,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
              }}
            >
              <View
                style={{
                  width: 60, height: 70, borderRadius: 12,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: item.paperColor,
                  shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
                }}
              >
                <ArabicText
                  fontKey={item.fontKey}
                  tajweed={false}
                  variant="arabic"
                  style={{ color: item.inkColor, fontSize: 20, lineHeight: 24 }}
                >
                  ﷽
                </ArabicText>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" color="text" weight="700">{item.name}</Text>
                <Text variant="caption" color="muted" style={{ marginTop: 3, lineHeight: 17 }}>
                  {item.description}
                </Text>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 6, alignItems: "center" }}>
                  <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: item.accent }} />
                  <Text variant="caption" color="mutedSoft">оффлайн · {item.pages} страниц</Text>
                  {activeId === item.id ? (
                    <Text variant="caption" weight="700" style={{ color: item.accent, letterSpacing: 0.4 }}>· ВЫБРАН</Text>
                  ) : null}
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </PressScale>
          </StaggerItem>
        )}
      />
    </View>
  );
}

function MushafReader({ mushafId, onChooseEdition }) {
  const mushaf = getMushaf(mushafId);
  const [page, setPage] = useState(1);

  function go(delta) {
    setPage((p) => Math.max(1, Math.min(mushaf.pages, p + delta)));
  }

  return (
    <View style={{ flex: 1 }}>
      <ReaderHeader mushaf={mushaf} page={page} onChooseEdition={onChooseEdition} />
      <View style={{ flex: 1 }}>
        <TextPage page={page} mushaf={mushaf} />
      </View>
      <ReaderFooter page={page} total={mushaf.pages} accent={mushaf.accent} onPrev={() => go(-1)} onNext={() => go(1)} onFirst={() => setPage(1)} />
    </View>
  );
}

function ReaderHeader({ mushaf, page, onChooseEdition }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <PressScale onPress={onChooseEdition} haptic="light" scale={0.96} fullWidth={false}
        style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.cardElevated, flexDirection: "row", alignItems: "center", gap: 6 }}>
        <MaterialCommunityIcons name="book-multiple-outline" size={14} color={mushaf.accent} />
        <Text variant="caption" color="text" weight="600">{mushaf.short}</Text>
      </PressScale>
      <View style={{ flex: 1 }} />
      <Text variant="caption" color="muted">Страница {page} из {mushaf.pages}</Text>
    </View>
  );
}

function ReaderFooter({ page, total, accent, onPrev, onNext, onFirst }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.lg,
        gap: 6,
        backgroundColor: colors.bg,
      }}
    >
      <PressScale onPress={onPrev} haptic="selection" scale={0.95} fullWidth={false}
        disabled={page <= 1}
        style={{ flex: 1, height: 52, borderRadius: radius.lg, backgroundColor: colors.cardElevated, alignItems: "center", justifyContent: "center", opacity: page <= 1 ? 0.35 : 1 }}>
        <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
      </PressScale>

      <PressScale onPress={onFirst} haptic="light" scale={0.95} fullWidth={false}
        style={{ width: 52, height: 52, borderRadius: 999, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" }}>
        <MaterialCommunityIcons name="page-first" size={22} color={colors.muted} />
      </PressScale>

      <PressScale onPress={onNext} haptic="selection" scale={0.95} fullWidth={false}
        disabled={page >= total}
        style={{ flex: 1, height: 52, borderRadius: radius.lg, backgroundColor: accent, alignItems: "center", justifyContent: "center", opacity: page >= total ? 0.4 : 1 }}>
        <MaterialCommunityIcons name="chevron-right" size={26} color="#FFFFFF" />
      </PressScale>
    </View>
  );
}

function TextPage({ page, mushaf }) {
  const { spacing, radius } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [page, fade]);

  const ayahs = useMemo(() => {
    const [start, end] = ayahRangeForPage(page);
    const items = [];
    for (let i = start; i <= end; i += 1) {
      const { suraNumber, ayahNumber } = globalToSuraAyah(i);
      const sura = getSura(suraNumber);
      const ayah = sura?.ayahs.find((a) => a.number === ayahNumber);
      if (!ayah) continue;
      items.push({ suraNumber, suraName: sura.russianName, ayahNumber, arabic: ayah.arabic });
    }
    return items;
  }, [page]);

  const grouped = useMemo(() => {
    const groups = [];
    let lastSura = -1;
    for (const a of ayahs) {
      if (a.suraNumber !== lastSura) {
        groups.push({ suraNumber: a.suraNumber, suraName: a.suraName, ayahs: [a] });
        lastSura = a.suraNumber;
      } else {
        groups[groups.length - 1].ayahs.push(a);
      }
    }
    return groups;
  }, [ayahs]);

  const arabicSize = mushaf.style === "kufi" ? 22 : mushaf.style === "scheherazade" ? 30 : 26;
  const arabicLineHeight = mushaf.style === "kufi" ? 44 : mushaf.style === "scheherazade" ? 64 : 56;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          backgroundColor: mushaf.paperColor,
          borderRadius: radius.xl,
          padding: spacing.lg,
          shadowColor: mushaf.accent,
          shadowOpacity: 0.18,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6,
          opacity: fade,
        }}
      >
        <View
          style={{
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            paddingBottom: spacing.sm, marginBottom: spacing.md,
            borderBottomWidth: 1, borderBottomColor: mushaf.accent + "33",
          }}
        >
          <ArabicText fontKey={mushaf.fontKey} tajweed={false} style={{ color: mushaf.accent, fontSize: 14, letterSpacing: 0.6 }}>
            صفحة
          </ArabicText>
          <View
            style={{
              width: 38, height: 38, borderRadius: 999,
              alignItems: "center", justifyContent: "center",
              backgroundColor: mushaf.accent + "22",
            }}
          >
            <Text serif weight="700" style={{ color: mushaf.inkColor, fontSize: 14 }}>
              {page}
            </Text>
          </View>
          <ArabicText fontKey={mushaf.fontKey} tajweed={false} style={{ color: mushaf.accent, fontSize: 14, letterSpacing: 0.6 }}>
            مصحف
          </ArabicText>
        </View>

        {grouped.map((group) => (
          <View key={`g-${group.suraNumber}`} style={{ marginBottom: spacing.lg }}>
            <View
              style={{
                alignItems: "center",
                paddingVertical: 10, marginBottom: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: mushaf.accent + "14",
              }}
            >
              <Text serif weight="700" style={{ color: mushaf.inkColor, fontSize: 14, letterSpacing: 0.4 }}>
                Сура {group.suraNumber} · {group.suraName}
              </Text>
            </View>
            {group.ayahs.map((a) => (
              <View
                key={`p-${a.suraNumber}-${a.ayahNumber}`}
                style={{ flexDirection: "row-reverse", alignItems: "flex-start", marginBottom: 10, gap: 10 }}
              >
                <View
                  style={{
                    width: 30, height: 30, borderRadius: 999, marginTop: 10,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: mushaf.accent + "22",
                  }}
                >
                  <Text serif weight="700" style={{ color: mushaf.inkColor, fontSize: 11 }}>
                    {a.ayahNumber}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <ArabicText
                    fontKey={mushaf.fontKey}
                    tajweed={false}
                    variant="arabicLarge"
                    align="right"
                    style={{ color: mushaf.inkColor, lineHeight: arabicLineHeight, fontSize: arabicSize }}
                  >
                    {a.arabic}
                  </ArabicText>
                </View>
              </View>
            ))}
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}
