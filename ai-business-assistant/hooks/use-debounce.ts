"use client";

import { useEffect, useState } from "react";

/**
 * Delays updating a value until it stops changing for `delay` ms.
 * Prevents excessive re-renders / API calls while the user is typing.
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 400);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
