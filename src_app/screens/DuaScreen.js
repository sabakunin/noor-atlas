import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Modal } from "../components/Modal";
import { Text } from "../components/Text";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ArabicText } from "../components/ArabicText";
import { useTheme } from "../theme";
import { duas } from "../data/duas";
import { getItem, setItem, StorageKeys } from "../services/storage";
import { t } from "../i18n";

export function DuaScreen({ visible, onClose }) {
  const { spacing } = useTheme();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const stored = await getItem(StorageKeys.duaIndex, null);
      if (stored != null) {
        setIndex(Number(stored) % duas.length);
      } else {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        setIndex(dayOfYear % duas.length);
      }
    })();
  }, [visible]);

  function next() {
    const newIndex = (index + 1) % duas.length;
    setIndex(newIndex);
    setItem(StorageKeys.duaIndex, newIndex);
  }

  const dua = duas[index];

  return (
    <Modal visible={visible} onClose={onClose} title={t("dua.title")}>
      <Text variant="h2" color="text" serif weight="600" style={{ marginBottom: spacing.md }}>
        {dua.title}
      </Text>

      <Card padding="xl" elevated style={{ marginBottom: spacing.lg }}>
        <ArabicText variant="arabicLarge" color="text" align="right">
          {dua.arabic}
        </ArabicText>
      </Card>

      <Text variant="caption" color="muted" style={{ letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
        Транслитерация
      </Text>
      <Text variant="body" color="muted" style={{ marginBottom: spacing.lg, fontStyle: "italic" }}>
        {dua.transliteration}
      </Text>

      <Text variant="caption" color="muted" style={{ letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
        Перевод
      </Text>
      <Text variant="body" color="text" style={{ marginBottom: spacing.md }}>
        {dua.translation}
      </Text>

      <Text variant="bodySm" color="gold" weight="600" style={{ marginBottom: spacing.lg }}>
        {dua.source}
      </Text>

      <Button title={t("dua.next")} onPress={next} />
    </Modal>
  );
}
