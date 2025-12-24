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
        bg: { base: "red.500", _dark: "red.600" },
        borderColor: { base: "red.500", _dark: "red.600" },
        _hover: {
          ...(solidBase._hover ?? {}),
          bg: { base: "red.400", _dark: "red.500" },
        },
      },
      outline: {
        ...outlineBase,
        color: { base: "red.500", _dark: "red.400" },
        borderWidth: "1px",
        borderColor: { base: "red.500", _dark: "red.400" },
        _hover: {
          ...(outlineBase._hover ?? {}),
          bg: { base: "red.50", _dark: "whiteAlpha.100" },
        },
      },
      oauth: {
        height: "34px",
        borderWidth: "1px",
        borderColor: { base: "gray.300", _dark: "gray.600" },
        _hover: {
          bg: { base: "gray.50", _dark: "gray.700" },
          borderColor: "red.400",
        },
      },
      action: {
        height: "34px",
        borderWidth: "1px",
        borderColor: { base: "white", _dark: "gray.800" },
        _hover: {
          bg: { base: "gray.50", _dark: "gray.700" },
          borderColor: "red.400",
        },
      },
    },
  },
});
