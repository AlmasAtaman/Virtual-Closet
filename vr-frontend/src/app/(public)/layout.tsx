"use client";

import { RestrictedThemeProvider } from "../contexts/RestrictedThemeContext";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RestrictedThemeProvider>
      {children}
    </RestrictedThemeProvider>
  );
}