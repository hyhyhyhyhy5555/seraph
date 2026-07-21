import { StyleSheet } from "react-native";

import { colors } from "./colors";

export const commonStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18
  },
  header: {
    marginBottom: 18
  },
  brand: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: "800"
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: 4
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  }
});
