import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, FlatList, Animated, Easing, Pressable, TextInput, ActivityIndicator, ScrollView, Modal as RNModal } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Polygon } from "react-native-svg";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Modal } from "../components/Modal";
import { Text } from "../components/Text";
import { ArabicText } from "../components/ArabicText";
import { Switch } from "../components/Switch";
import { SegmentedControl } from "../components/SegmentedControl";
import { PressScale } from "../components/motion/PressScale";
import { AyahActionSheet } from "../components/AyahActionSheet";
import { AudioBar } from "../components/AudioBar";
import { useTheme } from "../theme";
import { useSettings } from "../contexts/SettingsContext";
import { getSura, surahs } from "../services/quran";
import { ARABIC_FONTS } from "../theme/fonts";
import { explainAyah, getCachedExplanation } from "../services/ai";
import { saveLastRead } from "../services/lastRead";
import { addBookmark } from "../services/bookmarks";
import { QARIS, getAyahAudioUrl, getQari } from "../services/quranAudio";
import { getItem, setItem, StorageKeys } from "../services/storage";

function similarityScore(query, name) {
  const q = query.toLowerCase().trim();
  const n = name.toLowerCase();
  if (!q) return 0;
  if (n === q) return 1000;
  if (n.startsWith(q)) return 800 - n.length;
  if (n.includes(q)) return 500 - n.indexOf(q);
  let qi = 0;
  let matched = 0;
  for (let i = 0; i < n.length && qi < q.length; i += 1) {
    if (n[i] === q[qi]) {
      matched += 1;
      qi += 1;
    }
  }
  if (matched === q.length) return 200 + matched - n.length * 0.1;
  return matched * 10;
}

const BISMILLAH = "بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

function toArabicNum(n) {
  return String(n).split("").map((d) => ARABIC_DIGITS[parseInt(d, 10)] ?? d).join("");
}

function juzForSura(suraNumber) {
  const map = [
    [1, 1], [2, 1], [3, 3], [4, 4], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
    [10, 11], [11, 11], [12, 12], [13, 13], [14, 13], [15, 14], [16, 14], [17, 15],
    [18, 15], [19, 16], [20, 16], [21, 17], [22, 17], [23, 18], [24, 18], [25, 18],
    [26, 19], [27, 19], [28, 20], [29, 20], [30, 21], [31, 21], [32, 21], [33, 21],
    [34, 22], [35, 22], [36, 22], [37, 23], [38, 23], [39, 23], [40, 24], [41, 24],
    [42, 25], [43, 25], [44, 25], [45, 25], [46, 26], [47, 26], [48, 26], [49, 26],
    [50, 26], [51, 26], [52, 27], [53, 27], [54, 27], [55, 27], [56, 27], [57, 27],
    [58, 28], [59, 28], [60, 28], [61, 28], [62, 28], [63, 28], [64, 28], [65, 28],
    [66, 28], [67, 29], [68, 29], [69, 29], [70, 29], [71, 29], [72, 29], [73, 29],
    [74, 29], [75, 29], [76, 29], [77, 29], [78, 30], [79, 30], [80, 30], [81, 30],
    [82, 30], [83, 30], [84, 30], [85, 30], [86, 30], [87, 30], [88, 30], [89, 30],
    [90, 30], [91, 30], [92, 30], [93, 30], [94, 30], [95, 30], [96, 30], [97, 30],
    [98, 30], [99, 30], [100, 30], [101, 30], [102, 30], [103, 30], [104, 30],
    [105, 30], [106, 30], [107, 30], [108, 30], [109, 30], [110, 30], [111, 30],
    [112, 30], [113, 30], [114, 30],
  ];
  const found = map.find(([s]) => s === suraNumber);
  return found ? found[1] : 1;
}

