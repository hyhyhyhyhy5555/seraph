import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Chip, Icon, IconButton, Screen, ScreenHeader, Text, TextField, type IconName } from "@/components/ui";
import { CategoryGrid, ManualList, SearchPath } from "@/features/search";
import {
  getCategories,
  getLibraryStats,
  searchDbManuals,
  type Category,
  type LibraryStats,
  type ManualSummary
} from "@/lib/api";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/tokens";

const majorCategoryIcons: Record<string, IconName> = {
  appliances: "home-outline",
  "digital-mobile": "phone-portrait-outline",
  "tv-audio": "tv-outline",
  computer: "laptop-outline"
};

function getSubtreeManualCount(category: Category): number {
  return category.manualCount + category.children.reduce((sum, child) => sum + getSubtreeManualCount(child), 0);
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<LibraryStats>();
  const [manuals, setManuals] = useState<ManualSummary[]>([]);
  const [loadingManuals, setLoadingManuals] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedMajorId, setSelectedMajorId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string | null>(null);
  const [showEmptySubcategories, setShowEmptySubcategories] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    void Promise.all([getCategories(), getLibraryStats()])
      .then(([categoryTree, libraryStats]) => {
        if (!active) return;
        setCategories(categoryTree);
        setStats(libraryStats);
        setApiError(null);
      })
      .catch(() => {
        if (!active) return;
        setApiError("백엔드 API(localhost:4000)에 연결하지 못했습니다. 서버 상태를 확인해주세요.");
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedMajor = useMemo(
    () => categories.find((category) => category.id === selectedMajorId) ?? null,
    [categories, selectedMajorId]
  );

  const selectedSub = useMemo(
    () => selectedMajor?.children.find((category) => category.id === selectedSubId) ?? null,
    [selectedMajor, selectedSubId]
  );

  const isSearching = debouncedQuery.length > 0;
  const activeCategoryId = isSearching ? undefined : (selectedSub?.id ?? selectedMajor?.id);

  useEffect(() => {
    let active = true;
    setLoadingManuals(true);
    void searchDbManuals({
      q: debouncedQuery || undefined,
      categoryId: activeCategoryId,
      limit: isSearching || activeCategoryId ? 100 : 20
    })
      .then((rows) => {
        if (!active) return;
        setManuals(rows);
        setApiError(null);
      })
      .catch(() => {
        if (!active) return;
        setManuals([]);
        setApiError("설명서 목록을 불러오지 못했습니다. 백엔드와 DB 상태를 확인해주세요.");
      })
      .finally(() => {
        if (active) setLoadingManuals(false);
      });
    return () => {
      active = false;
    };
  }, [activeCategoryId, debouncedQuery, isSearching]);

  const sortedSubcategories = useMemo(() => {
    if (!selectedMajor) return [];
    return [...selectedMajor.children].sort((a, b) => {
      const diff = getSubtreeManualCount(b) - getSubtreeManualCount(a);
      return diff !== 0 ? diff : a.name.localeCompare(b.name, "ko");
    });
  }, [selectedMajor]);

  const activeSubcategories = useMemo(
    () => sortedSubcategories.filter((item) => getSubtreeManualCount(item) > 0),
    [sortedSubcategories]
  );

  const displayedSubcategories = showEmptySubcategories || activeSubcategories.length === 0
    ? sortedSubcategories
    : activeSubcategories;

  const availableManufacturers = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; count: number }>();
    for (const manual of manuals) {
      if (!manual.manufacturer) continue;
      const existing = counts.get(manual.manufacturer.id);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(manual.manufacturer.id, {
          id: manual.manufacturer.id,
          name: manual.manufacturer.name,
          count: 1
        });
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ko"));
  }, [manuals]);

  const selectedManufacturer = useMemo(
    () => availableManufacturers.find((item) => item.id === selectedManufacturerId) ?? null,
    [availableManufacturers, selectedManufacturerId]
  );

  const visibleManuals = useMemo(() => {
    if (!selectedManufacturerId) return manuals;
    return manuals.filter((manual) => manual.manufacturer?.id === selectedManufacturerId);
  }, [manuals, selectedManufacturerId]);

  function selectMajor(category: Category) {
    setSelectedMajorId(category.id);
    setSelectedSubId(null);
    setSelectedManufacturerId(null);
    setShowEmptySubcategories(false);
  }

  function selectSub(category: Category) {
    setSelectedSubId(category.id);
    setSelectedManufacturerId(null);
  }

  function askAboutManual(manual: ManualSummary) {
    router.push({
      pathname: "/chat",
      params: {
        manualId: manual.id,
        manualTitle: manual.title,
        manualModel: manual.modelName ?? ""
      }
    });
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
          placeholder="제품군, 제조사 또는 모델명 검색 (예: 세탁기, 아이폰, 맥북, FX25EA)"
          returnKeyType="search"
          value={query}
        />
        <View style={styles.metrics}>
          <Metric icon="document-text-outline" value={stats ? stats.manualCount.toLocaleString() : "-"} label="등록 설명서" />
          <Metric icon="layers-outline" value={stats ? stats.categoryCount.toLocaleString() : "-"} label="활성 제품군" />
          <Metric icon="sparkles-outline" value={stats ? stats.embeddedChunkCount.toLocaleString() : "-"} label="임베딩 청크" />
        </View>
        {apiError ? (
          <Text variant="caption" color="danger">{apiError}</Text>
        ) : null}
      </View>

      {isSearching ? (
        <ManualList
          title={`‘${debouncedQuery}’ 검색 결과`}
          manuals={visibleManuals}
          loading={loadingManuals}
          onAskManual={askAboutManual}
          emptyTitle="일치하는 설명서가 없습니다"
          emptyDescription="제조사, 제품군 또는 모델명을 다른 표현으로 입력해보세요."
        />
      ) : (
        <>
          <SearchPath
            selectedMajor={selectedMajor}
            selectedSub={selectedSub}
            selectedManufacturerName={selectedManufacturer?.name ?? null}
            onReset={() => {
              setSelectedMajorId(null);
              setSelectedSubId(null);
              setSelectedManufacturerId(null);
            }}
            onMajor={() => {
              setSelectedSubId(null);
              setSelectedManufacturerId(null);
            }}
            onSub={() => setSelectedManufacturerId(null)}
          />

          {!selectedMajor ? (
            <CategoryGrid
              title="어떤 제품을 찾고 있나요?"
              items={categories}
              getIcon={(item) => majorCategoryIcons[item.slugPath] ?? "grid-outline"}
              getMeta={(item) => {
                const count = getSubtreeManualCount(item);
                return count > 0
                  ? `${count.toLocaleString()}개 설명서 · ${item.children.length}개 제품군`
                  : `${item.children.length}개 제품군 · 준비 중`;
              }}
              onPress={selectMajor}
            />
          ) : null}

          {selectedMajor && !selectedSub ? (
            <>
              {sortedSubcategories.length > activeSubcategories.length && activeSubcategories.length > 0 ? (
                <View style={styles.filterBar}>
                  <Chip
                    label={`설명서 있음 ${activeSubcategories.length}`}
                    active={!showEmptySubcategories}
                    onPress={() => setShowEmptySubcategories(false)}
                  />
                  <Chip
                    label={`전체 제품군 ${sortedSubcategories.length}`}
                    active={showEmptySubcategories}
                    onPress={() => setShowEmptySubcategories(true)}
                  />
                </View>
              ) : null}
              <CategoryGrid
                title={`${selectedMajor.name} 제품군`}
                items={displayedSubcategories}
                getMeta={(item) => {
                  const count = getSubtreeManualCount(item);
                  return count > 0 ? `${count.toLocaleString()}개 설명서` : "준비 중";
                }}
                onPress={selectSub}
              />
            </>
          ) : null}

          {selectedSub && availableManufacturers.length > 0 ? (
            <View style={styles.filterBar}>
              <Chip
                label={`전체 제조사 ${manuals.length}`}
                active={!selectedManufacturerId}
                onPress={() => setSelectedManufacturerId(null)}
              />
              {availableManufacturers.map((manufacturer) => (
                <Chip
                  key={manufacturer.id}
                  label={`${manufacturer.name} ${manufacturer.count}`}
                  active={selectedManufacturerId === manufacturer.id}
                  onPress={() => setSelectedManufacturerId(manufacturer.id)}
                />
              ))}
            </View>
          ) : null}

          <ManualList
            title={
              selectedSub
                ? `${selectedSub.name} 설명서`
                : selectedMajor
                  ? `${selectedMajor.name} 설명서`
                  : "최근 등록된 설명서"
            }
            manuals={visibleManuals}
            loading={loadingManuals}
            onAskManual={askAboutManual}
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
    minWidth: 160
  },
  filterBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md
  }
});
