// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BRAND, META_DEFAULTS } from '@/lib/constants';
import './globals.css';

// SEO and social sharing optimization
export const metadata: Metadata = {
  title: {
    default: META_DEFAULTS.TITLE,
    template: '%s | MRVL.net'
  },
  description: META_DEFAULTS.DESCRIPTION,
  keywords: META_DEFAULTS.KEYWORDS,
  authors: [{ name: META_DEFAULTS.AUTHOR }],
  creator: META_DEFAULTS.AUTHOR,
  publisher: META_DEFAULTS.AUTHOR,
  robots: META_DEFAULTS.ROBOTS,
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://mrvl.net',
    siteName: BRAND.NAME,
    title: META_DEFAULTS.TITLE,
    description: META_DEFAULTS.DESCRIPTION,
    images: [
      {
        url: '/social-preview.jpg',
        width: 1200,
        height: 630,
        alt: BRAND.TAGLINE,
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    site: '@mrvlnet',
    creator: '@mrvlnet',
    title: META_DEFAULTS.TITLE,
    description: META_DEFAULTS.DESCRIPTION,
    images: ['/social-preview.jpg'],
  },
  
  // PWA
  manifest: '/manifest.json',
  
  // Additional meta tags
  other: {
    'theme-color': '#0f1419',
    'msapplication-TileColor': '#0f1419',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

// Mobile viewport optimization
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1419' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Performance hints */}
        <link rel="dns-prefetch" href="//api.mrvl.net" />
        <link rel="preconnect" href="//api.mrvl.net" crossOrigin="anonymous" />
      </head>
      
      <body 
        className="min-h-screen bg-[#0f1419] text-[#ffffff] antialiased"
        suppressHydrationWarning
      >
        {/* Global error boundary and providers */}
        <Providers>
          {/* Skip to main content for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#fa4454] text-white rounded focus:outline-none focus:ring-2 focus:ring-white"
          >
            Skip to main content
          </a>
          
          {/* Header navigation */}
          <Header />
          
          {/* Main content area */}
          <main 
            id="main-content"
            className="flex-1 min-h-[calc(100vh-140px)]"
            role="main"
          >
            <div className="container mx-auto px-4 py-6 max-w-[1200px]">
              {children}
            </div>
          </main>
          
          {/* Footer */}
          <Footer />
        </Providers>
        
        {/* Analytics and monitoring scripts would go here in production */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics or similar */}
            {process.env.NEXT_PUBLIC_ANALYTICS_ID && (
              <>
                <script
                  async
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_ANALYTICS_ID}`}
                />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', '${process.env.NEXT_PUBLIC_ANALYTICS_ID}', {
                        anonymize_ip: true,
                        cookie_expires: 0,
                      });
                    `,
                  }}
                />
              </>
            )}
            
            {/* Performance monitoring */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  // Basic performance monitoring
                  window.addEventListener('load', () => {
                    if ('performance' in window) {
                      const perfData = performance.getEntriesByType('navigation')[0];
                      if (perfData && perfData.loadEventEnd - perfData.fetchStart > 3000) {
                        console.warn('Slow page load detected:', perfData.loadEventEnd - perfData.fetchStart + 'ms');
                      }
                    }
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
