import React, { useEffect, useMemo, useRef } from "react";
import { Animated, View, Easing } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText, Defs, RadialGradient, Stop } from "react-native-svg";
import { useTheme } from "../theme";
import { Text } from "./Text";
import { normalizeAngle } from "../utils/angles";

const SIZE = 280;
const CENTER = SIZE / 2;
const OUTER_RADIUS = CENTER - 12;
const INNER_RADIUS = OUTER_RADIUS - 30;

const CARDINALS = [
  { label: "N", angle: 0 },
  { label: "E", angle: 90 },
  { label: "S", angle: 180 },
  { label: "W", angle: 270 },
];

export function Compass({ heading, qiblaBearing, relativeAngle, aligned }) {
  const { colors } = useTheme();
  const needleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const displayRelativeRef = useRef(0);
  const ticks = useMemo(
    () =>
      Array.from({ length: 72 }).map((_, i) => {
        const angle = (i * 360) / 72;
        const major = i % 9 === 0;
        const len = major ? 14 : 6;
        const rad = (angle * Math.PI) / 180;
        const x1 = CENTER + (OUTER_RADIUS - 4) * Math.sin(rad);
        const y1 = CENTER - (OUTER_RADIUS - 4) * Math.cos(rad);
        const x2 = CENTER + (OUTER_RADIUS - 4 - len) * Math.sin(rad);
        const y2 = CENTER - (OUTER_RADIUS - 4 - len) * Math.cos(rad);
        return {
          key: i,
          x1,
          y1,
          x2,
          y2,
          stroke: major ? colors.gold : colors.muted,
          strokeWidth: major ? 2 : 1,
          strokeOpacity: major ? 0.95 : 0.45,
        };
      }),
    [colors.gold, colors.muted]
  );

  const cardinals = useMemo(
    () =>
      CARDINALS.map((c) => {
        const rad = (c.angle * Math.PI) / 180;
        const x = CENTER + (INNER_RADIUS - 18) * Math.sin(rad);
        const y = CENTER - (INNER_RADIUS - 18) * Math.cos(rad) + 6;
        return {
          ...c,
          x,
          y,
          fill: c.angle === 0 ? colors.gold : colors.muted,
          fontSize: c.angle === 0 ? 18 : 14,
        };
      }),
    [colors.gold, colors.muted]
  );

  // Ring stays static — N/S/E/W labels fixed on screen
  // Only the needle rotates to show direction to Kaaba relative to phone top

  useEffect(() => {
    if (relativeAngle == null) return;
    const current = displayRelativeRef.current;
    let delta = relativeAngle - normalizeAngle(current);
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    if (Math.abs(delta) < 0.5) return;
    const next = current + delta;
    displayRelativeRef.current = next;
    Animated.timing(needleAnim, {
      toValue: next,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [relativeAngle, needleAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const needleRotate = needleAnim.interpolate({
    inputRange: [-720, 720],
    outputRange: ["-720deg", "720deg"],
  });

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, aligned ? 0.85 : 0.55] });

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          backgroundColor: aligned ? colors.success : colors.gold,
          opacity: pulseOpacity,
          transform: [{ scale: pulseScale }],
        }}
      />

      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <RadialGradient id="ringGradient" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={colors.cardStrong} stopOpacity="0.95" />
              <Stop offset="1" stopColor={colors.bg} stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS} fill="url(#ringGradient)" stroke={colors.line} strokeWidth={1} />
          <Circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="none" stroke={colors.line} strokeWidth={1} />

          {ticks.map((tick) => (
            <Line
              key={tick.key}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={tick.stroke}
              strokeWidth={tick.strokeWidth}
              strokeOpacity={tick.strokeOpacity}
            />
          ))}

          {cardinals.map((c) => (
            <SvgText
              key={c.label}
              x={c.x}
              y={c.y}
              fill={c.fill}
              fontSize={c.fontSize}
              fontWeight="700"
              textAnchor="middle"
            >
              {c.label}
            </SvgText>
          ))}
        </Svg>
      </View>

      <Animated.View
        style={{
          position: "absolute",
          width: SIZE,
          height: SIZE,
          transform: [{ rotate: needleRotate }],
        }}
      >
        <Svg width={SIZE} height={SIZE}>
          <Path
            d={`M ${CENTER} ${CENTER - INNER_RADIUS + 8} L ${CENTER - 14} ${CENTER + 4} L ${CENTER} ${CENTER - 14} L ${CENTER + 14} ${CENTER + 4} Z`}
            fill={aligned ? colors.success : colors.gold}
            stroke={colors.cardStrong}
            strokeWidth={1.5}
          />
          <Circle cx={CENTER} cy={CENTER - INNER_RADIUS + 24} r={6} fill={aligned ? colors.success : colors.gold} />
        </Svg>
      </Animated.View>

      <View
        style={{
          position: "absolute",
          width: 80,
          height: 80,
          borderRadius: 999,
          backgroundColor: colors.cardElevated,
          borderWidth: 1,
          borderColor: colors.line,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text variant="bodySm" color="muted" weight="500">
          {qiblaBearing != null ? `${Math.round(qiblaBearing)}°` : "--°"}
        </Text>
        <Text variant="caption" color="gold" weight="600" style={{ marginTop: 2, letterSpacing: 1 }}>
          КИБЛА
        </Text>
      </View>
    </View>
  );
}
