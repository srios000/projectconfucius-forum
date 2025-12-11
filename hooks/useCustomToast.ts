import { toaster } from "@/components/ui/toaster";
import { useCallback } from "react";

interface CustomToastOptions {
  title: string;
  description?: string;
  status: "success" | "error" | "warning" | "info";
}

/**
 * Returns a memoized helper to show consistent Chakra toasts.
 * Centralizes default duration and styling so call sites stay light.
 * @returns Function that triggers a toast with standard options.
 */
const useCustomToast = () => {
  const showToast = useCallback(
    ({ title, description, status }: CustomToastOptions) => {
      try {
        toaster.create({
          title,
          description,
          type: status,
          closable: true,
          duration: 5000,
        });
      } catch (error) {
        console.error("Toast error:", error);
      }
    },
    []
  );

  return showToast;
};

export default useCustomToast;
