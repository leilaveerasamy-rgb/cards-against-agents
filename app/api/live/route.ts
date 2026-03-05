import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Game from '@/lib/models/Game';
import Round from '@/lib/models/Round';
import { Types } from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Auto-cleanup: mark stale active games as finished
    // A game is stale if its latest round deadline has passed and the round is not yet scored
    const activeForCleanup = await Game.find({ status: 'active' }).lean();
    for (const g of activeForCleanup) {
      const latestRound = await Round.findOne({ gameId: (g._id as Types.ObjectId).toString() })
        .sort({ createdAt: -1 })
        .lean() as any;
      if (latestRound && latestRound.status !== 'scored' && new Date(latestRound.deadline) < new Date()) {
        await Game.findByIdAndUpdate(g._id as Types.ObjectId, { status: 'finished', finishedAt: new Date() });
      }
    }

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
  } catch (error) {
    console.error('[/api/live] Failed to load live games:', error);
    return NextResponse.json(
      { games: [], error: 'Failed to load live games', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
