import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal } from "../components/Modal";
import { Text } from "../components/Text";
import { ArabicText } from "../components/ArabicText";
import { PressScale } from "../components/motion/PressScale";
import { StaggerItem } from "../components/motion/Stagger";
import { useTheme } from "../theme";
import { listBookmarks, removeBookmark } from "../services/bookmarks";

function fmtTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (isToday) return `сегодня, ${hh}:${mm}`;
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${mon}, ${hh}:${mm}`;
}

export function BookmarksScreen({ visible, onClose, onOpenAyah }) {
  const { colors, spacing, radius } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listBookmarks();
    setItems(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (visible) refresh();
  }, [visible, refresh]);

  function confirmRemove(item) {
    Alert.alert(
      "Удалить закладку?",
      item.label,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            const next = await removeBookmark(item.id);
            setItems(next);
          },
        },
      ]
    );
  }

  return (
    <Modal visible={visible} onClose={onClose} title="Закладки" scroll={false}>
      <View style={{ flex: 1 }}>
        {loading ? null : items.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl }}>
            <View
              style={{
                width: 80, height: 80, borderRadius: 999,
                alignItems: "center", justifyContent: "center",
                backgroundColor: colors.cardElevated, marginBottom: spacing.md,
              }}
            >
              <MaterialCommunityIcons name="bookmark-outline" size={36} color={colors.gold} />
            </View>
            <Text variant="h3" color="text" weight="700" style={{ textAlign: "center" }}>
              Закладок пока нет
            </Text>
            <Text variant="bodySm" color="muted" style={{ marginTop: 8, textAlign: "center", lineHeight: 22 }}>
              Зажми любой аят в суре и выбери «В закладки» — добавишь его сюда с твоим именем.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
            renderItem={({ item, index }) => (
              <StaggerItem index={index} baseDelay={45} style={{ marginBottom: spacing.sm }}>
                <PressScale
                  onPress={() => {
                    onClose?.();
                    setTimeout(() => onOpenAyah?.(item.suraNumber, item.ayahNumber), 220);
                  }}
                  haptic="selection"
                  scale={0.99}
                  style={{
                    padding: spacing.md, borderRadius: radius.lg,
                    backgroundColor: colors.cardElevated,
                    flexDirection: "row", alignItems: "center", gap: spacing.md,
                    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
                  }}
                >
                  <View
                    style={{
                      width: 44, height: 44, borderRadius: 999,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: colors.gold + "22",
                    }}
                  >
                    <MaterialCommunityIcons name="bookmark" size={20} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="body" color="text" weight="700" numberOfLines={1}>{item.label}</Text>
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 2, alignItems: "center", flexWrap: "wrap" }}>
                      <Text variant="caption" color="muted">{item.suraName}</Text>
                      <Text variant="caption" color="mutedSoft">·</Text>
                      <Text variant="caption" color="muted">{item.suraNumber}:{item.ayahNumber}</Text>
                      <Text variant="caption" color="mutedSoft">·</Text>
                      <Text variant="caption" color="mutedSoft">{fmtTime(item.createdAt)}</Text>
                    </View>
                    {item.preview ? (
                      <ArabicText
                        variant="arabic"
                        color="muted"
                        align="right"
                        style={{ marginTop: 6, fontSize: 16, lineHeight: 28 }}
                      >
                        {item.preview.length > 40 ? item.preview.slice(0, 40) + "…" : item.preview}
                      </ArabicText>
                    ) : null}
                  </View>
                  <PressScale
                    onPress={() => confirmRemove(item)}
                    haptic="light"
                    scale={0.9}
                    fullWidth={false}
                    style={{ width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center" }}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.muted} />
                  </PressScale>
                </PressScale>
              </StaggerItem>
            )}
          />
        )}
      </View>
    </Modal>
  );
}
