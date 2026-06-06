import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pro Match — Admin',
  description: 'Moderation & analytics dashboard for Pro Match'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
