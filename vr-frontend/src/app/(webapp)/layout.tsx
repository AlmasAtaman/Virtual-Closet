"use client";

import { ThemeProvider } from "../contexts/ThemeContext";

export default function WebappLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}