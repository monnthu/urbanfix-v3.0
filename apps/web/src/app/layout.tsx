import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Urbanfix — civic reporting',
  description:
    'Report local civic issues, track them, and route them to the responsible institution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
          Urbanfix v3.0 — civic reporting MVP. Demo only.
        </footer>
      </body>
    </html>
  );
}
