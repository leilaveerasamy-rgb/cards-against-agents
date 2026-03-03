import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import HumanPlayer from '@/lib/models/HumanPlayer';
import Game from '@/lib/models/Game';
import Round from '@/lib/models/Round';
import { createNextRound } from '@/lib/utils/round-utils';

async function getHumanPlayer(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  return HumanPlayer.findOne({ sessionToken: token, isBot: false });
}

// POST /api/human/rounds/dealer-pick
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const player = await getHumanPlayer(req);
    if (!player) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const { gameId, roundId, pickedCardIndex } = body;

    if (!gameId || !roundId) {
      return NextResponse.json({ success: false, error: 'gameId and roundId are required' }, { status: 400 });
    }
    if (typeof pickedCardIndex !== 'number' || pickedCardIndex < 0 || pickedCardIndex > 3) {
      return NextResponse.json({ success: false, error: 'pickedCardIndex must be 0-3' }, { status: 400 });
    }

    const game = await Game.findById(gameId);
    if (!game || game.status !== 'active') {
      return NextResponse.json({ success: false, error: 'Game not found or not active' }, { status: 404 });
    }

    const myId = `human_${player._id.toString()}`;
    const round = await Round.findById(roundId);
    if (!round || round.gameId !== gameId) {
      return NextResponse.json({ success: false, error: 'Round not found' }, { status: 404 });
    }
    if (round.dealerId !== myId) {
      return NextResponse.json({ success: false, error: 'Only the dealer can pick' }, { status: 403 });
    }
    if (round.status !== 'closed') {
      return NextResponse.json({ success: false, error: 'Round is not closed yet' }, { status: 409 });
    }

    // Score the round
    const winnerIds: string[] = [];
    const personaWinnerIds: string[] = [];

    for (const sub of round.submissions) {
      if (sub.chosenCardIndex === pickedCardIndex) winnerIds.push(sub.agentId);
      if (sub.personaGuess === round.dealerPersona) personaWinnerIds.push(sub.agentId);
    }

    round.dealerPickIndex = pickedCardIndex;
    round.winners = winnerIds;
    round.personaGuessWinners = personaWinnerIds;
    round.status = 'scored';
    await round.save();

    // Award points
    for (const score of game.playerScores) {
      if (winnerIds.includes(score.agentId)) score.points += 2;
      if (personaWinnerIds.includes(score.agentId)) score.points += 1;
    }

    // Check for game winner
    const topScore = Math.max(...game.playerScores.map((s: any) => s.points));
    let gameOver = false;
    let gameWinner = null;

    if (topScore >= game.pointsToWin) {
      const winner = game.playerScores.find((s: any) => s.points === topScore);
      game.status = 'finished';
      game.winnerId = winner?.agentId;
      game.winnerName = winner?.agentName;
      game.finishedAt = new Date();
      gameOver = true;
      gameWinner = winner?.agentName;

      // Update career stats for human players
      for (const score of game.playerScores) {
        if (score.agentId.startsWith('human_')) {
          const humanId = score.agentId.replace('human_', '');
          await HumanPlayer.findByIdAndUpdate(humanId, {
            $inc: {
              totalPoints: score.points,
              gamesPlayed: 1,
              totalWins: score.agentId === winner?.agentId ? 1 : 0,
            },
          });
        }
      }
    } else {
      game.currentRound += 1;
    }

    await game.save();

    if (!gameOver) {
      await createNextRound(game);
    }

    return NextResponse.json({
      success: true,
      data: {
        pickedCard: round.blackCards[pickedCardIndex],
        dealerPersona: round.dealerPersona,
        winners: winnerIds,
        personaGuessWinners: personaWinnerIds,
        scores: game.playerScores,
        gameOver,
        gameWinner,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
