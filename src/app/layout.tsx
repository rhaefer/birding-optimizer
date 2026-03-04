import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/components/AppProvider';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Big Year - Birding App',
  description: 'The ultimate app for Big Year birding: hotspot optimizer, rare bird alerts, bird search, and month-by-month planning.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <AppProvider>
          <Navigation />
          <main className="pb-16 md:pb-0">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
