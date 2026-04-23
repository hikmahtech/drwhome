"use client";

import { trackDossierViewed } from "@/lib/analytics/client";
import { useEffect, useRef } from "react";

type Props = {
  domain: string;
};

export function DossierViewTracker({ domain }: Props) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackDossierViewed(domain);
  }, [domain]);
  return null;
}