function HexBadge({ number, size = 36, color, textColor }) {
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

export function SuraScreen({ visible, suraNumber, startAyah, autoPlay, onClose }) {
  const { colors, spacing } = useTheme();
  const settings = useSettings();
  const { quranDisplay = {} } = settings;
  const [activeSura, setActiveSura] = useState(suraNumber);
  const [panel, setPanel] = useState(null); // null | "list" | "settings" | "reflection" | "qari"
  const [actionAyah, setActionAyah] = useState(null);
  const [explainAyahNum, setExplainAyahNum] = useState(null);
  const [qariId, setQariId] = useState(QARIS[0].id);
  const [audio, setAudio] = useState({ ayah: null, status: "idle" }); // idle|loading|playing|paused
  const soundRef = useRef(null);
  const queueRef = useRef([]); // array of ayah numbers to play in order
  const autoPlayedKeyRef = useRef(null);
  const sura = useMemo(() => (activeSura ? getSura(activeSura) : null), [activeSura]);
  const listRef = useRef(null);

  useEffect(() => {
    (async () => {
      const saved = await getItem(StorageKeys.preferredQari, null);
      if (saved && QARIS.find((q) => q.id === saved)) setQariId(saved);
    })();
  }, []);

  useEffect(() => {
    if (visible && suraNumber) {
      setActiveSura(suraNumber);
    }
    if (!visible) {
      setPanel(null);
      setActionAyah(null);
      setExplainAyahNum(null);
      stopAudio();
    }
  }, [visible, suraNumber]);

  const showArabic = quranDisplay.showArabic !== false;
  const showTranslation = quranDisplay.showTranslation !== false;
  const showTransliteration = quranDisplay.showTransliteration !== false;

  useEffect(() => {
    if (visible && startAyah && sura) {
      const idx = Math.max(0, Math.min(sura.ayahs.length - 1, startAyah - 1));
      const t = setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({ index: idx, animated: false });
        } catch {}
      }, 350);
      return () => clearTimeout(t);
    }
  }, [visible, startAyah, sura]);

  useEffect(() => {
    listRef.current?.scrollToOffset?.({ offset: 0, animated: false });
  }, [activeSura]);

  // Auto-play sura from start when triggered (once per open)
  useEffect(() => {
    if (!visible) {
      autoPlayedKeyRef.current = null;
      return;
    }
    if (!autoPlay || !sura) return;
    const key = `${sura.number}:${startAyah ?? 1}`;
    if (autoPlayedKeyRef.current === key) return;
    autoPlayedKeyRef.current = key;
    const startNum = startAyah ?? sura.ayahs[0]?.number ?? 1;
    const fromIdx = Math.max(0, sura.ayahs.findIndex((a) => a.number === startNum));
    const queue = sura.ayahs.slice(fromIdx).map((a) => a.number);
    const t = setTimeout(() => {
      startQueue(queue);
    }, 350);
    return () => clearTimeout(t);
  }, [visible, autoPlay, sura, startAyah]);

  // Persist last-read position whenever active sura/startAyah changes
  useEffect(() => {
    if (!visible || !sura) return;
    const ayahN = startAyah || 1;
    const firstAyah = sura.ayahs.find((a) => a.number === ayahN) ?? sura.ayahs[0];
    saveLastRead({
      suraNumber: sura.number,
      ayahNumber: firstAyah?.number ?? 1,
      suraName: sura.russianName,
      preview: firstAyah?.arabic ?? "",
    });
  }, [visible, sura, startAyah]);

  async function ensureSoundConfigured() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        interruptionMode: "mixWithOthers",
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
    } catch {}
  }

  function disposePlayer() {
    const p = soundRef.current;
    if (p) {
      try { p.pause(); } catch {}
      try { p.remove(); } catch {}
    }
    soundRef.current = null;
  }

  async function stopAudio() {
    disposePlayer();
    queueRef.current = [];
    setAudio({ ayah: null, status: "idle" });
  }

  async function playAyahNow(ayahNum) {
    if (!sura) return;
    await ensureSoundConfigured();
    disposePlayer();
    setAudio({ ayah: ayahNum, status: "loading" });
    try {
      const url = getAyahAudioUrl(sura.number, ayahNum, qariId);
      const player = createAudioPlayer({ uri: url });
      soundRef.current = player;
      let lastStatus = "loading";
      player.addListener("playbackStatusUpdate", (status) => {
        if (!status?.isLoaded) return;
        if (status.didJustFinish) {
          const queue = queueRef.current;
          const idx = queue.indexOf(ayahNum);
          const nextNum = idx >= 0 && idx < queue.length - 1 ? queue[idx + 1] : null;
          if (nextNum) {
            playAyahNow(nextNum);
          } else {
            disposePlayer();
            setAudio({ ayah: null, status: "idle" });
          }
          return;
        }
        // Throttle: only commit when status actually changes (string-level)
        const desired = status.playing ? "playing" : status.isBuffering ? "loading" : lastStatus;
        if (desired !== lastStatus) {
          lastStatus = desired;
          setAudio({ ayah: ayahNum, status: desired });
        }
      });
      player.play();
      // Scroll only on initial play (first item in queue), not every advance
      try {
        const queue = queueRef.current;
        const isFirst = queue.indexOf(ayahNum) === 0;
        if (isFirst) {
          const idx = sura.ayahs.findIndex((a) => a.number === ayahNum);
          if (idx > 0) {
            requestAnimationFrame(() => {
              try {
                listRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0.15 });
              } catch {}
            });
          }
        }
      } catch {}
    } catch (e) {
      // skip to next in queue if this ayah failed to load
      const queue = queueRef.current;
      const idx = queue.indexOf(ayahNum);
      const nextNum = idx >= 0 && idx < queue.length - 1 ? queue[idx + 1] : null;
      if (nextNum) {
        setTimeout(() => playAyahNow(nextNum), 200);
      } else {
        setAudio({ ayah: null, status: "idle" });
      }
    }
  }

  function startQueue(ayahNumbers) {
    queueRef.current = ayahNumbers;
    if (ayahNumbers.length) playAyahNow(ayahNumbers[0]);
  }

  async function togglePlayPause() {
    if (!soundRef.current) {
      if (sura) startQueue(sura.ayahs.map((a) => a.number));
      return;
    }
    const player = soundRef.current;
    if (player.playing) {
      try { player.pause(); } catch {}
      setAudio((a) => ({ ...a, status: "paused" }));
    } else {
      try { player.play(); } catch {}
      setAudio((a) => ({ ...a, status: "playing" }));
    }
  }

  function nextAyah() {
    if (!sura || !audio.ayah) return;
    const idx = sura.ayahs.findIndex((a) => a.number === audio.ayah);
    if (idx >= 0 && idx < sura.ayahs.length - 1) {
      const nextNum = sura.ayahs[idx + 1].number;
      queueRef.current = sura.ayahs.slice(idx + 1).map((a) => a.number);
      playAyahNow(nextNum);
    }
  }

  function prevAyah() {
    if (!sura || !audio.ayah) return;
    const idx = sura.ayahs.findIndex((a) => a.number === audio.ayah);
    if (idx > 0) {
      const prev = sura.ayahs[idx - 1].number;
      queueRef.current = sura.ayahs.slice(idx - 1).map((a) => a.number);
      playAyahNow(prev);
    }
  }

  function setQari(id) {
    setQariId(id);
    setItem(StorageKeys.preferredQari, id);
  }

  const showBismillah = sura && sura.number !== 1 && sura.number !== 9;

  const handleLongPressAyah = useCallback((item) => setActionAyah(item), []);
  const keyExtractor = useCallback((item) => `${sura?.number}:${item.number}`, [sura]);
  const ItemSeparator = useCallback(() => <View style={{ height: spacing.lg }} />, [spacing.lg]);
  const renderAyah = useCallback(({ item }) => (
    <AyahRow
      ayah={item}
      suraNumber={sura.number}
      suraName={sura.russianName}
      showArabic={showArabic}
      showTranslation={showTranslation}
      showTransliteration={showTransliteration}
      isPlaying={audio.ayah === item.number && audio.status === "playing"}
      isLoading={audio.ayah === item.number && audio.status === "loading"}
      explainOpen={explainAyahNum === item.number}
      onLongPress={handleLongPressAyah}
    />
  ), [sura, showArabic, showTranslation, showTransliteration, audio.ayah, audio.status, explainAyahNum, handleLongPressAyah]);

  return (
    <Modal visible={visible} onClose={onClose} title={sura?.russianName ?? "Коран"} scroll={false} fullScreen>
      <View style={{ flex: 1 }}>
        {sura ? (
          <FlatList
            ref={listRef}
            data={sura.ayahs}
            style={{ flex: 1 }}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ paddingBottom: 180 }}
            showsVerticalScrollIndicator={false}
            initialNumToRender={4}
            maxToRenderPerBatch={3}
            windowSize={3}
            removeClippedSubviews
            onScrollToIndexFailed={() => {}}
            ListHeaderComponent={
              <SuraHeader sura={sura} showBismillah={showBismillah} showArabic={showArabic} />
            }
            ItemSeparatorComponent={ItemSeparator}
            renderItem={renderAyah}
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text variant="body" color="muted">Сура не найдена</Text>
          </View>
        )}

        <AudioBar
          visible={audio.status !== "idle"}
          title={sura ? `${sura.russianName} · аят ${audio.ayah ?? ""}` : ""}
          subtitle={getQari(qariId).short}
          isPlaying={audio.status === "playing"}
          isLoading={audio.status === "loading"}
          onPlayPause={togglePlayPause}
          onPrev={prevAyah}
          onNext={nextAyah}
          onClose={stopAudio}
          bottomOffset={84}
        />

        <BottomBar
          onPalette={() => setPanel(panel === "settings" ? null : "settings")}
          onList={() => setPanel(panel === "list" ? null : "list")}
          onReflection={() => setPanel(panel === "reflection" ? null : "reflection")}
          onQari={() => setPanel(panel === "qari" ? null : "qari")}
          activePanel={panel}
        />

        <SuraSheet
          visible={panel === "list"}
          onClose={() => setPanel(null)}
          activeSura={activeSura}
          onSelect={(n) => {
            setActiveSura(n);
            setPanel(null);
            stopAudio();
          }}
        />
        <SettingsSheet
          visible={panel === "settings"}
          onClose={() => setPanel(null)}
          settings={settings}
        />
        <ReflectionSheet
          visible={panel === "reflection"}
          onClose={() => setPanel(null)}
        />
        <QariSheet
          visible={panel === "qari"}
          activeId={qariId}
          onSelect={(id) => { setQari(id); setPanel(null); }}
          onClose={() => setPanel(null)}
        />

        <AyahActionSheet
          visible={!!actionAyah}
          onClose={() => setActionAyah(null)}
          title={`Аят ${sura?.number ?? ""}:${actionAyah?.number ?? ""}`}
          subtitle={sura?.russianName ?? ""}
          arabicPreview={actionAyah?.arabic}
          actions={[
            {
              key: "play",
              icon: audio.ayah === actionAyah?.number && audio.status === "playing" ? "pause-circle-outline" : "play-circle-outline",
              iconColor: colors.teal,
              tint: colors.teal + "22",
              label: audio.ayah === actionAyah?.number && audio.status === "playing" ? "Пауза" : "Послушать аят",
              hint: getQari(qariId).short,
              onPress: () => {
                if (audio.ayah === actionAyah.number && audio.status === "playing") {
                  togglePlayPause();
                } else {
                  // queue from this ayah to end
                  const idx = sura.ayahs.findIndex((a) => a.number === actionAyah.number);
                  startQueue(sura.ayahs.slice(idx).map((a) => a.number));
                }
              },
            },
            {
              key: "explain",
              icon: "lightbulb-on-outline",
              iconColor: colors.gold,
              tint: colors.gold + "22",
              label: "Объяснить",
              hint: "Кратко от ИИ",
              onPress: () => setExplainAyahNum(actionAyah.number),
            },
            {
              key: "bookmark",
              icon: "bookmark-plus-outline",
              iconColor: colors.text,
              label: "В закладки",
              hint: "С твоим именем",
            },
          ]}
          bookmarkInput
          onSubmitBookmark={async (label) => {
            await addBookmark({
              suraNumber: sura.number,
              ayahNumber: actionAyah.number,
              suraName: sura.russianName,
              label: label || `${sura.russianName} ${sura.number}:${actionAyah.number}`,
              preview: actionAyah.arabic,
            });
          }}
        />
      </View>
    </Modal>
  );
}

