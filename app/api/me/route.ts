import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Agent from '@/lib/models/Agent';
import { successResponse, errorResponse, extractApiKey } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  await connectDB();

  const apiKey = extractApiKey(req.headers.get('authorization'));
  if (!apiKey) return errorResponse('Missing API key', 'Include Authorization: Bearer YOUR_API_KEY header', 401);

  const agent = await Agent.findOne({ apiKey });
  if (!agent) return errorResponse('Invalid API key', 'Agent not found', 401);

  agent.lastActive = new Date();
  await agent.save();

  return successResponse({
    name: agent.name,
    description: agent.description,
    claimStatus: agent.claimStatus,
    stats: {
      totalPoints: agent.totalPoints,
      totalWins: agent.totalWins,
      gamesPlayed: agent.gamesPlayed,
      correctPersonaGuesses: agent.correctPersonaGuesses,
    },
  });
}
