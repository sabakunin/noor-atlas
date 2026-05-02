import React, { useEffect, useRef, useState } from "react";
import { View, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Modal } from "../components/Modal";
import { Text } from "../components/Text";
import { Card } from "../components/Card";
import { useTheme } from "../theme";
import { getDayStats, getWeekStats, getMonthSummary, getCurrentStreak, TrackedPrayers } from "../services/statistics";
import { startOfWeek } from "../utils/time";
import { t } from "../i18n";

const DAY_LETTERS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function AnimatedNumber({ value, style, color = "text", serif = true, weight = "700", variant = "display" }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const id = anim.addListener(({ value: v }) => {
      setDisplay(Math.round(v * value));
    });
    return () => anim.removeListener(id);
  }, [value, anim]);

  return (
    <Text variant={variant} color={color} weight={weight} serif={serif} style={style}>
      {display}
    </Text>
  );
}

function AnimatedBar({ ratio, color, lineColor, height = 80, width = 30, radius = 8, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: ratio,
      duration: 700,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ratio, anim, delay]);

  const barHeight = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: lineColor,
        borderWidth: 1,
        borderColor: lineColor,
        overflow: "hidden",
        justifyContent: "flex-end",
      }}
    >
      <Animated.View style={{ height: barHeight, backgroundColor: color, opacity: ratio === 0 ? 0 : 0.92 }} />
    </View>
  );
}

function AnimatedProgressBar({ percent, gradient, baseColor }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(100, percent)) / 100,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent, anim]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View
      style={{
        marginTop: 14,
        height: 10,
        borderRadius: 999,
        backgroundColor: baseColor,
        overflow: "hidden",
      }}
    >
      <Animated.View style={{ width, height: "100%", borderRadius: 999, overflow: "hidden" }}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

function FadeUp({ delay = 0, children }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);
  const opacity = anim;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export function StatisticsScreen({ visible, onClose }) {
  const { colors, spacing, radius } = useTheme();
  const [today, setToday] = useState({});
  const [week, setWeek] = useState([]);
  const [month, setMonth] = useState({ completed: 0, possible: 0, percent: 0 });
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setToday(await getDayStats(new Date()));
      setWeek(await getWeekStats(startOfWeek()));
      setMonth(await getMonthSummary(new Date()));
      setStreak(await getCurrentStreak());
    })();
  }, [visible]);

  const todayCompleted = TrackedPrayers.reduce((acc, k) => acc + (today[k] ? 1 : 0), 0);

  return (
    <Modal visible={visible} onClose={onClose} title={t("statistics.title")}>
      <FadeUp delay={20}>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
          <Card style={{ flex: 1 }}>
            <Text variant="caption" color="muted" style={{ letterSpacing: 1.2, textTransform: "uppercase" }}>
              {t("statistics.today")}
            </Text>
            <AnimatedNumber value={todayCompleted} color="gold" style={{ marginTop: 6 }} />
            <Text variant="bodySm" color="muted" style={{ marginTop: 2 }}>
              {t("statistics.of", todayCompleted, TrackedPrayers.length)}
            </Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text variant="caption" color="muted" style={{ letterSpacing: 1.2, textTransform: "uppercase" }}>
              {t("statistics.streak")}
            </Text>
            <AnimatedNumber value={streak} color="text" style={{ marginTop: 6 }} />
            <Text variant="bodySm" color="muted" style={{ marginTop: 2 }}>
              {t("statistics.days", streak)}
            </Text>
          </Card>
        </View>
      </FadeUp>

      <FadeUp delay={120}>
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="caption" color="muted" style={{ letterSpacing: 1.2, textTransform: "uppercase", marginBottom: spacing.sm }}>
            {t("statistics.thisWeek")}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            {week.map((day, i) => {
              const completed = TrackedPrayers.reduce((acc, k) => acc + (day.stats[k] ? 1 : 0), 0);
              const ratio = completed / TrackedPrayers.length;
              return (
                <View key={i} style={{ alignItems: "center", flex: 1 }}>
                  <AnimatedBar
                    ratio={ratio}
                    color={ratio === 1 ? colors.success : colors.gold}
                    lineColor={colors.cardElevated}
                    radius={radius.sm}
                    delay={150 + i * 70}
                  />
                  <Text variant="caption" color="muted" style={{ marginTop: 6 }}>
                    {DAY_LETTERS[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      </FadeUp>

      <FadeUp delay={220}>
        <Card style={{ marginBottom: spacing.md }}>
          <Text variant="caption" color="muted" style={{ letterSpacing: 1.2, textTransform: "uppercase" }}>
            {t("statistics.thisMonth")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6 }}>
            <AnimatedNumber value={month.percent} variant="display" color="text" style={{}} />
            <Text variant="bodySm" color="muted">
              {t("statistics.of", month.completed, month.possible)}
            </Text>
          </View>
          <AnimatedProgressBar
            percent={month.percent}
            gradient={colors.goldGradient}
            baseColor={colors.cardElevated}
          />
        </Card>
      </FadeUp>

      <FadeUp delay={320}>
        <Text variant="bodySm" color="muted" align="center" style={{ marginTop: spacing.md }}>
          Чтобы отметить намаз — открой главный экран и нажми на чек у нужной молитвы
        </Text>
      </FadeUp>
    </Modal>
  );
}
