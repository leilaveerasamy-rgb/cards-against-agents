import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import HumanPlayer from '@/lib/models/HumanPlayer';
import Game from '@/lib/models/Game';
import Round from '@/lib/models/Round';

export const dynamic = 'force-dynamic';

async function getHumanPlayer(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  return HumanPlayer.findOne({ sessionToken: token, isBot: false });
}

// POST /api/human/rounds/submit
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const player = await getHumanPlayer(req);
    if (!player) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const { gameId, roundId, chosenCardIndex, personaGuess } = body;

    if (!gameId || !roundId) {
      return NextResponse.json({ success: false, error: 'gameId and roundId are required' }, { status: 400 });
    }
    if (typeof chosenCardIndex !== 'number' || chosenCardIndex < 0 || chosenCardIndex > 3) {
      return NextResponse.json({ success: false, error: 'chosenCardIndex must be 0-3' }, { status: 400 });
    }
    const validPersonas = ['sarcastic', 'grandma', 'punny'];
    if (!validPersonas.includes(personaGuess)) {
      return NextResponse.json({ success: false, error: 'personaGuess must be sarcastic, grandma, or punny' }, { status: 400 });
    }

    const game = await Game.findById(gameId);
    if (!game || game.status !== 'active') {
      return NextResponse.json({ success: false, error: 'Game not found or not active' }, { status: 404 });
    }

    const myId = `human_${player._id.toString()}`;
    if (!game.players.includes(myId)) {
      return NextResponse.json({ success: false, error: 'Not in this game' }, { status: 403 });
    }

    const round = await Round.findById(roundId);
    if (!round || round.gameId !== gameId) {
      return NextResponse.json({ success: false, error: 'Round not found' }, { status: 404 });
    }
    if (round.status !== 'open') {
      return NextResponse.json({ success: false, error: 'Round is not open for submissions' }, { status: 409 });
    }
    if (new Date(round.deadline) < new Date()) {
      return NextResponse.json({ success: false, error: 'Round deadline has passed' }, { status: 409 });
    }
    if (round.dealerId === myId) {
      return NextResponse.json({ success: false, error: 'Dealers cannot submit answers' }, { status: 409 });
    }

    const alreadySubmitted = round.submissions.some((s: any) => s.agentId === myId);
    if (alreadySubmitted) {
      return NextResponse.json({ success: false, error: 'Already submitted for this round' }, { status: 409 });
    }

    round.submissions.push({
      agentId: myId,
      agentName: player.username,
      chosenCardIndex,
      personaGuess,
      submittedAt: new Date(),
    });

    // Count non-dealer players
    const nonDealerPlayers = game.players.filter((p: string) => {
      if (round.dealerId.startsWith('system_')) return true; // everyone submits against system dealer
      return p !== round.dealerId;
    });

    if (round.submissions.length >= nonDealerPlayers.length) {
      round.status = 'closed';
    }

    await round.save();

    return NextResponse.json({
      success: true,
      data: {
        chosenCard: round.blackCards[chosenCardIndex],
        personaGuess,
        roundStatus: round.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
