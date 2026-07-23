import { Screen, ScreenHeader } from "@/components/ui";
import { AppSummaryCard, MenuList, type MenuItemData } from "@/features/menu";

const menuItems: MenuItemData[] = [
  {
    id: "settings",
    title: "설정",
    description: "알림, 계정, 앱 표시 옵션",
    icon: "settings-outline"
  },
  {
    id: "contact",
    title: "문의하기",
    description: "설명서 요청, 오류 신고, 제휴 문의",
    icon: "chatbox-ellipses-outline"
  },
  {
    id: "terms",
    title: "약관 및 정책",
    description: "서비스 이용약관, 개인정보 처리방침",
    icon: "shield-checkmark-outline"
  }
];

export default function MenuScreen() {
  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="SERAPH"
        title="서비스 정보"
        description="앱 설정과 문의, 서비스 정책을 확인할 수 있습니다."
        icon="menu-outline"
      />
      <AppSummaryCard />
      <MenuList items={menuItems} />
    </Screen>
  );
}
