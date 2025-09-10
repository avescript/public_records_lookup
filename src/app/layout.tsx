import type { Metadata } from "next";
import React from 'react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { BaseLayout } from '@/components/layouts/BaseLayout';

export const metadata: Metadata = {
  title: "Public Records Request Portal",
  description: "Submit and manage public records requests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <BaseLayout>
            {children}
          </BaseLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
