import { useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
import { colors } from "@/theme/colors";
import { commonStyles } from "@/theme/common";

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
    () =>
      selectedMajor?.subcategories.find((category) => category.id === selectedSubId) ??
      null,
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
      const ids = selectedSub.details.flatMap((detail) => detail.manualIds);
      return ids.map(findManualById).filter(Boolean) as Manual[];
    }

    if (selectedMajor) {
      const ids = selectedMajor.subcategories.flatMap((sub) =>
        sub.details.flatMap((detail) => detail.manualIds)
      );
      return ids.map(findManualById).filter(Boolean) as Manual[];
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
    <SafeAreaView style={commonStyles.safeArea}>
      <ScrollView
        style={commonStyles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={commonStyles.header}>
          <Text style={commonStyles.brand}>세라프</Text>
          <Text style={commonStyles.title}>설명서 검색</Text>
          <Text style={commonStyles.subtitle}>
            제품군, 제조사, 모델명으로 전자기기 설명서를 찾습니다.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>검색</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="예: 세탁기, 삼성, WHISEN"
            placeholderTextColor={colors.faintText}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Text style={styles.clearText}>지우기</Text>
            </Pressable>
          ) : null}
        </View>

        {isSearching ? (
          <SearchResults results={results} />
        ) : (
          <>
            <Breadcrumb
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
                title="대분류"
                items={catalog}
                getMeta={(item) => `${item.subcategories.length}개 소분류`}
                onPress={selectMajor}
              />
            ) : null}

            {selectedMajor && !selectedSub ? (
              <CategoryGrid
                title={`${selectedMajor.name} 소분류`}
                items={selectedMajor.subcategories}
                getMeta={(item) =>
                  item.details.length > 0 ? `${item.details.length}개 제조사` : "준비 중"
                }
                onPress={selectSub}
              />
            ) : null}

            {selectedSub ? (
              <CategoryGrid
                title={`${selectedSub.name} 세부분류`}
                items={selectedSub.details}
                getMeta={(item) =>
                  item.manualIds.length > 0 ? `${item.manualIds.length}개 설명서` : "준비 중"
                }
                onPress={selectDetail}
              />
            ) : null}

            <ManualSection title="설명서" manuals={visibleManuals} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type BreadcrumbProps = {
  selectedMajor: MajorCategory | null;
  selectedSub: SubCategory | null;
  selectedDetail: DetailCategory | null;
  onReset: () => void;
  onMajor: () => void;
  onSub: () => void;
};

function Breadcrumb({
  selectedMajor,
  selectedSub,
  selectedDetail,
  onReset,
  onMajor,
  onSub
}: BreadcrumbProps) {
  return (
    <View style={styles.breadcrumb}>
      <Crumb label="전체" active={!selectedMajor} onPress={onReset} />
      {selectedMajor ? <Crumb label={selectedMajor.name} active={!selectedSub} onPress={onMajor} /> : null}
      {selectedSub ? <Crumb label={selectedSub.name} active={!selectedDetail} onPress={onSub} /> : null}
      {selectedDetail ? <Crumb label={selectedDetail.name} active /> : null}
    </View>
  );
}

type CrumbProps = {
  label: string;
  active: boolean;
  onPress?: () => void;
};

function Crumb({ label, active, onPress }: CrumbProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[styles.crumb, active ? styles.crumbActive : null]}
    >
      <Text style={[styles.crumbText, active ? styles.crumbTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

type NamedItem = {
  id: string;
  name: string;
};

type CategoryGridProps<T extends NamedItem> = {
  title: string;
  items: T[];
  getMeta: (item: T) => string;
  onPress: (item: T) => void;
};

function CategoryGrid<T extends NamedItem>({
  title,
  items,
  getMeta,
  onPress
}: CategoryGridProps<T>) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={commonStyles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{items.length}</Text>
      </View>
      <View style={styles.grid}>
        {items.map((item) => (
          <Pressable key={item.id} style={styles.categoryCard} onPress={() => onPress(item)}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryMeta}>{getMeta(item)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

type SearchResultsProps = {
  results: Manual[];
};

function SearchResults({ results }: SearchResultsProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={commonStyles.sectionTitle}>검색 결과</Text>
        <Text style={styles.sectionCount}>{results.length}</Text>
      </View>
      {results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => <ManualCard manual={item} />}
          ItemSeparatorComponent={() => <View style={styles.manualGap} />}
        />
      ) : (
        <EmptyState
          title="검색 결과가 없습니다"
          body="제조사, 제품군, 모델명을 다른 표현으로 입력해보세요."
        />
      )}
    </View>
  );
}

type ManualSectionProps = {
  title: string;
  manuals: Manual[];
};

function ManualSection({ title, manuals: sectionManuals }: ManualSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={commonStyles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{sectionManuals.length}</Text>
      </View>
      {sectionManuals.length > 0 ? (
        <View style={styles.manualList}>
          {sectionManuals.map((manual) => (
            <ManualCard key={manual.id} manual={manual} />
          ))}
        </View>
      ) : (
        <EmptyState
          title="등록된 설명서가 없습니다"
          body="현재는 화면 구조용 샘플 데이터만 연결되어 있습니다."
        />
      )}
    </View>
  );
}

type ManualCardProps = {
  manual: Manual;
};

function ManualCard({ manual }: ManualCardProps) {
  return (
    <View style={styles.manualCard}>
      <View style={styles.manualHeader}>
        <View style={styles.manualTextArea}>
          <Text style={styles.pathText}>{manual.categoryPath.join(" / ")}</Text>
          <Text style={styles.manualTitle}>{manual.title}</Text>
        </View>
        <View style={styles.brandPill}>
          <Text style={styles.brandPillText}>{manual.manufacturer}</Text>
        </View>
      </View>
      <Text style={styles.manualSummary}>{manual.summary}</Text>
      <View style={styles.manualMetaRow}>
        <Text style={styles.modelText}>모델 {manual.model}</Text>
        <View style={styles.linkRow}>
          <Pressable onPress={() => Linking.openURL(manual.sourceUrl)}>
            <Text style={styles.linkText}>원문</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(manual.pdfUrl)}>
            <Text style={styles.linkText}>PDF</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type EmptyStateProps = {
  title: string;
  body: string;
};

function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 54,
    paddingHorizontal: 14
  },
  searchIcon: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    marginRight: 10
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minWidth: 0
  },
  clearText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800"
  },
  breadcrumb: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16
  },
  crumb: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  crumbActive: {
    backgroundColor: colors.surfaceBlueStrong,
    borderColor: colors.primary
  },
  crumbText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "700"
  },
  crumbTextActive: {
    color: colors.primaryDark
  },
  section: {
    marginTop: 24
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  sectionCount: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 74,
    padding: 14,
    width: "48%"
  },
  categoryName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  categoryMeta: {
    color: colors.mutedText,
    fontSize: 12,
    marginTop: 8
  },
  manualList: {
    gap: 10
  },
  manualGap: {
    height: 10
  },
  manualCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14
  },
  manualHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  manualTextArea: {
    flex: 1,
    minWidth: 0
  },
  pathText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6
  },
  manualTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23
  },
  brandPill: {
    backgroundColor: colors.surfaceBlue,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  brandPillText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900"
  },
  manualSummary: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10
  },
  manualMetaRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12
  },
  modelText: {
    color: colors.faintText,
    fontSize: 12,
    fontWeight: "700"
  },
  linkRow: {
    flexDirection: "row",
    gap: 14
  },
  linkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900"
  },
  emptyState: {
    backgroundColor: colors.surfaceBlue,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  emptyBody: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6
  }
});
