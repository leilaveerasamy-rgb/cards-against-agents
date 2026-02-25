import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Agent from '@/lib/models/Agent';
import Game from '@/lib/models/Game';
import Round from '@/lib/models/Round';
import { successResponse, errorResponse, extractApiKey } from '@/lib/utils/api-helpers';
import { createNextRound } from '@/lib/utils/round-utils';

export async function POST(req: NextRequest) {
  await connectDB();

  const apiKey = extractApiKey(req.headers.get('authorization'));
  if (!apiKey) return errorResponse('Missing API key', 'Include Authorization: Bearer YOUR_API_KEY header', 401);

  const agent = await Agent.findOne({ apiKey });
  if (!agent) return errorResponse('Invalid API key', 'Agent not found', 401);

  const { gameId, roundId, chosenCardIndex, personaGuess } = await req.json();

  if (gameId === undefined || roundId === undefined || chosenCardIndex === undefined || !personaGuess) {
    return errorResponse(
      'Missing fields',
      'Provide: gameId, roundId, chosenCardIndex (0-3), personaGuess ("sarcastic" | "grandma" | "punny")',
      400
    );
  }

  if (!['sarcastic', 'grandma', 'punny'].includes(personaGuess)) {
    return errorResponse('Invalid personaGuess', 'Must be "sarcastic", "grandma", or "punny"', 400);
  }

  if (chosenCardIndex < 0 || chosenCardIndex > 3) {
    return errorResponse('Invalid chosenCardIndex', 'Must be 0, 1, 2, or 3', 400);
  }

  const round = await Round.findById(roundId);
  if (!round) return errorResponse('Round not found', 'Check the round ID', 404);
  if (round.gameId !== gameId) return errorResponse('Round/game mismatch', 'Round does not belong to this game', 400);
  if (round.status !== 'open') return errorResponse('Round closed', 'This round is no longer accepting submissions', 400);
  if (new Date() > round.deadline) return errorResponse('Deadline passed', 'Submissions are closed for this round', 400);

  const agentId = agent._id.toString();
  if (round.dealerId === agentId) {
    return errorResponse('You are the dealer', 'Dealers cannot submit answers — wait for submissions and pick your favourite', 400);
  }

  const alreadySubmitted = round.submissions.some((s: any) => s.agentId === agentId);
  if (alreadySubmitted) {
    return errorResponse('Already submitted', 'You have already submitted an answer for this round', 400);
  }

  round.submissions.push({
    agentId,
    agentName: agent.name,
    chosenCardIndex,
    personaGuess,
    submittedAt: new Date(),
  });

  // Check if all non-dealer players have submitted → close early
  const game = await Game.findById(gameId);
  if (game) {
    const nonDealerPlayers = game.players.filter((p: string) => p !== round.dealerId);
    const submittedCount = round.submissions.length;
    if (submittedCount >= nonDealerPlayers.length) {
      round.status = 'closed';
    }
  }

  await round.save();

  return successResponse({
    message: 'Submission received!',
    chosenCard: round.blackCards[chosenCardIndex],
    personaGuess,
    roundStatus: round.status,
    hint: round.status === 'closed'
      ? 'All players have submitted. Waiting for the dealer to pick their favourite.'
      : 'Waiting for other players to submit or the deadline to pass.',
  });
}
