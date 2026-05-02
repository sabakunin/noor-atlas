import React, { useEffect, useRef, useState } from "react";
import { Modal as RNModal, View, Pressable, Animated, Easing, TextInput, Platform, KeyboardAvoidingView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { Text } from "./Text";
import { PressScale } from "./motion/PressScale";
import { ArabicText } from "./ArabicText";

const ACTION_HEIGHT = 64;

export function AyahActionSheet({
  visible,
  onClose,
  title,
  subtitle,
  arabicPreview,
  actions = [],
  bookmarkInput,
  onSubmitBookmark,
}) {
  const { colors, spacing, radius } = useTheme();
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    if (visible) {
      slide.setValue(0);
      fade.setValue(0);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 1, stiffness: 220, damping: 22, mass: 0.8, useNativeDriver: true }),
      ]).start();
    } else {
      setShowInput(false);
      setName("");
    }
  }, [visible, slide, fade]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => onClose?.());
  }

  function handleSave() {
    onSubmitBookmark?.(name.trim());
    handleClose();
  }

  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", opacity: fade }}>
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
        pointerEvents="box-none"
      >
      <Animated.View
        style={{
          paddingHorizontal: spacing.md, paddingBottom: spacing.lg,
          transform: [{
            translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [320, 0] }),
          }],
        }}
      >
        <View
          style={{
            backgroundColor: colors.bg,
            borderRadius: radius.xl,
            borderWidth: 1, borderColor: colors.line,
            paddingVertical: spacing.md, paddingHorizontal: spacing.md,
            shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 22, shadowOffset: { width: 0, height: 8 },
            elevation: 14,
          }}
        >
          <View style={{ width: 44, height: 4, alignSelf: "center", borderRadius: 999, backgroundColor: colors.lineStrong, marginBottom: spacing.sm }} />

          <View style={{ paddingHorizontal: spacing.xs, paddingBottom: spacing.sm }}>
            <Text variant="caption" color="muted" style={{ letterSpacing: 0.6 }}>{subtitle}</Text>
            <Text variant="body" color="text" weight="700" style={{ marginTop: 2 }}>{title}</Text>
            {arabicPreview ? (
              <ArabicText
                variant="arabic"
                color="muted"
                align="right"
                style={{ marginTop: 6, fontSize: 18, lineHeight: 30 }}
              >
                {arabicPreview.length > 60 ? arabicPreview.slice(0, 60) + "…" : arabicPreview}
              </ArabicText>
            ) : null}
          </View>

          {showInput ? (
            <View
              style={{
                marginTop: 4,
                flexDirection: "row", alignItems: "center",
                backgroundColor: colors.card,
                borderRadius: radius.md,
                borderWidth: 1, borderColor: colors.line,
                paddingHorizontal: spacing.md,
                height: 50,
              }}
            >
              <MaterialCommunityIcons name="bookmark-plus-outline" size={18} color={colors.gold} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Имя закладки"
                placeholderTextColor={colors.mutedSoft}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
                style={{
                  flex: 1, marginLeft: 10,
                  color: colors.text, fontSize: 15,
                  paddingVertical: 0, height: 24,
                  ...(Platform.OS === "android" ? { textAlignVertical: "center" } : {}),
                }}
              />
              <PressScale onPress={handleSave} haptic="success" scale={0.94} fullWidth={false}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.gold }}>
                <Text variant="caption" color="textInverse" weight="700" style={{ letterSpacing: 0.4 }}>Сохранить</Text>
              </PressScale>
            </View>
          ) : (
            <View>
              {actions.map((a, i) => (
                <PressScale
                  key={a.key ?? i}
                  onPress={() => {
                    if (a.key === "bookmark" && bookmarkInput) {
                      setShowInput(true);
                      return;
                    }
                    handleClose();
                    setTimeout(() => a.onPress?.(), 180);
                  }}
                  haptic={a.haptic ?? "selection"}
                  scale={0.98}
                  style={{
                    height: ACTION_HEIGHT,
                    flexDirection: "row", alignItems: "center", gap: spacing.md,
                    paddingHorizontal: spacing.md,
                    borderTopWidth: i === 0 ? 1 : 0,
                    borderTopColor: colors.line,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.line,
                  }}
                >
                  <View
                    style={{
                      width: 38, height: 38, borderRadius: 999,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: a.tint ?? colors.cardElevated,
                    }}
                  >
                    <MaterialCommunityIcons name={a.icon} size={20} color={a.iconColor ?? colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" color="text" weight="600">{a.label}</Text>
                    {a.hint ? (
                      <Text variant="caption" color="muted" style={{ marginTop: 1 }}>{a.hint}</Text>
                    ) : null}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.mutedSoft} />
                </PressScale>
              ))}
            </View>
          )}

          <PressScale
            onPress={handleClose}
            haptic="light"
            scale={0.97}
            style={{
              marginTop: spacing.md,
              height: 50,
              alignItems: "center", justifyContent: "center",
              borderRadius: radius.md,
              backgroundColor: colors.card,
            }}
          >
            <Text variant="body" color="text" weight="600">Отмена</Text>
          </PressScale>
        </View>
      </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
