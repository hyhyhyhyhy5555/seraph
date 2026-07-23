import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { IconButton, Screen, ScreenHeader, TextField, type IconName } from "@/components/ui";
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
        eyebrow="SERAPH MANUALS"
        title="필요한 설명서를 빠르게"
        description="제품군부터 모델명까지 탐색하고 공식 설명서 원문을 확인하세요."
        icon="documents-outline"
      />

      <View style={styles.searchArea}>
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
      </View>

      {isSearching ? (
        <ManualList
          title="검색 결과"
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
              title="제품 카테고리"
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
            title="추천 설명서"
            manuals={visibleManuals}
            emptyTitle="등록된 설명서가 없습니다"
            emptyDescription="이 카테고리의 설명서를 준비하고 있습니다."
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchArea: {
    marginBottom: spacing.xxs
  }
});
