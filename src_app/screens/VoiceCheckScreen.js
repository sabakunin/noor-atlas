import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, Animated, Easing, ActivityIndicator, Pressable, FlatList, TextInput, Dimensions } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal } from "../components/Modal";
import { Text } from "../components/Text";
import { ArabicText } from "../components/ArabicText";
import { Switch } from "../components/Switch";
import { PressScale } from "../components/motion/PressScale";
import { useTheme } from "../theme";
import { surahs, getSura } from "../services/quran";
import { checkRecitation } from "../services/ai";

const CHUNK_MS = 2000;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function tokenize(arabic) {
  return arabic.split(/\s+/).filter(Boolean);
}

function humanizeError(raw) {
  if (!raw) return "Что-то пошло не так";
  const s = String(raw);
  if (/HTTP 429/i.test(s)) return "Лимит исчерпан — добавь свой ключ в Настройках";
  if (/HTTP 401|HTTP 403/i.test(s)) return "Ключ API недействителен — проверь в Настройках";
  if (/HTTP 4\d\d/i.test(s)) return "API недоступен — попробуй позже";
  if (/HTTP 5\d\d/i.test(s)) return "Сервер занят — повторим автоматически";
  if (/network/i.test(s)) return "Нет связи — проверь интернет";
  if (/audio/i.test(s) || /record/i.test(s) || /no such file/i.test(s)) return null;
  return s;
}

function similarityScore(query, name) {
  const q = query.toLowerCase().trim();
  const n = name.toLowerCase();
  if (!q) return 0;
  if (n === q) return 1000;
  if (n.startsWith(q)) return 800 - n.length;
  if (n.includes(q)) return 500 - n.indexOf(q);
  return 0;
}

function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
function hapticWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
function hapticSelect() {
  Haptics.selectionAsync().catch(() => {});
}

export function VoiceCheckScreen({ visible, onClose }) {
  const [step, setStep] = useState("pickSura");
  const [suraNumber, setSuraNumber] = useState(1);
  const [hideHints, setHideHints] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStep("pickSura");
    }
  }, [visible]);

  return (
    <Modal visible={visible} onClose={onClose} title={step === "pickSura" ? "Проверка чтения" : null} scroll={false}>
      {step === "pickSura" ? (
        <SuraPicker
          activeSura={suraNumber}
          onPick={(n) => {
            setSuraNumber(n);
            hapticMedium();
            setStep("reciter");
          }}
        />
      ) : (
        <Reciter
          suraNumber={suraNumber}
          hideHints={hideHints}
          onToggleHints={() => setHideHints((v) => !v)}
          onChangeSura={() => setStep("pickSura")}
        />
      )}
    </Modal>
  );
}

