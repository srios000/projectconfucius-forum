// 1. Import `extendTheme`
import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/700.css";
import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineGlobalStyles,
} from "@chakra-ui/react";
import { buttonRecipe } from "./button";

/**
 * The central configuration for the application's design system using Chakra UI.
 * Customizes global styles, color palettes, typography, and component-specific recipes.
 * Configured to support both light and dark modes via semantic tokens.
 */
const appConfig = defineConfig({
  globalCss: defineGlobalStyles({
    body: {
      bg: { base: "gray.100", _dark: "gray.900" },
      color: { base: "gray.900", _dark: "white" },
      fontFamily: "fonts.body",
    },
  }),
  theme: {
    tokens: {
      colors: {
        brand: {
          100: { value: "#FF3C00" },
        },
      },
      fonts: {
        body: { value: "Open Sans, sans-serif" },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
});

export const theme = createSystem(defaultConfig, appConfig);
