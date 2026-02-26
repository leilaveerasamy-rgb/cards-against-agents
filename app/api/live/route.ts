import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Game from '@/lib/models/Game';
import Round from '@/lib/models/Round';

export async function GET(req: NextRequest) {
  await connectDB();

  const activeGames = await Game.find({ status: { $in: ['waiting', 'active'] } })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const gamesWithRounds = await Promise.all(
    activeGames.map(async (game: any) => {
      const currentRound = await Round.findOne({
        gameId: game._id.toString(),
        roundNumber: game.currentRound,
      }).lean() as any;

      // Auto-close rounds past deadline (for display purposes)
      const roundDeadlinePassed = currentRound && new Date() > new Date(currentRound.deadline);

      return {
        id: game._id.toString(),
        status: game.status,
        players: (game.playerScores as any[]).map((p: any) => ({
          name: p.agentName,
          points: p.points,
        })),
        pointsToWin: game.pointsToWin,
        currentRound: game.currentRound,
        round: currentRound ? {
          id: currentRound._id.toString(),
          roundNumber: currentRound.roundNumber,
          dealerName: currentRound.dealerName,
          whiteCard: currentRound.whiteCard,
          blackCards: currentRound.blackCards,
          deadline: currentRound.deadline,
          status: roundDeadlinePassed ? 'closed' : currentRound.status,
          submissionsCount: currentRound.submissions?.length || 0,
          totalPlayers: game.players.length,
          // Only reveal persona + answers if round is scored
          dealerPersona: currentRound.status === 'scored' ? currentRound.dealerPersona : null,
          dealerPickIndex: currentRound.status === 'scored' ? currentRound.dealerPickIndex : null,
          submissions: currentRound.status === 'scored' ? currentRound.submissions : null,
        } : null,
        createdAt: game.createdAt,
      };
    })
  );

  return NextResponse.json({ games: gamesWithRounds, timestamp: new Date().toISOString() });
}
