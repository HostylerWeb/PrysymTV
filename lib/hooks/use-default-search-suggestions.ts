"use client";

import { useEffect, useState } from "react";
import { searchSuggest } from "@/lib/api/search";

const SEED_QUERIES = ["live", "podcast", "game", "music"];

export function useDefaultSearchSuggestions(enabled = true) {
  const [data, setData] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setIsLoading(true);

    void (async () => {
      const labels = new Set<string>();
      for (const seed of SEED_QUERIES) {
        try {
          const res = await searchSuggest(seed);
          for (const item of res.suggestions.slice(0, 2)) {
            if (item.label?.trim()) labels.add(item.label.trim());
          }
        } catch {
          /* skip failed seed */
        }
      }
      if (!cancelled) {
        setData([...labels].slice(0, 8));
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { data, isLoading };
}
