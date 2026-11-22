import { useEffect, useState } from "react";

import { Screen, ScreenHeader } from "@/components/ui";
import { AppSummaryCard, MenuList, type MenuItemData } from "@/features/menu";
import { getLibraryStats, type LibraryStats } from "@/lib/api";

export default function MenuScreen() {
  const [stats, setStats] = useState<LibraryStats>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void getLibraryStats()
      .then((data) => {
        setStats(data);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, []);

  const menuItems: MenuItemData[] = [
    {
      id: "pipeline",
      title: "문서 파이프라인",
      description: stats
        ? `${stats.manualCount.toLocaleString()}개 매뉴얼 · ${stats.embeddedChunkCount.toLocaleString()} / ${stats.chunkCount.toLocaleString()}개 임베딩 청크`
        : failed
          ? "백엔드 통계를 불러오지 못했습니다"
          : "라이브러리 통계를 불러오는 중...",
      icon: "git-network-outline",
      status: stats ? "완료" : failed ? "미연결" : "확인 중"
    },
    {
      id: "categories",
      title: "활성 제품군",
      description: stats
        ? `${stats.categoryCount.toLocaleString()}개 제품군에서 검색·RAG 답변 가능`
        : "등록된 제품군 현황 확인 중...",
      icon: "layers-outline",
      status: stats ? `${stats.categoryCount}개` : "-"
    },
    {
      id: "model",
      title: "검색 모델",
      description: "Gemini embedding · 1,024 dimensions",
      icon: "sparkles-outline",
      status: "연결됨"
    },
    {
      id: "scope",
      title: "현재 데이터 범위",
      description: "수집·검증된 매뉴얼만 답변 근거로 사용",
      icon: "shield-checkmark-outline",
      status: "근거 한정"
    }
  ];

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="SYSTEM STATUS"
        title="무엇이 연결되어 있는지 투명하게."
        description="현재 데이터 적재 상태와 AI 검색 구성을 확인할 수 있습니다."
        icon="pulse-outline"
      />
      <AppSummaryCard />
      <MenuList items={menuItems} />
    </Screen>
  );
}
