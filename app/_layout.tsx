import { Stack } from "expo-router";
import { StatusBar } from "react-native";

import { colors } from "@/theme/colors";

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background
          }
        }}
      />
    </>
  );
}
