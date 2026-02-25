import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Agent from '@/lib/models/Agent';
import Game from '@/lib/models/Game';
import Round from '@/lib/models/Round';
import { successResponse, errorResponse, extractApiKey } from '@/lib/utils/api-helpers';
import { getRandomCardSet, getRandomPersona } from '@/lib/data/cards';

export async function POST(req: NextRequest) {
  await connectDB();

  const apiKey = extractApiKey(req.headers.get('authorization'));
  if (!apiKey) return errorResponse('Missing API key', 'Include Authorization: Bearer YOUR_API_KEY header', 401);

  const agent = await Agent.findOne({ apiKey });
  if (!agent) return errorResponse('Invalid API key', 'Agent not found', 401);

  const { gameId } = await req.json();
  if (!gameId) return errorResponse('Missing gameId', 'Provide the game ID to join', 400);

  const game = await Game.findById(gameId);
  if (!game) return errorResponse('Game not found', 'Check the game ID', 404);
  if (game.status === 'finished') return errorResponse('Game finished', 'This game has already ended', 400);

  const agentId = agent._id.toString();
  const alreadyIn = game.players.includes(agentId);

  if (!alreadyIn) {
    game.players.push(agentId);
    game.playerScores.push({ agentId, agentName: agent.name, points: 0 });
  }

  // Start the game if waiting and at least 2 players
  if (game.status === 'waiting' && game.players.length >= 2) {
    game.status = 'active';
    game.currentRound = 1;
    await game.save();

    // Create round 1
    await createRound(game, 1);
  } else {
    await game.save();
  }

  const currentRound = await Round.findOne({ gameId: game._id.toString(), roundNumber: game.currentRound, status: 'open' });

  return successResponse({
    game: {
      id: game._id.toString(),
      status: game.status,
      players: game.playerScores.map((p: any) => ({ name: p.agentName, points: p.points })),
      currentRound: game.currentRound,
    },
    round: currentRound ? {
      id: currentRound._id.toString(),
      roundNumber: currentRound.roundNumber,
      dealerName: currentRound.dealerName,
      whiteCard: currentRound.whiteCard,
      blackCards: currentRound.blackCards,
      deadline: currentRound.deadline,
      status: currentRound.status,
      hint: 'Submit your answer with POST /api/rounds/submit',
    } : null,
  });
}

async function createRound(game: any, roundNumber: number) {
  const players = game.players;
  const useSystemDealer = Math.random() < 0.5 || players.length < 2;

  let dealerId: string;
  let dealerName: string;
  let isSystemDealer: boolean;

  if (useSystemDealer) {
    const personas = ['sarcastic', 'grandma', 'punny'] as const;
    const persona = personas[Math.floor(Math.random() * 3)];
    dealerId = `system_${persona}`;
    dealerName = 'Mystery Dealer';
    isSystemDealer = true;

    const cardSet = getRandomCardSet(persona);
    const deadline = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    return await Round.create({
      gameId: game._id.toString(),
      roundNumber,
      dealerId,
      dealerName,
      dealerPersona: persona,
      isSystemDealer,
      whiteCard: cardSet.whiteCard,
      blackCards: cardSet.blackCards,
      dealerPickIndex: cardSet.dealerPickIndex,
      status: 'open',
      deadline,
      winners: [],
      personaGuessWinners: [],
      submissions: [],
    });
  } else {
    // Rotate agent dealers
    const dealerIndex = (roundNumber - 1) % players.length;
    dealerId = players[dealerIndex];

    const Agent = (await import('@/lib/models/Agent')).default;
    const dealerAgent = await Agent.findById(dealerId);
    dealerName = dealerAgent ? dealerAgent.name : 'Unknown';
    isSystemDealer = false;

    const persona = getRandomPersona();
    const cardSet = getRandomCardSet(persona);
    const deadline = new Date(Date.now() + 5 * 60 * 1000);

    return await Round.create({
      gameId: game._id.toString(),
      roundNumber,
      dealerId,
      dealerName,
      dealerPersona: persona,
      isSystemDealer,
      whiteCard: cardSet.whiteCard,
      blackCards: cardSet.blackCards,
      dealerPickIndex: cardSet.dealerPickIndex,
      status: 'open',
      deadline,
      winners: [],
      personaGuessWinners: [],
      submissions: [],
    });
  }
}
