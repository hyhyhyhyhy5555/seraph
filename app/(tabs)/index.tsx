import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Icon, IconButton, Screen, ScreenHeader, Text, TextField, type IconName } from "@/components/ui";
import {
  catalog,
  findManualById,
  manuals,
  searchManuals,
  type DetailCategory,
  type MajorCategory,
  type Manual,
  type SubCategory
} from "@/data/manualCatalog";
import { CategoryGrid, ManualList, SearchPath } from "@/features/search";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/tokens";

const majorCategoryIcons: Record<string, IconName> = {
  appliances: "home-outline",
  digital: "phone-portrait-outline",
  "tv-audio": "tv-outline",
  computer: "laptop-outline"
};

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [selectedMajorId, setSelectedMajorId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  const selectedMajor = useMemo(
    () => catalog.find((category) => category.id === selectedMajorId) ?? null,
    [selectedMajorId]
  );

  const selectedSub = useMemo(
    () => selectedMajor?.subcategories.find((category) => category.id === selectedSubId) ?? null,
    [selectedMajor, selectedSubId]
  );

  const selectedDetail = useMemo(
    () => selectedSub?.details.find((detail) => detail.id === selectedDetailId) ?? null,
    [selectedSub, selectedDetailId]
  );

  const results = useMemo(() => searchManuals(query), [query]);
  const visibleManuals = useMemo(() => {
    if (selectedDetail) {
      return selectedDetail.manualIds.map(findManualById).filter(Boolean) as Manual[];
    }

    if (selectedSub) {
      return selectedSub.details
        .flatMap((detail) => detail.manualIds)
        .map(findManualById)
        .filter(Boolean) as Manual[];
    }

    if (selectedMajor) {
      return selectedMajor.subcategories
        .flatMap((sub) => sub.details.flatMap((detail) => detail.manualIds))
        .map(findManualById)
        .filter(Boolean) as Manual[];
    }

    return manuals.slice(0, 4);
  }, [selectedDetail, selectedMajor, selectedSub]);

  const isSearching = query.trim().length > 0;

  function selectMajor(category: MajorCategory) {
    setSelectedMajorId(category.id);
    setSelectedSubId(null);
    setSelectedDetailId(null);
  }

  function selectSub(category: SubCategory) {
    setSelectedSubId(category.id);
    setSelectedDetailId(null);
  }

  function selectDetail(category: DetailCategory) {
    setSelectedDetailId(category.id);
  }

  return (
    <Screen scroll keyboardShouldPersistTaps="handled">
      <ScreenHeader
        eyebrow="MANUAL LIBRARY"
        title="막힌 순간, 설명서부터 찾습니다."
        description="모델명·증상·제조사를 검색하고, 필요한 문서와 근거까지 한 흐름에서 확인하세요."
        icon="documents-outline"
      />

      <View style={styles.searchPanel}>
        <View style={styles.searchIntro}>
          <View style={styles.liveDot} />
          <Text variant="label" color="text">문서 검색</Text>
          <Text variant="caption" color="textSecondary" style={styles.searchHint}>제품 뒷면의 모델명을 입력하면 가장 정확합니다.</Text>
        </View>
        <TextField
          accessibilityLabel="설명서 검색"
          endAdornment={
            query ? (
              <IconButton
                accessibilityLabel="검색어 지우기"
                icon="close"
                onPress={() => setQuery("")}
                variant="soft"
              />
            ) : undefined
          }
          leadingIcon="search-outline"
          onChangeText={setQuery}
          placeholder="제품군, 제조사 또는 모델명 검색"
          returnKeyType="search"
          value={query}
        />
        <View style={styles.metrics}>
          <Metric icon="document-text-outline" value={`${manuals.length}`} label="확인 가능한 문서" />
          <Metric icon="layers-outline" value={`${catalog.length}`} label="주요 제품군" />
          <Metric icon="sparkles-outline" value="AI" label="문서 근거 답변" />
        </View>
      </View>

      {isSearching ? (
        <ManualList
          title={`‘${query.trim()}’ 검색 결과`}
          manuals={results}
          emptyTitle="일치하는 설명서가 없습니다"
          emptyDescription="제조사, 제품군 또는 모델명을 다른 표현으로 입력해보세요."
        />
      ) : (
        <>
          <SearchPath
            selectedMajor={selectedMajor}
            selectedSub={selectedSub}
            selectedDetail={selectedDetail}
            onReset={() => {
              setSelectedMajorId(null);
              setSelectedSubId(null);
              setSelectedDetailId(null);
            }}
            onMajor={() => {
              setSelectedSubId(null);
              setSelectedDetailId(null);
            }}
            onSub={() => setSelectedDetailId(null)}
          />

          {!selectedMajor ? (
            <CategoryGrid
              title="어떤 제품을 찾고 있나요?"
              items={catalog}
              getIcon={(item) => majorCategoryIcons[item.id] ?? "grid-outline"}
              getMeta={(item) => `${item.subcategories.length}개 제품군`}
              onPress={selectMajor}
            />
          ) : null}

          {selectedMajor && !selectedSub ? (
            <CategoryGrid
              title={`${selectedMajor.name} 제품군`}
              items={selectedMajor.subcategories}
              getMeta={(item) => (item.details.length ? `${item.details.length}개 제조사` : "준비 중")}
              onPress={selectSub}
            />
          ) : null}

          {selectedSub ? (
            <CategoryGrid
              title={`${selectedSub.name} 제조사`}
              items={selectedSub.details}
              getMeta={(item) => (item.manualIds.length ? `${item.manualIds.length}개 설명서` : "준비 중")}
              onPress={selectDetail}
            />
          ) : null}

          <ManualList
            title="바로 확인할 수 있는 설명서"
            manuals={visibleManuals}
            emptyTitle="등록된 설명서가 없습니다"
            emptyDescription="이 카테고리의 설명서를 준비하고 있습니다."
          />
        </>
      )}
    </Screen>
  );
}

function Metric({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Icon name={icon} size="sm" color="textSecondary" />
      <Text variant="heading" color="text">{value}</Text>
      <Text variant="caption" color="textSecondary">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  searchPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  searchIntro: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  liveDot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 7,
    width: 7
  },
  searchHint: {
    flexBasis: 240,
    flexGrow: 1,
    textAlign: "right"
  },
  metrics: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingTop: spacing.md
  },
  metric: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minWidth: 180
  }
});
