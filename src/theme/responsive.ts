import { useWindowDimensions } from "react-native";

export type LayoutTier = "compact" | "foldable" | "tablet" | "desktop";

export function getLayoutTier(width: number): LayoutTier {
  if (width < 480) return "compact";
  if (width < 720) return "foldable";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const tier = getLayoutTier(width);

  return {
    width,
    height,
    tier,
    isCompact: tier === "compact",
    isFoldable: tier === "foldable",
    isTablet: tier === "tablet",
    isDesktop: tier === "desktop",
    horizontalPadding: tier === "compact" ? 16 : tier === "foldable" ? 20 : tier === "tablet" ? 24 : 32,
    fontScale: tier === "compact" ? 0.88 : tier === "foldable" ? 0.93 : tier === "tablet" ? 0.97 : 1
  };
}
