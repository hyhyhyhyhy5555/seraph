import { StyleSheet, View } from "react-native";

import { Chip, Icon } from "@/components/ui";
import type { Category } from "@/lib/api";
import { spacing } from "@/theme/tokens";

type SearchPathProps = {
  onMajor: () => void;
  onReset: () => void;
  onSub: () => void;
  selectedMajor: Category | null;
  selectedManufacturerName: string | null;
  selectedSub: Category | null;
};

export function SearchPath({
  onMajor,
  onReset,
  onSub,
  selectedMajor,
  selectedManufacturerName,
  selectedSub
}: SearchPathProps) {
  return (
    <View accessibilityLabel="선택한 카테고리 경로" style={styles.container}>
      <Chip label="전체" icon="home-outline" active={!selectedMajor} onPress={onReset} />
      {selectedMajor ? (
        <>
          <Icon name="chevron-forward" size="sm" color="textTertiary" />
          <Chip label={selectedMajor.name} active={!selectedSub} onPress={onMajor} />
        </>
      ) : null}
      {selectedSub ? (
        <>
          <Icon name="chevron-forward" size="sm" color="textTertiary" />
          <Chip label={selectedSub.name} active={!selectedManufacturerName} onPress={onSub} />
        </>
      ) : null}
      {selectedManufacturerName ? (
        <>
          <Icon name="chevron-forward" size="sm" color="textTertiary" />
          <Chip label={selectedManufacturerName} active />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxs,
    marginTop: spacing.md
  }
});
