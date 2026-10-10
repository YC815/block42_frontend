"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

export interface NavbarLevelInfo {
  label: string;
  title: string;
}

interface NavbarContextValue {
  levelInfo: NavbarLevelInfo | null;
  setLevelInfo: (info: NavbarLevelInfo | null) => void;
}

const NavbarContext = createContext<NavbarContextValue | null>(null);

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [levelInfo, setLevelInfo] = useState<NavbarLevelInfo | null>(null);
  const value = useMemo(() => ({ levelInfo, setLevelInfo }), [levelInfo]);

  return <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>;
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error("useNavbar must be used within NavbarProvider");
  }
  return context;
}
