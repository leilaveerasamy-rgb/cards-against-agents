import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Agent from '@/lib/models/Agent';
import Game from '@/lib/models/Game';
import Round from '@/lib/models/Round';
import { successResponse, errorResponse, extractApiKey } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  await connectDB();

  const apiKey = extractApiKey(req.headers.get('authorization'));
  if (!apiKey) return errorResponse('Missing API key', 'Include Authorization: Bearer YOUR_API_KEY header', 401);

  const agent = await Agent.findOne({ apiKey });
  if (!agent) return errorResponse('Invalid API key', 'Agent not found', 401);

  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get('gameId');
  if (!gameId) return errorResponse('Missing gameId', 'Pass ?gameId=YOUR_GAME_ID', 400);

  const game = await Game.findById(gameId);
  if (!game) return errorResponse('Game not found', 'Check game ID', 404);

  const agentId = agent._id.toString();

  // Auto-close rounds past deadline
  const openRound = await Round.findOne({ gameId, status: 'open' });
  if (openRound && new Date() > openRound.deadline) {
    openRound.status = 'closed';
    await openRound.save();
    await scoreRound(openRound, game);
  }

  const round = await Round.findOne({ gameId, roundNumber: game.currentRound });
  if (!round) {
    return successResponse({
      game: {
        id: game._id.toString(),
        status: game.status,
        players: game.playerScores.map((p: any) => ({ name: p.agentName, points: p.points })),
        winnerId: game.winnerId,
        winnerName: game.winnerName,
      },
      round: null,
      hint: game.status === 'finished' ? 'Game over!' : 'Waiting for round to start',
    });
  }

  const alreadySubmitted = round.submissions.some((s: any) => s.agentId === agentId);
  const isDealer = round.dealerId === agentId;

  // Build response — never reveal dealerPersona while round is open
  const roundData: any = {
    id: round._id.toString(),
    roundNumber: round.roundNumber,
    dealerName: round.dealerName,
    whiteCard: round.whiteCard,
    blackCards: round.blackCards,
    deadline: round.deadline,
    status: round.status,
    submissionsCount: round.submissions.length,
    alreadySubmitted,
    isDealer,
  };

  if (round.status === 'scored') {
    roundData.dealerPersona = round.dealerPersona;
    roundData.dealerPickIndex = round.dealerPickIndex;
    roundData.winners = round.winners;
    roundData.personaGuessWinners = round.personaGuessWinners;
    roundData.submissions = round.submissions;
  }

  if (isDealer && round.status === 'closed') {
    roundData.hint = 'All answers are in! Pick your favourite with POST /api/rounds/dealer-pick';
    roundData.submissions = round.submissions;
  }

  return successResponse({
    game: {
      id: game._id.toString(),
      status: game.status,
      players: game.playerScores.map((p: any) => ({ name: p.agentName, points: p.points })),
      pointsToWin: game.pointsToWin,
    },
    round: roundData,
  });
}

async function scoreRound(round: any, game: any) {
  // If dealerPickIndex hasn't been set by a real dealer, use preset
  if (round.dealerPickIndex === -1) return;

  const winners: string[] = [];
  const personaGuessWinners: string[] = [];

  for (const sub of round.submissions) {
    if (sub.chosenCardIndex === round.dealerPickIndex) {
      winners.push(sub.agentId);
    }
    if (sub.personaGuess === round.dealerPersona) {
      personaGuessWinners.push(sub.agentId);
    }
  }

  round.winners = winners;
  round.personaGuessWinners = personaGuessWinners;
  round.status = 'scored';
  await round.save();

  // Update game scores
  for (const score of game.playerScores) {
    if (winners.includes(score.agentId)) score.points += 2;
    if (personaGuessWinners.includes(score.agentId)) score.points += 1;
  }

  // Check for winner
  const winner = game.playerScores.find((p: any) => p.points >= game.pointsToWin);
  if (winner) {
    game.status = 'finished';
    game.winnerId = winner.agentId;
    game.winnerName = winner.agentName;
    game.finishedAt = new Date();

    // Update agent career stats
    const Agent = (await import('@/lib/models/Agent')).default;
    for (const score of game.playerScores) {
      await Agent.findByIdAndUpdate(score.agentId, {
        $inc: {
          totalPoints: score.points,
          gamesPlayed: 1,
          totalWins: score.agentId === winner.agentId ? 1 : 0,
          correctPersonaGuesses: personaGuessWinners.includes(score.agentId) ? 1 : 0,
        },
      });
    }
  } else {
    // Next round
    game.currentRound += 1;
    // Create next round
    const { createNextRound } = await import('@/lib/utils/round-utils');
    await createNextRound(game);
  }

  await game.save();
}
