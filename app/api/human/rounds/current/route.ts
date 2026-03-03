import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
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

// Score a closed round for system dealers
async function scoreClosedRound(round: any, game: any) {
  if (round.status !== 'closed' || !round.isSystemDealer) return;

  const winnerIds: string[] = [];
  const personaWinnerIds: string[] = [];

  for (const sub of round.submissions) {
    if (sub.chosenCardIndex === round.dealerPickIndex) {
      winnerIds.push(sub.agentId);
    }
    if (sub.personaGuess === round.dealerPersona) {
      personaWinnerIds.push(sub.agentId);
    }
  }

  round.winners = winnerIds;
  round.personaGuessWinners = personaWinnerIds;
  round.status = 'scored';
  await round.save();

  // Award points
  for (const score of game.playerScores) {
    if (winnerIds.includes(score.agentId)) score.points += 2;
    if (personaWinnerIds.includes(score.agentId)) score.points += 1;
  }

  // Check for winner
  const topScore = Math.max(...game.playerScores.map((s: any) => s.points));
  if (topScore >= game.pointsToWin) {
    const winner = game.playerScores.find((s: any) => s.points === topScore);
    game.status = 'finished';
    game.winnerId = winner?.agentId;
    game.winnerName = winner?.agentName;
    game.finishedAt = new Date();

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
    await game.save();
    await createNextRound(game);
    return;
  }

  await game.save();
}

// GET /api/human/rounds/current?gameId=<id>
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const player = await getHumanPlayer(req);
    if (!player) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const gameId = req.nextUrl.searchParams.get('gameId');
    if (!gameId) {
      return NextResponse.json({ success: false, error: 'gameId is required' }, { status: 400 });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    const myId = `human_${player._id.toString()}`;
    if (!game.players.includes(myId)) {
      return NextResponse.json({ success: false, error: 'Not in this game' }, { status: 403 });
    }

    if (game.status === 'finished') {
      return NextResponse.json({
        success: true,
        data: {
          game: {
            id: game._id.toString(),
            status: 'finished',
            playerScores: game.playerScores,
            winnerName: game.winnerName,
            pointsToWin: game.pointsToWin,
            currentRound: game.currentRound,
          },
          round: null,
        },
      });
    }

    const round = await Round.findOne({
      gameId: game._id.toString(),
      roundNumber: game.currentRound,
    });

    if (!round) {
      return NextResponse.json({ success: true, data: { game: { id: game._id.toString(), status: game.status, playerScores: game.playerScores }, round: null } });
    }

    // Auto-close expired open rounds
    if (round.status === 'open' && new Date(round.deadline) < new Date()) {
      round.status = 'closed';
      await round.save();
    }

    // Auto-submit for bot if human has already submitted
    const humanSubmitted = round.submissions.some((s: any) => s.agentId === myId);
    if (humanSubmitted && round.status === 'open') {
      const botScore = game.playerScores.find((s: any) => s.isBot);
      if (botScore) {
        const botAlreadySubmitted = round.submissions.some((s: any) => s.agentId === botScore.agentId);
        const botIsDealer = round.dealerId === `human_${botScore.agentId.replace('human_', '')}` || round.dealerId.startsWith('system_');
        if (!botAlreadySubmitted && !botIsDealer) {
          const personas = ['sarcastic', 'grandma', 'punny'] as const;
          round.submissions.push({
            agentId: botScore.agentId,
            agentName: botScore.agentName,
            chosenCardIndex: Math.floor(Math.random() * 4),
            personaGuess: personas[Math.floor(Math.random() * 3)],
            submittedAt: new Date(),
          });

          // Check if all non-dealer players have submitted
          const nonDealerPlayers = game.players.filter((p: string) => {
            const normalizedDealer = round.dealerId.startsWith('system_') ? null : round.dealerId;
            return p !== normalizedDealer;
          });
          if (round.submissions.length >= nonDealerPlayers.length) {
            round.status = 'closed';
          }
          await round.save();
        }
      }
    }

    // Auto-score closed system-dealer rounds
    if (round.status === 'closed' && round.isSystemDealer) {
      await scoreClosedRound(round, game);
      // Re-fetch updated state
      const freshGame = await Game.findById(gameId);
      const freshRound = await Round.findOne({ gameId, roundNumber: freshGame!.currentRound });
      return NextResponse.json({
        success: true,
        data: buildResponse(myId, freshGame!, freshRound, round),
      });
    }

    return NextResponse.json({
      success: true,
      data: buildResponse(myId, game, round, null),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function buildResponse(myId: string, game: any, round: any, prevRound: any) {
  const mySubmission = round
    ? round.submissions.find((s: any) => s.agentId === myId) || null
    : null;
  const isDealer = round && (
    round.dealerId === myId ||
    (round.dealerId.startsWith('system_') && false)
  );
  const isSystemDealer = round?.isSystemDealer;

  return {
    game: {
      id: game._id.toString(),
      status: game.status,
      playerScores: game.playerScores,
      winnerName: game.winnerName || null,
      pointsToWin: game.pointsToWin,
      currentRound: game.currentRound,
      humorStyle: game.humorStyle,
    },
    round: round ? {
      id: round._id.toString(),
      roundNumber: round.roundNumber,
      dealerName: round.dealerName,
      dealerId: round.dealerId,
      isSystemDealer: round.isSystemDealer,
      whiteCard: round.whiteCard,
      blackCards: round.blackCards,
      deadline: round.deadline,
      status: round.status,
      dealerPersona: round.status === 'scored' ? round.dealerPersona : null,
      dealerPickIndex: round.status === 'scored' ? round.dealerPickIndex : null,
      submissions: round.status === 'scored' ? round.submissions : null,
      submissionsCount: round.submissions.length,
    } : null,
    mySubmission: mySubmission ? {
      chosenCardIndex: mySubmission.chosenCardIndex,
      personaGuess: mySubmission.personaGuess,
    } : null,
    isDealer: !!isDealer,
    isSystemDealer: !!isSystemDealer,
    previousRound: prevRound ? {
      id: prevRound._id.toString(),
      dealerPickIndex: prevRound.dealerPickIndex,
      dealerPersona: prevRound.dealerPersona,
      winners: prevRound.winners,
      personaGuessWinners: prevRound.personaGuessWinners,
      submissions: prevRound.submissions,
      blackCards: prevRound.blackCards,
      whiteCard: prevRound.whiteCard,
    } : null,
  };
}
