// src/components/providers/SavedForLaterProvider.tsx

"use client";

import * as React from "react";

// This file is now simplified since the Save4LaterProvider from use-save4later handles everything
// We keep this for backward compatibility if needed

interface SavedForLaterProviderProps {
  children: React.ReactNode;
}

// Simple wrapper that just passes through children
// The actual provider logic is now in Save4LaterProvider from use-save4later hook
export function SavedForLaterProvider({ children }: SavedForLaterProviderProps) {
  return <>{children}</>;
}

// Legacy hook for backward compatibility
export function useSavedForLaterContext() {
  // This now delegates to the new useSave4Later hook
  try {
    const { useSave4Later } = await import("~/lib/hooks/use-saved4later");
    return useSave4Later();
  } catch (error) {
    console.warn("useSave4Later hook not found, using fallback");
    return {
      savedCount: 0,
      isLoading: false,
      refreshCount: async () => {},
      isOnline: true,
      currentMode: 'guest' as const,
    };
  }
}

// Migration helper - this is now handled automatically by the new service
export const useSavedItemsMigration = () => {
  const migrateSavedItems = React.useCallback(async (newUserId: string) => {
    // Migration is now handled automatically by the Save4LaterProvider
    // when it initializes with a new user ID
    console.log('Migration is handled automatically by Save4LaterProvider for user:', newUserId);
  }, []);

  return { migrateGuestSavedItems: migrateSavedItems };
};