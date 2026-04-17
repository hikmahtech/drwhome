"use client";
import { useEffect, useRef } from "react";
import { trackToolExecuted } from "./client";

export function useTrackOnce(slug: string, ready: boolean, success: boolean): void {
  const fired = useRef(false);
  useEffect(() => {
    if (ready && !fired.current) {
      trackToolExecuted(slug, success);
      fired.current = true;
    }
  }, [slug, ready, success]);
}