function HeaderChip({ icon, label, color }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row", alignItems: "center", gap: 6,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 999, backgroundColor: colors.cardElevated,
        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
      }}
    >
      <MaterialCommunityIcons name={icon} size={12} color={color ?? colors.muted} />
      <Text variant="caption" color="text" weight="600" style={{ letterSpacing: 0.4 }}>
        {label}
      </Text>
    </View>
  );
}

function SuraHeader({ sura, showBismillah, showArabic }) {
  const { colors, spacing } = useTheme();
  const juzNum = juzForSura(sura.number);
  const totalPages = 604;
  const approxPage = Math.round((sura.number / 114) * totalPages);

  return (
    <View style={{ alignItems: "center", marginBottom: spacing.lg }}>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: spacing.md }}>
        <HeaderChip icon="book-open-page-variant" label={`${approxPage} стр.`} />
        <HeaderChip icon="navigation-variant" label={`${juzNum} джуз`} color={colors.gold} />
      </View>

      <Text variant="h2" color="text" weight="700">{sura.russianName}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
        <Text variant="caption" color="muted">{sura.revelation}</Text>
        <Text variant="caption" color="mutedSoft">·</Text>
        <Text variant="caption" color="muted">{sura.translation}</Text>
        <Text variant="caption" color="mutedSoft">·</Text>
        <Text variant="caption" color="muted">{sura.ayahCount} аят{sura.ayahCount < 5 ? "а" : "ов"}</Text>
      </View>

      {showBismillah && showArabic ? (
        <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.md, alignItems: "center" }}>
          <ArabicText fontKey="naskh" tajweed={false} variant="arabicLarge" color="text" align="center" style={{ lineHeight: 76 }}>
            {BISMILLAH}
          </ArabicText>
        </View>
      ) : null}
    </View>
  );
}

