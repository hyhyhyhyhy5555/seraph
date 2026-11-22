import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "react-native";

import { colors } from "@/theme/colors";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Pretendard: require("../assets/fonts/Pretendard-Regular.otf"),
    PretendardMedium: require("../assets/fonts/Pretendard-Medium.otf"),
    PretendardSemiBold: require("../assets/fonts/Pretendard-SemiBold.otf"),
    PretendardBold: require("../assets/fonts/Pretendard-Bold.otf")
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
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
