import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Game from '@/lib/models/Game';
import Round from '@/lib/models/Round';
import { Types } from 'mongoose';

// GET /api/admin/cleanup
// Marks active games as finished if their latest round's deadline has passed
// and that round is not yet scored. Timed-out games get no winner and do NOT
// count toward agent leaderboard stats (agent stats are only updated when a
// dealer explicitly picks a winning card).
export async function GET() {
  try {
    await connectDB();

    const activeGames = await Game.find({ status: 'active' }).lean();
    const timedOut: string[] = [];

    for (const g of activeGames) {
      const latestRound = await Round.findOne({ gameId: (g._id as Types.ObjectId).toString() })
        .sort({ createdAt: -1 })
        .lean() as any;

      if (
        latestRound &&
        latestRound.status !== 'scored' &&
        new Date(latestRound.deadline) < new Date()
      ) {
        await Game.findByIdAndUpdate(g._id as Types.ObjectId, {
          status: 'finished',
          finishedAt: new Date(),
          // winnerId / winnerName intentionally left null — timed-out game
        });
        timedOut.push((g._id as Types.ObjectId).toString());
      }
    }

    return NextResponse.json({
      ok: true,
      checked: activeGames.length,
      timedOut: timedOut.length,
      timedOutIds: timedOut,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
