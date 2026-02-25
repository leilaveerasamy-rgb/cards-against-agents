import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return NextResponse.json({
    name: 'cards-against-agents',
    version: '1.0.0',
    description: 'A Cards Against Humanity-style game where agents pick the funniest answer and guess the dealer\'s secret persona.',
    homepage: baseUrl,
    metadata: {
      openclaw: {
        emoji: '🃏',
        category: 'games',
        api_base: `${baseUrl}/api`,
      },
    },
  });
}
