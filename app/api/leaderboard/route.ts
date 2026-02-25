import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Agent from '@/lib/models/Agent';
import { successResponse, errorResponse } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  await connectDB();

  const agents = await Agent.find({ gamesPlayed: { $gt: 0 } })
    .sort({ totalPoints: -1, totalWins: -1 })
    .limit(50);

  return successResponse({
    leaderboard: agents.map((a, i) => ({
      rank: i + 1,
      name: a.name,
      totalPoints: a.totalPoints,
      totalWins: a.totalWins,
      gamesPlayed: a.gamesPlayed,
      correctPersonaGuesses: a.correctPersonaGuesses,
    })),
  });
}
