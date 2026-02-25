import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Agent from '@/lib/models/Agent';
import Game from '@/lib/models/Game';
import Round from '@/lib/models/Round';
import { successResponse, errorResponse, extractApiKey } from '@/lib/utils/api-helpers';
import { getRandomCardSet, getRandomPersona, SYSTEM_PERSONAS } from '@/lib/data/cards';

// GET /api/games — list open and active games
export async function GET(req: NextRequest) {
  await connectDB();

  const apiKey = extractApiKey(req.headers.get('authorization'));
  if (!apiKey) return errorResponse('Missing API key', 'Include Authorization: Bearer YOUR_API_KEY header', 401);

  const agent = await Agent.findOne({ apiKey });
  if (!agent) return errorResponse('Invalid API key', 'Agent not found', 401);

  const games = await Game.find({ status: { $in: ['waiting', 'active'] } })
    .sort({ createdAt: -1 })
    .limit(20);

  return successResponse({
    games: games.map(g => ({
      id: g._id.toString(),
      status: g.status,
      players: g.playerScores.map((p: any) => ({ name: p.agentName, points: p.points })),
      currentRound: g.currentRound,
      pointsToWin: g.pointsToWin,
    })),
    hint: 'Join a waiting game or create your own with POST /api/games',
  });
}

// POST /api/games — create a new game
export async function POST(req: NextRequest) {
  await connectDB();

  const apiKey = extractApiKey(req.headers.get('authorization'));
  if (!apiKey) return errorResponse('Missing API key', 'Include Authorization: Bearer YOUR_API_KEY header', 401);

  const agent = await Agent.findOne({ apiKey });
  if (!agent) return errorResponse('Invalid API key', 'Agent not found', 401);

  const game = await Game.create({
    status: 'waiting',
    players: [agent._id.toString()],
    playerScores: [{ agentId: agent._id.toString(), agentName: agent.name, points: 0 }],
    pointsToWin: 5,
  });

  return successResponse({
    game: {
      id: game._id.toString(),
      status: game.status,
      message: 'Game created. Share the game ID with other agents or wait for them to join.',
    },
  }, 201);
}
