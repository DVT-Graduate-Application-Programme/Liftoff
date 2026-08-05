"use client";

import { useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export type UrlFilterUpdate = {
  key: string;
  value: string;
  defaultValue: string;
};

/**
 * Apply multiple URL filter updates in a single router.replace.
 * Prefer this for clear-all / multi-field resets so later writes
 * cannot overwrite earlier ones from stale searchParams.
 */
export function useSetUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (updates: UrlFilterUpdate[]) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const { key, value, defaultValue } of updates) {
        if (value === defaultValue) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );
}

export function useUrlFilterState<T extends string = string>(
  key: string,
  defaultValue: NoInfer<T>,
): [T, (value: T) => void] {
  const setUrlFilters = useSetUrlFilters();
  const searchParams = useSearchParams();

  const value = useMemo(
    () => (searchParams.get(key) as T | null) ?? defaultValue,
    [searchParams, key, defaultValue],
  );

  const setValue = useCallback(
    (next: T) => {
      setUrlFilters([{ key, value: next, defaultValue }]);
    },
    [setUrlFilters, key, defaultValue],
  );

  return [value, setValue];
}