function SuraPicker({ activeSura, onPick }) {
  const { colors, spacing, radius, fonts } = useTheme();
  const [query, setQuery] = useState("");

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
    <View style={{ flex: 1 }}>
      <Text variant="bodySm" color="muted" style={{ marginBottom: spacing.sm, lineHeight: 18 }}>
        Выбери суру. Затем читай аят за аятом — ИИ строго сверит произношение и подсветит то, что прочитал верно.
      </Text>

      <View
        style={{
          flexDirection: "row", alignItems: "center",
          backgroundColor: colors.cardElevated, borderRadius: radius.lg,
          paddingHorizontal: spacing.md, height: 48, marginBottom: spacing.sm,
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
          <PressScale onPress={() => { setQuery(""); hapticSelect(); }} haptic="light" scale={0.92} fullWidth={false} hitSlop={8} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="close-circle" size={16} color={colors.mutedSoft} />
          </PressScale>
        ) : null}
      </View>

      <FlatList
        data={ranked}
        keyExtractor={(it) => `vc-sura-${it.number}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: spacing.xl }}>
            <Text variant="body" color="muted">Ничего не найдено</Text>
          </View>
        }
        renderItem={({ item }) => {
          const active = item.number === activeSura;
          return (
            <PressScale
              onPress={() => onPick(item.number)}
              haptic="selection"
              scale={0.985}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                paddingVertical: 12,
                paddingHorizontal: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: active ? colors.gold + "1A" : colors.cardElevated,
                shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
              }}
            >
              <View style={{ width: 36, alignItems: "center" }}>
                <Text serif weight="700" color={active ? "gold" : "muted"} style={{ fontSize: 18, lineHeight: 22 }}>
                  {item.number}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" color="text" weight={active ? "700" : "600"}>{item.russianName}</Text>
                <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
                  {item.translation} · {item.ayahCount} аят{item.ayahCount < 5 ? "а" : "ов"}
                </Text>
              </View>
              <ArabicText fontKey="naskh" tajweed={false} variant="arabic" color={active ? "gold" : "text"} style={{ fontSize: 19, lineHeight: 28 }}>
                {item.arabicName.replace("سُورَةُ ", "")}
              </ArabicText>
            </PressScale>
          );
        }}
      />
    </View>
  );
}

function ProgressRing({ progress, size = 132, stroke = 6, color, trackColor }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = useRef(new Animated.Value(c)).current;

  useEffect(() => {
    const target = c * (1 - Math.max(0, Math.min(1, progress)));
    Animated.timing(dash, { toValue: target, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress, c, dash]);

  return (
    <Svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" opacity={0.25} />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={dash}
        rotation={-90}
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

function MicWave({ active, color }) {
  const waves = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) {
      waves.forEach((v) => v.setValue(0));
      return;
    }
    const loops = waves.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 600),
          Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [active, waves]);

  if (!active) return null;
  return (
    <>
      {waves.map((v, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 132, height: 132, borderRadius: 999,
            borderWidth: 2,
            borderColor: color,
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
          }}
        />
      ))}
    </>
  );
}

function Token({ text, matched, active, hideHints, font }) {
  const opacity = useRef(new Animated.Value(matched ? 1 : 0.55)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const wasMatched = useRef(matched);

  useEffect(() => {
    if (matched && !wasMatched.current) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.18, duration: 150, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
        Animated.spring(scale, { toValue: 1, stiffness: 220, damping: 14, useNativeDriver: true }),
      ]).start();
      wasMatched.current = true;
    } else if (!matched && wasMatched.current) {
      Animated.timing(opacity, { toValue: active ? 0.78 : 0.55, duration: 200, useNativeDriver: true }).start();
      wasMatched.current = false;
    } else if (!matched) {
      opacity.setValue(active ? 0.78 : 0.55);
    }
  }, [matched, active, scale, opacity]);

  const visible = !hideHints || matched;
  return (
    <Animated.View style={{ opacity: visible ? opacity : new Animated.Value(0.05), transform: [{ scale }] }}>
      <ArabicText
        fontKey={font}
        variant="arabic"
        color={matched ? "gold" : (active ? "text" : "muted")}
        style={{ fontSize: 28, lineHeight: 50 }}
      >
        {visible ? text : "•••"}
      </ArabicText>
    </Animated.View>
  );
}

function AyahCard({ sura, item, index, active, matched, errs, hideHints, onPress, onReset }) {
  const { colors, spacing, radius } = useTheme();
  const toks = useMemo(() => tokenize(item.arabic), [item.arabic]);
  const allOk = toks.length > 0 && matched.size >= toks.length;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fade, { toValue: 1, stiffness: 140, damping: 18, mass: 0.85, delay: Math.min(index, 5) * 40, useNativeDriver: true }).start();
  }, [fade, index]);

  return (
    <Animated.View
      style={{
        opacity: fade,
        transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        marginBottom: 8,
      }}
    >
      <Pressable
        onPress={onPress}
        style={{
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: active ? colors.gold + "14" : colors.cardElevated,
          shadowColor: active ? colors.gold : "#000",
          shadowOpacity: active ? 0.22 : 0.05,
          shadowRadius: active ? 14 : 6,
          shadowOffset: { width: 0, height: active ? 5 : 2 },
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
          <View
            style={{
              width: 26, height: 26, borderRadius: 999,
              alignItems: "center", justifyContent: "center",
              backgroundColor: active ? colors.gold : colors.card,
            }}
          >
            <Text variant="caption" color={active ? "textInverse" : "muted"} weight="700" style={{ fontSize: 11 }}>
              {item.number}
            </Text>
          </View>
          <Text variant="caption" color="muted" weight="600">
            {sura.number}:{item.number}
          </Text>
          {active ? (
            <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.gold }}>
              <Text variant="caption" color="textInverse" weight="700" style={{ letterSpacing: 0.5 }}>
                ЧИТАЙ
              </Text>
            </View>
          ) : null}
          {allOk ? (
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
          ) : null}
          <View style={{ flex: 1 }} />
          {active && matched.size > 0 ? (
            <PressScale onPress={onReset} haptic="light" scale={0.9} fullWidth={false} hitSlop={8} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="restart" size={16} color={colors.muted} />
            </PressScale>
          ) : null}
        </View>

        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, alignItems: "baseline" }}>
          {toks.map((tok, i) => (
            <Token
              key={`${item.number}-${i}`}
              text={tok}
              matched={matched.has(i)}
              active={active}
              hideHints={hideHints}
              font="naskh"
            />
          ))}
        </View>

        {item.translation ? (
          <Text variant="caption" color="muted" style={{ marginTop: 8, lineHeight: 18 }}>
            {item.translation}
          </Text>
        ) : null}

        {active && errs.length > 0 ? (
          <View style={{ marginTop: 10, gap: 4, padding: 8, borderRadius: 10, backgroundColor: colors.warning + "14" }}>
            {errs.slice(0, 4).map((e, k) => (
              <View key={k} style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
                <MaterialCommunityIcons name="alert-circle-outline" size={12} color={colors.warning} style={{ marginTop: 2 }} />
                <Text variant="caption" color="warning" style={{ flex: 1, lineHeight: 16 }}>
                  слово {(e.i ?? 0) + 1}: {e.hint}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function Reciter({ suraNumber, hideHints, onToggleHints, onChangeSura }) {
  const { colors, spacing, radius } = useTheme();
  const sura = useMemo(() => getSura(suraNumber), [suraNumber]);
  const [activeAyah, setActiveAyah] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [matchedByAyah, setMatchedByAyah] = useState({});
  const [errorsByAyah, setErrorsByAyah] = useState({});
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const recordingRef = useRef(null);
  const matchedRef = useRef([]);
  const cycleRef = useRef(null);
  const stopFlagRef = useRef(false);
  const chunkBusyRef = useRef(false);
  const breath = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const flatRef = useRef(null);
  const prevMatchedSize = useRef(0);

  // Idle breath animation (always-on subtle pulsing)
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  const ayah = sura?.ayahs?.[activeAyah] ?? null;
  const reference = ayah?.arabic ?? "";
  const tokens = useMemo(() => tokenize(reference), [reference]);
  const matchedSet = matchedByAyah[activeAyah] ?? new Set();
  const errorsForAyah = errorsByAyah[activeAyah] ?? [];
  const progress = tokens.length > 0 ? matchedSet.size / tokens.length : 0;

  const setMatchedFor = useCallback((idx, set) => {
    setMatchedByAyah((prev) => ({ ...prev, [idx]: set }));
  }, []);
  const setErrorsFor = useCallback((idx, errs) => {
    setErrorsByAyah((prev) => ({ ...prev, [idx]: errs }));
  }, []);

  // haptic feedback when new words match
  useEffect(() => {
    const size = matchedSet.size;
    const prev = prevMatchedSize.current;
    if (size > prev && prev > 0) {
      hapticLight();
    } else if (size > prev && prev === 0 && size > 0) {
      hapticLight();
    }
    if (tokens.length > 0 && size >= tokens.length && prev < tokens.length) {
      hapticSuccess();
    }
    prevMatchedSize.current = size;
  }, [matchedSet, tokens.length]);

  // haptic on new errors
  const prevErrCount = useRef(0);
  useEffect(() => {
    if (errorsForAyah.length > prevErrCount.current && errorsForAyah.length > 0) {
      hapticWarning();
    }
    prevErrCount.current = errorsForAyah.length;
  }, [errorsForAyah]);

  async function newRecording() {
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    return rec;
  }

  async function takeChunkAndCheck() {
    if (stopFlagRef.current) return;
    if (chunkBusyRef.current) return;
    const oldRec = recordingRef.current;
    if (!oldRec) return;
    chunkBusyRef.current = true;
    let uri = null;
    try {
      try {
        await oldRec.stopAndUnloadAsync();
        uri = oldRec.getURI();
      } catch {
        /* race: recorder already finalized — skip silently */
        chunkBusyRef.current = false;
        return;
      }
      if (!stopFlagRef.current) {
        try {
          recordingRef.current = await newRecording();
        } catch {
          recordingRef.current = null;
        }
      } else {
        recordingRef.current = null;
      }
      if (!uri) {
        chunkBusyRef.current = false;
        return;
      }
      let base64;
      try {
        base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      } catch {
        chunkBusyRef.current = false;
        return;
      }
      const mime = uri.endsWith(".m4a") ? "audio/m4a" : uri.endsWith(".mp3") ? "audio/mp3" : "audio/mp4";
      const result = await checkRecitation({
        arabicReference: reference,
        audioBase64: base64,
        mimeType: mime,
        alreadyMatched: matchedRef.current,
      });
      if (!result.ok) {
        if (!stopFlagRef.current) {
          const msg = humanizeError(result.error);
          if (msg) setError(msg);
        }
        return;
      }
      const newSet = new Set([...matchedRef.current, ...result.matched]);
      matchedRef.current = Array.from(newSet).sort((a, b) => a - b);
      setMatchedFor(activeAyah, newSet);
      setErrorsFor(activeAyah, result.errors);
      if (result.comment) setComment(result.comment);
      if (newSet.size >= tokens.length && sura && activeAyah < sura.ayahs.length - 1) {
        await stop();
        setTimeout(() => {
          setActiveAyah((idx) => Math.min(idx + 1, sura.ayahs.length - 1));
        }, 600);
      }
    } catch {
      /* swallow — race conditions during recorder swap are not user-facing */
    } finally {
      chunkBusyRef.current = false;
    }
  }

  async function start() {
    setError(null);
    setComment("");
    matchedRef.current = Array.from(matchedSet);
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError("Дай разрешение на микрофон");
        hapticWarning();
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      stopFlagRef.current = false;
      recordingRef.current = await newRecording();
      hapticMedium();
      Animated.sequence([
        Animated.timing(buttonScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
        Animated.spring(buttonScale, { toValue: 1, stiffness: 200, damping: 14, useNativeDriver: true }),
      ]).start();
      setIsRecording(true);
      // first chunk fires after CHUNK_MS so the user has time to start reading
      cycleRef.current = setInterval(() => {
        takeChunkAndCheck();
      }, CHUNK_MS);
    } catch (e) {
      setError(`Не удалось начать запись: ${e.message}`);
      hapticWarning();
    }
  }

  async function stop() {
    stopFlagRef.current = true;
    if (cycleRef.current) {
      clearInterval(cycleRef.current);
      cycleRef.current = null;
    }
    setIsRecording(false);
    hapticLight();
    const rec = recordingRef.current;
    recordingRef.current = null;
    if (rec) {
      rec.stopAndUnloadAsync().catch(() => {});
    }
  }

  function resetAyah() {
    matchedRef.current = [];
    setMatchedFor(activeAyah, new Set());
    setErrorsFor(activeAyah, []);
    setComment("");
    setError(null);
    prevMatchedSize.current = 0;
    hapticMedium();
  }

  useEffect(() => {
    return () => {
      stopFlagRef.current = true;
      if (cycleRef.current) clearInterval(cycleRef.current);
      const rec = recordingRef.current;
      recordingRef.current = null;
      if (rec) rec.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    matchedRef.current = Array.from(matchedByAyah[activeAyah] ?? []);
    prevMatchedSize.current = (matchedByAyah[activeAyah] ?? new Set()).size;
  }, [activeAyah]);

  if (!sura) return null;

  const breathScale = breath.interpolate({ inputRange: [0, 1], outputRange: isRecording ? [1, 1.06] : [1, 1.04] });
  const breathOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: isRecording ? [0.3, 0.5] : [0.18, 0.32] });
  const ringColor = isRecording ? colors.warning : colors.gold;

  return (
    <View style={{ flex: 1 }}>
      {/* Header — sura strip */}
      <View
        style={{
          flexDirection: "row", alignItems: "center", gap: spacing.sm,
          paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
          backgroundColor: colors.cardElevated, borderRadius: radius.lg,
          marginBottom: spacing.sm,
          shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
        }}
      >
        <PressScale onPress={() => { onChangeSura(); hapticSelect(); }} haptic="light" scale={0.93} fullWidth={false} hitSlop={6}
          style={{ width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold + "22" }}>
          <MaterialCommunityIcons name="format-list-bulleted" size={18} color={colors.gold} />
        </PressScale>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="muted" style={{ letterSpacing: 1.2, textTransform: "uppercase" }}>
            Сура {sura.number}
          </Text>
          <Text variant="body" color="text" weight="700">
            {sura.russianName}
          </Text>
        </View>
        <Pressable
          onPress={() => { onToggleHints(); hapticSelect(); }}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <MaterialCommunityIcons name={hideHints ? "eye-off-outline" : "eye-outline"} size={16} color={colors.muted} />
          <Switch value={hideHints} onValueChange={(v) => { onToggleHints(); hapticSelect(); }} />
        </Pressable>
      </View>

      {/* Mini progress for active ayah */}
      <View style={{ marginBottom: spacing.sm, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>
            АЯТ {activeAyah + 1} ИЗ {sura.ayahs.length}
          </Text>
          <Text variant="caption" color="gold" weight="700">
            {matchedSet.size} / {tokens.length}
          </Text>
        </View>
        <View style={{ height: 4, borderRadius: 999, backgroundColor: colors.line, overflow: "hidden" }}>
          <ProgressBar value={progress} color={colors.gold} />
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={sura.ayahs}
        keyExtractor={(item) => `vc-${sura.number}-${item.number}`}
        contentContainerStyle={{ paddingBottom: 260 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <AyahCard
            sura={sura}
            item={item}
            index={index}
            active={index === activeAyah}
            matched={matchedByAyah[index] ?? new Set()}
            errs={errorsByAyah[index] ?? []}
            hideHints={hideHints}
            onPress={() => {
              if (!isRecording) {
                setActiveAyah(index);
                hapticSelect();
              }
            }}
            onReset={resetAyah}
          />
        )}
      />

      {/* Comment toast */}
      {comment ? (
        <View style={{ position: "absolute", bottom: 220, left: spacing.lg, right: spacing.lg }}>
          <Toast text={comment} subtle={`${matchedSet.size} / ${tokens.length}`} colors={colors} radius={radius} spacing={spacing} />
        </View>
      ) : null}

      {error ? (
        <View style={{ position: "absolute", bottom: 195, left: spacing.lg, right: spacing.lg, alignItems: "center" }}>
          <View
            style={{
              flexDirection: "row", alignItems: "center", gap: 8,
              paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: 999,
              backgroundColor: colors.warning,
              shadowColor: colors.warning, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
              elevation: 6,
            }}
          >
            <MaterialCommunityIcons name="alert-circle" size={16} color="#FFFFFF" />
            <Text variant="caption" color="textInverse" weight="700" align="center" style={{ letterSpacing: 0.3 }}>{error}</Text>
          </View>
        </View>
      ) : null}

      {/* Mic dock with halo + progress ring */}
      <View style={{ position: "absolute", bottom: spacing.lg, left: 0, right: 0, alignItems: "center" }}>
        <Text variant="caption" color="muted" align="center" style={{ marginBottom: 12, paddingHorizontal: spacing.lg, letterSpacing: 0.3 }}>
          {busy
            ? "Финализирую..."
            : isRecording
            ? `Слушаю · проверка каждые ${CHUNK_MS / 1000}с`
            : "Нажми и читай аят"}
        </Text>

        <View style={{ width: 132, height: 132, alignItems: "center", justifyContent: "center" }}>
          {/* Breath halo */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 132, height: 132, borderRadius: 999,
              backgroundColor: ringColor,
              opacity: breathOpacity,
              transform: [{ scale: breathScale }],
            }}
          />

          {/* Outward ripple waves while recording */}
          <MicWave active={isRecording} color={ringColor} />

          {/* Progress ring */}
          <ProgressRing progress={progress} size={132} stroke={5} color={colors.gold} trackColor={colors.line} />

          {/* Main button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              disabled={busy}
              onPress={isRecording ? stop : start}
              style={{
                width: 96, height: 96, borderRadius: 999,
                alignItems: "center", justifyContent: "center",
                shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10,
              }}
            >
              <LinearGradient
                colors={isRecording ? [colors.warning, "#9c4b1a"] : [colors.gold, "#b48642"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: 999,
                }}
              />
              {busy ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <MaterialCommunityIcons
                  name={isRecording ? "stop" : "microphone"}
                  size={38}
                  color={colors.textInverse}
                />
              )}
            </Pressable>
          </Animated.View>
        </View>

        {/* progress dots */}
        <View style={{ flexDirection: "row", gap: 6, marginTop: 14 }}>
          {Array.from({ length: Math.min(tokens.length, 12) }).map((_, i) => {
            const matched = matchedSet.has(i);
            return (
              <View
                key={i}
                style={{
                  width: matched ? 10 : 6,
                  height: matched ? 10 : 6,
                  borderRadius: 999,
                  backgroundColor: matched ? colors.gold : colors.line,
                }}
              />
            );
          })}
          {tokens.length > 12 ? (
            <Text variant="caption" color="muted" style={{ marginLeft: 4 }}>+{tokens.length - 12}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ProgressBar({ value, color }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: Math.max(0, Math.min(1, value)), duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value, w]);
  return (
    <Animated.View
      style={{
        height: 4,
        backgroundColor: color,
        borderRadius: 999,
        width: w.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
      }}
    />
  );
}

function Toast({ text, subtle, colors, radius, spacing }) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.spring(fade, { toValue: 1, stiffness: 180, damping: 18, useNativeDriver: true }).start();
  }, [text, fade]);
  return (
    <Animated.View
      style={{
        opacity: fade,
        transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        backgroundColor: colors.gold,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        alignItems: "center",
        shadowColor: colors.gold, shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}
    >
      <Text variant="caption" color="textInverse" weight="700" align="center" style={{ letterSpacing: 0.3, fontSize: 13, lineHeight: 17 }}>
        {text}
      </Text>
      {subtle ? (
        <Text variant="caption" color="textInverse" align="center" style={{ marginTop: 3, letterSpacing: 0.6, opacity: 0.85, fontWeight: "600" }}>
          {subtle}
        </Text>
      ) : null}
    </Animated.View>
  );
}
