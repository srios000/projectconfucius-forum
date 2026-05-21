import { useCallback } from "react";
import { toast } from "sonner";

interface CustomToastOptions {
  title: string;
  description?: string;
  status: "success" | "error" | "warning" | "info";
}

/**
 * A custom hook that provides a simplified interface for displaying sonner toasts.
 * Wraps sonner toast functions to preserve the legacy Chakra toast signature.
 * @returns A function that can be called with title, description, and status to trigger a toast notification.
 */
const useCustomToast = () => {
  const showToast = useCallback(
    ({ title, description, status }: CustomToastOptions) => {
      try {
        const message = description ? `${title}: ${description}` : title;
        if (status === "success") {
          toast.success(message);
        } else if (status === "error") {
          toast.error(message);
        } else if (status === "warning") {
          toast.warning(message);
        } else {
          toast.info(message);
        }
      } catch (error) {
        console.error("Toast error:", error);
      }
    },
    []
  );

  return showToast;
};

export default useCustomToast;
