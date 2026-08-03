"use client";

import { useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function useUrlFilterState<T extends string = string>(
  key: string,
  defaultValue: NoInfer<T>,
): [T, (value: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = useMemo(
    () => (searchParams.get(key) as T | null) ?? defaultValue,
    [searchParams, key, defaultValue],
  );

  const setValue = useCallback(
    (next: T) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, next);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams, key, defaultValue],
  );

  return [value, setValue];
}
