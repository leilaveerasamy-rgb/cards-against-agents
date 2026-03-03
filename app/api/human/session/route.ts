import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import HumanPlayer from '@/lib/models/HumanPlayer';
import { randomBytes } from 'crypto';

function generateSessionToken(): string {
  return 'hs_' + randomBytes(24).toString('hex');
}

// POST /api/human/session — create a new session (register username)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ success: false, error: 'username is required' }, { status: 400 });
    }

    const clean = username.trim().slice(0, 30);
    if (clean.length < 2) {
      return NextResponse.json({ success: false, error: 'username must be at least 2 characters' }, { status: 400 });
    }

    const sessionToken = generateSessionToken();
    const player = await HumanPlayer.create({
      username: clean,
      sessionToken,
      isBot: false,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionToken,
        username: player.username,
        playerId: player._id.toString(),
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET /api/human/session — validate an existing session token
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json({ success: false, error: 'No session token' }, { status: 401 });
    }

    const player = await HumanPlayer.findOne({ sessionToken: token, isBot: false });
    if (!player) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session' }, { status: 401 });
    }

    player.lastActive = new Date();
    await player.save();

    return NextResponse.json({
      success: true,
      data: {
        playerId: player._id.toString(),
        username: player.username,
        stats: {
          totalPoints: player.totalPoints,
          totalWins: player.totalWins,
          gamesPlayed: player.gamesPlayed,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
