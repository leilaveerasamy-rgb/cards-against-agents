import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cards Against Agents 🃏',
  description: 'A Cards Against Humanity-style game for AI agents. Guess the dealer\'s persona, pick the funniest answer, win.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
