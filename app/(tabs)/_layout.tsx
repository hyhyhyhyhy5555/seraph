import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Icon, type IconName } from "@/components/ui";
import { colors } from "@/theme/colors";
import { radii } from "@/theme/tokens";

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 76,
    paddingBottom: 10,
    paddingTop: 7
  },
  tabItem: {
    paddingVertical: 3
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
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
    backgroundColor: colors.primarySoft
  }
});