function AyahMarker({ number, color }) {
  return (
    <View style={{ width: 36, height: 36, borderRadius: 999, borderWidth: 1.5, borderColor: color, alignItems: "center", justifyContent: "center" }}>
      <Text serif color="text" weight="700" style={{ fontSize: 13, lineHeight: 16 }}>
        {toArabicNum(number)}
      </Text>
    </View>
  );
}

const AyahRow = React.memo(AyahRowImpl, (prev, next) => {
  return (
    prev.ayah === next.ayah &&
    prev.suraNumber === next.suraNumber &&
    prev.suraName === next.suraName &&
    prev.showArabic === next.showArabic &&
    prev.showTranslation === next.showTranslation &&
    prev.showTransliteration === next.showTransliteration &&
    prev.isPlaying === next.isPlaying &&
    prev.isLoading === next.isLoading &&
    prev.explainOpen === next.explainOpen &&
    prev.onLongPress === next.onLongPress
  );
});

function AyahRowImpl({ ayah, suraNumber, suraName, showArabic, showTranslation, showTransliteration, isPlaying, isLoading, explainOpen, onLongPress }) {
  const handleLong = useCallback(() => onLongPress?.(ayah), [onLongPress, ayah]);
  const { colors, spacing, radius } = useTheme();
  const [explanation, setExplanation] = useState(() => getCachedExplanation(suraNumber, ayah.number));
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState(null);

  useEffect(() => {
    if (!explainOpen) return;
    if (explanation || explainLoading) return;
    setExplainLoading(true);
    setExplainError(null);
    explainAyah({
      suraNumber,
      ayahNumber: ayah.number,
      arabic: ayah.arabic,
      translation: ayah.translation ?? "",
      suraName,
    })
      .then((r) => {
        if (r.ok) setExplanation(r.text);
        else setExplainError(r.error || "Ошибка");
      })
      .finally(() => setExplainLoading(false));
  }, [explainOpen, suraNumber, ayah.number, ayah.arabic, ayah.translation, suraName, explanation, explainLoading]);

  const accentColor = isPlaying ? colors.teal : isLoading ? colors.gold : colors.gold;

  return (
    <Pressable
      onLongPress={handleLong}
      delayLongPress={260}
      android_ripple={{ color: colors.line }}
      style={({ pressed }) => ({
        paddingVertical: 4,
        paddingHorizontal: 4,
        borderRadius: radius.md,
        backgroundColor: isPlaying ? colors.teal + "11" : "transparent",
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
        <Text variant="caption" color="muted" weight="600">{suraNumber}:{ayah.number}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.line, marginLeft: spacing.sm }} />
        {isPlaying ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 8 }}>
            <MaterialCommunityIcons name="waveform" size={12} color={colors.teal} />
            <Text variant="caption" color="teal" weight="700" style={{ letterSpacing: 0.4 }}>ИДЁТ</Text>
          </View>
        ) : isLoading ? (
          <ActivityIndicator size="small" color={colors.gold} style={{ marginLeft: 8 }} />
        ) : null}
      </View>

      {showArabic ? (
        <View style={{ flexDirection: "row-reverse", alignItems: "center", marginBottom: spacing.md, gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <ArabicText variant="arabicLarge" color="text" align="right" style={{ lineHeight: 78 }}>
              {ayah.arabic}
            </ArabicText>
          </View>
          <AyahMarker number={ayah.number} color={accentColor} />
        </View>
      ) : null}

      {showTransliteration && ayah.transliteration ? (
        <Text variant="bodySm" color="text" weight="600" style={{ marginBottom: spacing.xs, letterSpacing: 0.2 }}>
          {ayah.transliteration}
        </Text>
      ) : null}

      {showTranslation && ayah.translation ? (
        <Text variant="body" color="muted" style={{ lineHeight: 24 }}>
          {ayah.translation}
        </Text>
      ) : null}

      {explainOpen ? (
        <View
          style={{
            marginTop: spacing.sm,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.cardElevated,
            borderLeftWidth: 3,
            borderLeftColor: colors.gold,
          }}
        >
          {explainLoading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text variant="bodySm" color="muted">Думаю над аятом…</Text>
            </View>
          ) : explainError ? (
            <Text variant="bodySm" color="warning">Не удалось получить объяснение: {explainError}</Text>
          ) : explanation ? (
            <Text variant="bodySm" color="text" style={{ lineHeight: 22 }}>
              {explanation}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function BottomBar({ onPalette, onList, onReflection, onQari, activePanel }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 0, right: 0, bottom: spacing.lg, alignItems: "center" }}
    >
      <View
        style={{
          flexDirection: "row", alignItems: "center", gap: 4,
          backgroundColor: colors.cardStrong,
          borderRadius: 999, paddingHorizontal: 6, paddingVertical: 6,
          shadowColor: "#000", shadowOpacity: 0.32, shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 }, elevation: 10,
        }}
      >
        <ToolButton icon="format-list-bulleted" onPress={onList} active={activePanel === "list"} />
        <ToolButton icon="palette-outline" onPress={onPalette} active={activePanel === "settings"} />
        <ToolButton icon="account-music-outline" onPress={onQari} active={activePanel === "qari"} />
        <ToolButton icon="lightbulb-on-outline" onPress={onReflection} active={activePanel === "reflection"} />
      </View>
    </View>
  );
}

function ToolButton({ icon, onPress, active }) {
  const { colors } = useTheme();
  const color = active ? colors.gold : colors.text;
  return (
    <PressScale
      onPress={onPress}
      haptic="light"
      scale={0.9}
      fullWidth={false}
      style={{
        width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 999,
        backgroundColor: active ? colors.cardElevated : "transparent",
      }}
    >
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </PressScale>
  );
}

function SheetShell({ visible, onClose, title, subtitle, children, heightFrac = 0.7 }) {
  const { colors, spacing, radius } = useTheme();
  const slide = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(slide, {
        toValue: 1,
        stiffness: 180, damping: 22, mass: 0.95,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(slide, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, slide, mounted]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [700, 0] });
  const opacity = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });

  return (
    <RNModal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000", opacity }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            height: `${Math.round(heightFrac * 100)}%`,
            backgroundColor: colors.bg,
            borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
            transform: [{ translateY }],
            paddingTop: spacing.md, paddingBottom: spacing.lg,
            shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 36,
            shadowOffset: { width: 0, height: -10 }, elevation: 26,
          }}
        >
          <View style={{ width: 56, height: 5, alignSelf: "center", borderRadius: 999, backgroundColor: colors.lineStrong, marginBottom: spacing.md }} />
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingTop: 6 }}>
              {subtitle ? (
                <Text variant="caption" color="muted" style={{ letterSpacing: 1.4, textTransform: "uppercase" }}>{subtitle}</Text>
              ) : null}
              <Text variant="h2" color="text" weight="700" serif style={{ marginTop: 2 }}>{title}</Text>
            </View>
            <PressScale
              onPress={onClose}
              haptic="light"
              scale={0.92}
              fullWidth={false}
              hitSlop={12}
              wrapperStyle={{ marginTop: 14 }}
              style={{ width: 38, height: 38, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardElevated, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.text} />
            </PressScale>
          </View>
          <View style={{ flex: 1 }}>{children}</View>
        </Animated.View>
      </View>
    </RNModal>
  );
}

