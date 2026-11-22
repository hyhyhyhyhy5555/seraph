import { Tabs } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";

import { Icon, IconButton, type IconName } from "@/components/ui";
import { colors } from "@/theme/colors";
import { radii, sizes } from "@/theme/tokens";
import { getLayoutTier } from "@/theme/responsive";

type TabIconProps = {
  focused: boolean;
  focusedName: IconName;
  name: IconName;
};

function TabIcon({ focused, focusedName, name }: TabIconProps) {
  return (
    <View style={[styles.iconFrame, focused && styles.iconFrameFocused]}>
      <Icon
        name={focused ? focusedName : name}
        size={focused ? 23 : 22}
        color={focused ? "primary" : "textTertiary"}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const tier = getLayoutTier(width);
  const isWideWeb = Platform.OS === "web" && tier === "desktop";
  const isCompact = tier === "compact";
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);

  return (
    <View style={styles.shell}>
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarPosition: isWideWeb ? "left" : "bottom",
        tabBarActiveTintColor: colors.primary,
        tabBarActiveBackgroundColor: isWideWeb ? colors.surfaceAccent : "transparent",
        tabBarInactiveBackgroundColor: "transparent",
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: !isWideWeb || !isRailCollapsed,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [styles.tabBar, isCompact && styles.tabBarCompact, isWideWeb && styles.tabBarWide, isWideWeb && isRailCollapsed && styles.tabBarCollapsed],
        tabBarItemStyle: [styles.tabItem, isWideWeb && styles.tabItemWide]
      }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: "검색",
          tabBarAccessibilityLabel: "설명서 검색 탭",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="search-outline" focusedName="search" />
          )
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "AI 채팅",
          tabBarAccessibilityLabel: "설명서 AI 채팅 탭",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="chatbubble-ellipses-outline"
              focusedName="chatbubble-ellipses"
            />
          )
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "메뉴",
          tabBarAccessibilityLabel: "서비스 메뉴 탭",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="grid-outline" focusedName="grid" />
          )
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "설정",
          tabBarAccessibilityLabel: "설정 탭",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="settings-outline" focusedName="settings" />
          )
        }}
      />
      </Tabs>
      {isWideWeb ? (
        <View style={[styles.railToggle, isRailCollapsed && styles.railToggleCollapsed]}>
          <IconButton
            accessibilityLabel={isRailCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
            icon={isRailCollapsed ? "menu" : "close"}
            onPress={() => setIsRailCollapsed((current) => !current)}
            variant="soft"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 78,
    paddingBottom: 10,
    paddingTop: 7
  },
  tabItem: {
    paddingVertical: 3
  },
  tabBarCompact: {
    height: 68,
    paddingBottom: 7,
    paddingTop: 5
  },
  tabBarWide: {
    borderRightColor: colors.border,
    borderRightWidth: 1,
    borderTopWidth: 0,
    height: "100%",
    paddingHorizontal: 14,
    paddingTop: 92,
    width: sizes.navigationRail
  },
  tabBarCollapsed: { paddingHorizontal: 8, width: 84 },
  tabItemWide: {
    borderRadius: radii.md,
    maxHeight: 64,
    paddingHorizontal: 10
  },
  label: {
    fontFamily: "PretendardSemiBold",
    fontSize: 12,
    marginTop: 3
  },
  iconFrame: {
    alignItems: "center",
    borderRadius: radii.pill,
    height: 32,
    justifyContent: "center",
    width: 52
  },
  iconFrameFocused: {
    backgroundColor: colors.signal
  },
  railToggle: { left: 18, position: "absolute", top: 24, zIndex: 20 },
  railToggleCollapsed: { left: 20 }
});
