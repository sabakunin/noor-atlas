import React, { useEffect, useState } from "react";
import { Modal as RNModal, View, Pressable, ScrollView, StatusBar, Keyboard, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { Text } from "./Text";
import { PressScale } from "./motion/PressScale";

export function Modal({ visible, onClose, title, children, scroll = true, fullScreen = false }) {
  const { colors, scheme, spacing, radius } = useTheme();
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = (e) => setKbHeight(e?.endCoordinates?.height ?? 0);
    const onHide = () => setKbHeight(0);
    const subShow = Keyboard.addListener(showEvt, onShow);
    const subHide = Keyboard.addListener(hideEvt, onHide);
    return () => { subShow.remove(); subHide.remove(); };
  }, []);
  return (
    <RNModal visible={visible} animationType="slide" presentationStyle="overFullScreen" transparent onRequestClose={onClose}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
      <View style={{ flex: 1, backgroundColor: fullScreen ? colors.bg : "rgba(0,0,0,0.55)" }}>
        {fullScreen ? null : <Pressable style={{ flex: 1 }} onPress={onClose} />}
        <View
          style={{
            backgroundColor: colors.bg,
            ...(fullScreen
              ? { flex: 1, paddingTop: 0 }
              : {
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                  paddingTop: spacing.md,
                  ...(scroll ? { maxHeight: "92%" } : { height: "92%" }),
                  shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 30, shadowOffset: { width: 0, height: -10 },
                  elevation: 24,
                }),
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={colors.bgGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {fullScreen ? null : (
            <View style={{ width: 56, height: 5, alignSelf: "center", borderRadius: 999, backgroundColor: colors.lineStrong, marginBottom: spacing.md }} />
          )}
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingTop: fullScreen ? spacing["3xl"] + 8 : spacing.sm, paddingBottom: spacing.md }}>
            <Text variant="h2" color="text" serif weight="600" style={{ paddingTop: 6 }}>
              {title}
            </Text>
            <PressScale
              onPress={onClose}
              hitSlop={12}
              scale={0.94}
              haptic="light"
              fullWidth={false}
              wrapperStyle={{ marginTop: 14 }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.cardElevated,
                shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
              }}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.text} />
            </PressScale>
          </View>
          {scroll ? (
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing["3xl"] + kbHeight }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets
              automaticallyAdjustContentInsets={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing["3xl"], flex: 1 }}>{children}</View>
          )}
        </View>
      </View>
    </RNModal>
  );
}