function SuraSheet({ visible, onClose, activeSura, onSelect }) {
  const { colors, spacing, radius, fonts } = useTheme();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) setQuery("");
  }, [visible]);

  const ranked = useMemo(() => {
    const q = query.trim();
    if (!q) return surahs;
    return surahs
      .map((item) => {
        const score = Math.max(
          similarityScore(q, item.russianName),
          similarityScore(q, item.translation),
          /^\d+$/.test(q) && String(item.number) === q ? 2000 : 0,
          /^\d+$/.test(q) && String(item.number).startsWith(q) ? 900 : 0
        );
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  }, [query]);

  return (
    <SheetShell visible={visible} onClose={onClose} title="Выбор суры" subtitle="Навигация" heightFrac={0.82}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <View
          style={{
            flexDirection: "row", alignItems: "center", marginBottom: spacing.sm,
            backgroundColor: colors.cardElevated, borderRadius: radius.lg,
            paddingHorizontal: spacing.md, height: 46,
            shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
          }}
        >
          <MaterialCommunityIcons name="magnify" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Найти суру или номер"
            placeholderTextColor={colors.mutedSoft}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              flex: 1, marginLeft: 8, color: colors.text, fontSize: 15,
              fontFamily: fonts.body, paddingVertical: 0,
            }}
          />
          {query ? (
            <PressScale onPress={() => setQuery("")} haptic="light" scale={0.92} fullWidth={false} hitSlop={8} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="close-circle" size={16} color={colors.mutedSoft} />
            </PressScale>
          ) : null}
        </View>
      </View>

      <FlatList
        data={ranked}
        style={{ flex: 1 }}
        keyExtractor={(item) => `picker-${item.number}`}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing["2xl"] }}
        initialNumToRender={20}
        keyboardShouldPersistTaps="handled"
        getItemLayout={(_, index) => ({ length: 76, offset: 76 * index, index })}
        initialScrollIndex={query ? 0 : Math.max(0, (activeSura ?? 1) - 3)}
        onScrollToIndexFailed={() => {}}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: spacing.xl }}>
            <Text variant="body" color="muted">Ничего не найдено</Text>
          </View>
        }
        renderItem={({ item }) => {
          const active = item.number === activeSura;
          return (
            <PressScale
              onPress={() => onSelect(item.number)}
              haptic="selection"
              scale={0.985}
              style={{
                marginBottom: 6,
                paddingVertical: 12, paddingHorizontal: spacing.md,
                flexDirection: "row", alignItems: "center", gap: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: active ? colors.gold + "1A" : colors.cardElevated,
                shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
              }}
            >
              <View style={{ width: 38, alignItems: "center", justifyContent: "center" }}>
                <Text serif weight="700" color={active ? "gold" : "muted"} style={{ fontSize: 18, lineHeight: 22, letterSpacing: 0.4 }}>
                  {item.number}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" color="text" weight={active ? "700" : "600"}>{item.russianName}</Text>
                <Text variant="caption" color="muted" style={{ marginTop: 2 }}>{item.translation} · {item.ayahCount} аят{item.ayahCount < 5 ? "а" : "ов"}</Text>
              </View>
              <ArabicText fontKey="naskh" tajweed={false} variant="arabic" color={active ? "gold" : "text"} style={{ fontSize: 19, lineHeight: 28 }}>
                {item.arabicName.replace("سُورَةُ ", "")}
              </ArabicText>
            </PressScale>
          );
        }}
      />
    </SheetShell>
  );
}

