import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Modal } from "../components/Modal";
import { Text } from "../components/Text";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ArabicText } from "../components/ArabicText";
import { useTheme } from "../theme";
import { ayahs } from "../data/ayahs";
import { getItem, setItem, StorageKeys } from "../services/storage";
import { t } from "../i18n";

export function AyahDailyModal({ visible, onClose }) {
  const { spacing } = useTheme();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const stored = await getItem(StorageKeys.ayahIndex, null);
      if (stored != null) {
        setIndex(Number(stored) % ayahs.length);
      } else {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        setIndex(dayOfYear % ayahs.length);
      }
    })();
  }, [visible]);

  function next() {
    const newIndex = (index + 1) % ayahs.length;
    setIndex(newIndex);
    setItem(StorageKeys.ayahIndex, newIndex);
  }

  const ayah = ayahs[index];

  return (
    <Modal visible={visible} onClose={onClose} title={t("quran.title")}>
      <Card padding="xl" elevated style={{ marginBottom: spacing.lg }}>
        <ArabicText variant="arabicLarge" color="text" align="right">
          {ayah.arabic}
        </ArabicText>
      </Card>

      <Text variant="caption" color="muted" style={{ letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
        {t("quran.transliteration")}
      </Text>
      <Text variant="body" color="muted" style={{ marginBottom: spacing.lg, fontStyle: "italic" }}>
        {ayah.transliteration}
      </Text>

      <Text variant="caption" color="muted" style={{ letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
        {t("quran.translation")}
      </Text>
      <Text variant="body" color="text" style={{ marginBottom: spacing.md }}>
        {ayah.translation}
      </Text>

      <Text variant="bodySm" color="gold" weight="600" style={{ marginBottom: spacing.lg }}>
        {ayah.source}
      </Text>

      <Button title={t("quran.next")} onPress={next} />
    </Modal>
  );
}
