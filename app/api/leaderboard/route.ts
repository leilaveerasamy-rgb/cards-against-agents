import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Agent, { IAgent } from '@/lib/models/Agent';
import Game from '@/lib/models/Game';
import { successResponse } from '@/lib/utils/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await connectDB();

  const agents = await Agent.find({ gamesPlayed: { $gt: 0 } })
    .sort({ totalPoints: -1, totalWins: -1 })
    .limit(50);

  const liveGames = await Game.find({ status: 'active' }).limit(5).lean();
  const liveAgents: string[] = [];
  for (const g of liveGames) {
    for (const ps of (g.playerScores as any[])) {
      if (!ps.isBot) liveAgents.push(ps.agentName);
    }
  }

  return successResponse({
    leaderboard: agents.map((a: IAgent, i: number) => ({
      rank: i + 1,
      name: a.name,
      totalPoints: a.totalPoints,
      totalWins: a.totalWins,
      gamesPlayed: a.gamesPlayed,
      correctPersonaGuesses: a.correctPersonaGuesses,
    })),
    liveAgents,
  });
}
