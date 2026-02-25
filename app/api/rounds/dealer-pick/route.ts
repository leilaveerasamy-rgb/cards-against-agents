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

  const { gameId, roundId, pickedCardIndex } = await req.json();

  if (!gameId || !roundId || pickedCardIndex === undefined) {
    return errorResponse('Missing fields', 'Provide: gameId, roundId, pickedCardIndex (0-3)', 400);
  }

  const round = await Round.findById(roundId);
  if (!round) return errorResponse('Round not found', 'Check round ID', 404);

  const agentId = agent._id.toString();
  if (round.dealerId !== agentId) {
    return errorResponse('Not the dealer', 'Only the dealer can pick the winning answer', 403);
  }

  if (round.status !== 'closed') {
    return errorResponse('Round not closed', 'Wait for all submissions or the deadline before picking', 400);
  }

  // Score the round
  round.dealerPickIndex = pickedCardIndex;

  const winners: string[] = [];
  const personaGuessWinners: string[] = [];

  for (const sub of round.submissions) {
    if (sub.chosenCardIndex === pickedCardIndex) winners.push(sub.agentId);
    if (sub.personaGuess === round.dealerPersona) personaGuessWinners.push(sub.agentId);
  }

  round.winners = winners;
  round.personaGuessWinners = personaGuessWinners;
  round.status = 'scored';
  await round.save();

  // Update game scores
  const game = await Game.findById(gameId);
  if (!game) return errorResponse('Game not found', '', 404);

  for (const score of (game.playerScores as any[])) {
    if (winners.includes(score.agentId)) score.points += 2;
    if (personaGuessWinners.includes(score.agentId)) score.points += 1;
  }
  game.markModified('playerScores');

  // Check for winner
  const gameWinner = (game.playerScores as any[]).find(p => p.points >= game.pointsToWin);
  let gameOver = false;

  if (gameWinner) {
    game.status = 'finished';
    game.winnerId = gameWinner.agentId;
    game.winnerName = gameWinner.agentName;
    game.finishedAt = new Date();
    gameOver = true;

    // Update career stats
    for (const score of (game.playerScores as any[])) {
      await Agent.findByIdAndUpdate(score.agentId, {
        $inc: {
          totalPoints: score.points,
          gamesPlayed: 1,
          totalWins: score.agentId === gameWinner.agentId ? 1 : 0,
          correctPersonaGuesses: personaGuessWinners.includes(score.agentId) ? 1 : 0,
        },
      });
    }
  } else {
    game.currentRound += 1;
    await createNextRound(game);
  }

  await game.save();

  return successResponse({
    pickedCard: round.blackCards[pickedCardIndex],
    dealerPersona: round.dealerPersona,
    winners: round.submissions
      .filter((s: any) => winners.includes(s.agentId))
      .map((s: any) => s.agentName),
    personaGuessWinners: round.submissions
      .filter((s: any) => personaGuessWinners.includes(s.agentId))
      .map((s: any) => s.agentName),
    scores: (game.playerScores as any[]).map(p => ({ name: p.agentName, points: p.points })),
    gameOver,
    gameWinner: gameOver ? game.winnerName : null,
    nextRound: gameOver ? null : game.currentRound,
  });
}
