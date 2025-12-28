import type { Metadata } from "next";
import "./globals.css";
import '@/app/config/fontawesome';
import { ToastProvider } from '@/app/components/Toaster';
import { I18nProvider } from '@/lib/i18n';
import ConditionalLayout from './components/ConditionalLayout';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tumanow.com'),
  title: {
    default: "TumaNow - Courier & Delivery Management",
    template: "%s | TumaNow",
  },
  description: "TumaNow - Multi-company courier and delivery management platform",
  keywords: ["courier", "delivery", "logistics", "tumanow", "multi-tenant"],
  authors: [{ name: "TumaNow" }],
  creator: "TumaNow",
  publisher: "TumaNow",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/favicon.png", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://tumanow.com',
    siteName: "TumaNow",
    title: "TumaNow - Courier & Delivery Management",
    description: "Multi-company courier and delivery management platform",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <I18nProvider>
          <ToastProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

