import { Screen, ScreenHeader } from "@/components/ui";
import { AppSummaryCard, MenuList, type MenuItemData } from "@/features/menu";

const menuItems: MenuItemData[] = [
  {
    id: "pipeline",
    title: "문서 파이프라인",
    description: "12개 리비전 · 1,517개 임베딩 청크",
    icon: "git-network-outline",
    status: "완료"
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
    status: "제한 공개"
  }
];

export default function MenuScreen() {
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
