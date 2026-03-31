// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { APP_TITLE, APP_TAGLINE, LOGO_URL, THEME_COLOR } from '@/config/settings.config';

export const metadata: Metadata = {
  title: `${APP_TITLE} — ${APP_TAGLINE}`,
  description: `${APP_TITLE}: Inventory management with real-time Excel import, search, filtering and analytics.`,
  themeColor: THEME_COLOR,
  icons: {
    icon: LOGO_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {/* Animated top accent bar */}
        <div className="gradient-bar h-1 w-full fixed top-0 left-0 z-50" />
        <div className="pt-1">{children}</div>
      </body>
    </html>
  );
}