function SettingsSheet({ visible, onClose, settings }) {
  const { colors, spacing } = useTheme();
  const themeOptions = [
    { value: "system", label: "Авто" },
    { value: "light", label: "Свет" },
    { value: "dark", label: "Тёмная" },
  ];

  return (
    <SheetShell visible={visible} onClose={onClose} title="Отображение" subtitle="Чтение" heightFrac={0.6}>
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <View>
          <Text variant="caption" color="muted" style={{ textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>Тема</Text>
          <SegmentedControl value={settings.themeMode} onChange={settings.setTheme} options={themeOptions} />
        </View>

        <View>
          <Text variant="caption" color="muted" style={{ textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 8 }}>Арабский шрифт</Text>
          <SegmentedControl
            value={settings.arabicFont}
            onChange={settings.setArabicFont}
            options={Object.values(ARABIC_FONTS).map((f) => ({ value: f.id, label: f.label.split(" ")[0] }))}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text variant="caption" color="muted" style={{ textTransform: "uppercase", letterSpacing: 1.4 }}>Показывать</Text>
          <SettingRow
            label="Арабский"
            value={settings.quranDisplay?.showArabic !== false}
            onChange={(v) => settings.setQuranDisplay({ showArabic: v })}
          />
          <SettingRow
            label="Перевод"
            value={settings.quranDisplay?.showTranslation !== false}
            onChange={(v) => settings.setQuranDisplay({ showTranslation: v })}
          />
          <SettingRow
            label="Транскрипция"
            value={settings.quranDisplay?.showTransliteration !== false}
            onChange={(v) => settings.setQuranDisplay({ showTransliteration: v })}
          />
        </View>
      </View>
    </SheetShell>
  );
}

function SettingRow({ label, value, onChange }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
      <Text variant="body" color="text">{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const TAJWEED_LEGEND = [
  { color: "#D4734A", title: "Калькаля", body: "Эхо звонкого согласного: ق ط ب ج د с сукуном — отскок звука." },
  { color: "#9F73D9", title: "Гунна", body: "Назальный гул на ن и م с ташдидом, длительность ≈ 2 счёта." },
  { color: "#5BA4D4", title: "Мадд (долгота)", body: "Растянутый гласный 2–6 счётов: ا ، و ، ي после соотв. огласовки." },
  { color: "#7AB87A", title: "Идгам/иклаб/ихфа", body: "Преобразование тануина и нун-сакин: слияние, замена на م, лёгкое назальное скрытие." },
  { color: "#A8A8A8", title: "Тихие буквы", body: "Не озвучиваются — например, ا в конце глагола после 1-го лица мн.ч." },
];

function ReflectionSheet({ visible, onClose }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <SheetShell visible={visible} onClose={onClose} title="Цвета таджвида" subtitle="Отражение" heightFrac={0.78}>
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flex: 1 }}>
        <Text variant="bodySm" color="muted" style={{ marginBottom: spacing.md, lineHeight: 21 }}>
          Когда читаешь, разноцветные буквы — это правила таджвида. Каждый цвет означает, как звучит отрывок.
        </Text>
        <FlatList
          data={TAJWEED_LEGEND}
          keyExtractor={(it) => it.title}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row", alignItems: "flex-start", gap: spacing.md,
                padding: spacing.md, borderRadius: radius.lg,
                backgroundColor: colors.cardElevated,
                shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
              }}
            >
              <View
                style={{
                  width: 14, height: 14, borderRadius: 999, marginTop: 5,
                  backgroundColor: item.color,
                  shadowColor: item.color, shadowOpacity: 0.55, shadowRadius: 6,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text variant="body" color="text" weight="700">{item.title}</Text>
                <Text variant="caption" color="muted" style={{ marginTop: 4, lineHeight: 19 }}>
                  {item.body}
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    </SheetShell>
  );
}

function QariSheet({ visible, activeId, onSelect, onClose }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <SheetShell visible={visible} onClose={onClose} title="Выбор кари" subtitle="Чтец" heightFrac={0.72}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing["3xl"], gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {QARIS.map((q) => {
          const active = q.id === activeId;
          return (
            <PressScale
              key={q.id}
              onPress={() => onSelect(q.id)}
              haptic="medium"
              scale={0.985}
              style={{
                paddingHorizontal: spacing.md, paddingVertical: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: active ? colors.gold + "1A" : colors.cardElevated,
                flexDirection: "row", alignItems: "flex-start", gap: spacing.md,
                shadowColor: active ? colors.gold : "#000",
                shadowOpacity: active ? 0.18 : 0.06,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <View
                style={{
                  width: 40, height: 40, borderRadius: 999,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: active ? colors.gold : colors.card,
                  marginTop: 2,
                }}
              >
                <MaterialCommunityIcons name="account-music-outline" size={20} color={active ? colors.textInverse : colors.text} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="body" color="text" weight={active ? "700" : "600"} style={{ flexShrink: 1 }}>{q.name}</Text>
                <Text variant="caption" color="muted" style={{ marginTop: 2 }}>{q.accent}</Text>
              </View>
              {active ? (
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.gold} style={{ marginTop: 12 }} />
              ) : null}
            </PressScale>
          );
        })}
      </ScrollView>
    </SheetShell>
  );
}
