"use client";

import { toast } from "sonner";

export { toast };

// Create a custom useToast hook that returns the toast function
export const useToast = () => {
  return { toast };
};