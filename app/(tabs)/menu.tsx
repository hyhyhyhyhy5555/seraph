import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";
import { commonStyles } from "@/theme/common";

const menuItems = [
  {
    id: "settings",
    title: "설정",
    description: "알림, 계정, 앱 표시 옵션"
  },
  {
    id: "contact",
    title: "문의하기",
    description: "설명서 요청, 오류 신고, 제휴 문의"
  },
  {
    id: "terms",
    title: "약관",
    description: "서비스 이용약관, 개인정보 처리방침"
  }
];

export default function MenuScreen() {
  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <ScrollView style={commonStyles.screen} contentContainerStyle={styles.content}>
        <View style={commonStyles.header}>
          <Text style={commonStyles.brand}>세라프</Text>
          <Text style={commonStyles.title}>메뉴</Text>
          <Text style={commonStyles.subtitle}>
            서비스 설정과 문의, 약관 정보를 확인합니다.
          </Text>
        </View>

        <View style={styles.profileCard}>
          <View>
            <Text style={styles.profileLabel}>현재 버전</Text>
            <Text style={styles.profileTitle}>Seraph MVP</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>초기 설계</Text>
          </View>
        </View>

        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <Pressable key={item.id} style={styles.menuItem}>
              <View style={styles.menuTextArea}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceBlue,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16
  },
  profileLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 6
  },
  profileTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  statusPill: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  statusText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900"
  },
  menuList: {
    gap: 10,
    marginTop: 18
  },
  menuItem: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  menuTextArea: {
    flex: 1,
    minWidth: 0
  },
  menuTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  menuDescription: {
    color: colors.mutedText,
    fontSize: 13,
    marginTop: 6
  },
  menuArrow: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "500",
    marginLeft: 12
  }
});
