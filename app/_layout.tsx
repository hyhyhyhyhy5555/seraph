import { Stack, usePathname, useRootNavigationState, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { shouldShowLanding } from "@/lib/launchPreferences";

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

  return <ThemeProvider><AppNavigator /></ThemeProvider>;
}

function AppNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const navigationState = useRootNavigationState();
  const { colorScheme } = useTheme();
  const [launchChecked, setLaunchChecked] = useState(false);

  useEffect(() => {
    if (!navigationState?.key || launchChecked) return;
    if (pathname === "/landing") {
      setLaunchChecked(true);
      return;
    }

    void shouldShowLanding()
      .then((showLanding) => {
        if (showLanding) router.replace("/landing");
      })
      .finally(() => setLaunchChecked(true));
  }, [launchChecked, navigationState?.key, pathname, router]);

  return (
    <>
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background
          }
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="landing" options={{ animation: "fade" }} />
      </Stack>
      {!launchChecked ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} /> : null}
    </>
  );
}
