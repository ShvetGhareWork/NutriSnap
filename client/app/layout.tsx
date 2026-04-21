// ✅ globals.css MUST be the absolute first import
import './globals.css';

import type { Metadata, Viewport } from 'next';
import Providers from '@/components/shared/Providers';
import BotpressChat from '@/components/BotpressChat';

export const metadata: Metadata = {
  title: {
    default: 'NutriSnap — AI Fitness & Nutrition',
    template: '%s | NutriSnap',
  },
  description: 'AI-powered nutrition tracking, workout generation, and fitness coaching app.',
  keywords: ['nutrition', 'fitness', 'AI', 'meal analysis', 'workout', 'coaching'],
};

// ✅ Viewport MUST be a separate named export in Next.js 14 App Router
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A0A0F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        {/*
          ✅ FOUC FIX: Inline critical styles directly in <head>
          This runs BEFORE any JS hydration, preventing the flash.
          These styles mirror your globals.css body/background rules.
        */}
        <style dangerouslySetInnerHTML={{
          __html: `
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            html { background: #0A0A0F; }
            body {
              background: #0A0A0F !important;
              color: #ffffff;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              font-family: 'Inter', sans-serif;
            }
          `
        }} />

        {/* ✅ Fonts: preconnect first, then load — blocking render until ready */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* Razorpay SDK */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>

      {/*
        ✅ suppressHydrationWarning on body prevents React hydration
        mismatch warnings from browser extensions modifying the DOM
      */}
      <body
        suppressHydrationWarning
        className="bg-[#0A0A0F] text-white antialiased"
      >
        <Providers>
          {children}
          <BotpressChat />
        </Providers>
      </body>
    </html>
  );
}