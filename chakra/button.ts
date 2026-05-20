import { defaultConfig, defineRecipe } from "@chakra-ui/react";

const baseRecipe =
  (defaultConfig.theme?.recipes?.button as Record<string, any>) ?? {};
const baseStyles = (baseRecipe.base as Record<string, any>) ?? {};
const sizeVariants =
  (baseRecipe.variants?.size as Record<string, Record<string, any>>) ?? {};
const variantVariants =
  (baseRecipe.variants?.variant as Record<string, Record<string, any>>) ?? {};
const solidBase = variantVariants.solid ?? {};
const outlineBase = variantVariants.outline ?? {};

/**
 * A custom component recipe for buttons that extends the default Chakra UI button styles.
 * Defines base styles, size variants, and custom visual variants (solid, outline, oauth, action) used across the application.
 * Ensures consistent branding and interactive states.
 */
export const buttonRecipe = defineRecipe({
  ...baseRecipe,
  base: {
    ...baseStyles,
    borderRadius: "10px",
    fontSize: "10pt",
    fontWeight: 700,
    _focus: {
      boxShadow: "none",
    },
    _hover: {
      ...(baseStyles._hover ?? {}),
      boxShadow: "sm",
    },
  },
  variants: {
    ...baseRecipe.variants,
    size: {
      ...sizeVariants,
      sm: {
        ...(sizeVariants.sm ?? {}),
        fontSize: "8pt",
      },
      md: {
        ...(sizeVariants.md ?? {}),
        fontSize: "10pt",
      },
    },
    variant: {
      ...variantVariants,
      solid: {
        ...solidBase,
        color: "white",
        bg: { base: "green.500", _dark: "green.600" },
        borderColor: { base: "green.500", _dark: "green.600" },
        _hover: {
          ...(solidBase._hover ?? {}),
          bg: { base: "green.400", _dark: "green.500" },
        },
      },
      outline: {
        ...outlineBase,
        color: { base: "green.500", _dark: "green.400" },
        borderWidth: "1px",
        borderColor: { base: "green.500", _dark: "green.400" },
        _hover: {
          ...(outlineBase._hover ?? {}),
          bg: { base: "green.50", _dark: "whiteAlpha.100" },
        },
      },
      oauth: {
        height: "34px",
        borderWidth: "1px",
        borderColor: { base: "gray.300", _dark: "gray.600" },
        _hover: {
          bg: { base: "gray.50", _dark: "gray.700" },
          borderColor: "green.400",
        },
      },
      action: {
        height: "34px",
        borderWidth: "1px",
        borderColor: { base: "white", _dark: "gray.800" },
        _hover: {
          bg: { base: "gray.50", _dark: "gray.700" },
          borderColor: "green.400",
        },
      },
    },
  },
});
