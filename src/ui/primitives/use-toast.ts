"use client";

import { toast as sonnerToast } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

export const useToast = () => {
  const toast = (props: ToastProps) => {
    const { title, description, action, variant = "default" } = props;

    if (variant === "destructive") {
      sonnerToast.error(title || "Error", {
        description,
        action,
      });
    } else {
      sonnerToast.success(title || "Success", {
        description,
        action,
      });
    }
  };

  return { toast };
};