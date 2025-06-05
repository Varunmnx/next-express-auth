"use client"; 
import { SessionProvider } from "@/components/HOC/protected-route";
import { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}