"use client";

import { useEffect } from "react";
import { formatPageTitle } from "@/lib/brand";

/** Sets `document.title` to `Scrubber - <pageName>` while the component is mounted. */
export function useDocumentTitle(pageName: string): void {
  useEffect(() => {
    document.title = formatPageTitle(pageName);
  }, [pageName]);
}
