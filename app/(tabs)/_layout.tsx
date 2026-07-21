import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";

type TabIconProps = {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  focusedName: keyof typeof Ionicons.glyphMap;
};

function TabIcon({ focused, name, focusedName }: TabIconProps) {
  return (
    <View
      style={[
        styles.iconFrame,
        focused ? styles.iconFrameFocused : styles.iconFrameIdle
      ]}
    >
      <Ionicons
        name={focused ? focusedName : name}
        size={focused ? 23 : 22}
        color={focused ? colors.primaryDark : colors.mutedText}
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
        tabBarInactiveTintColor: colors.mutedText,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
          marginTop: 4
        },
        tabBarStyle: {
          height: 76,
          paddingBottom: 12,
          paddingTop: 8,
          borderTopColor: colors.border,
          backgroundColor: colors.surface
        },
        tabBarItemStyle: {
          paddingVertical: 4
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "검색",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="search-outline" focusedName="search" />
          )
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "채팅",
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
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="menu-outline" focusedName="menu" />
          )
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconFrame: {
    alignItems: "center",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 46
  },
  iconFrameFocused: {
    backgroundColor: colors.surfaceBlueStrong
  },
  iconFrameIdle: {
    backgroundColor: "transparent"
  }
});
