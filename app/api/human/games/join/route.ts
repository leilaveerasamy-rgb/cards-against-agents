import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import HumanPlayer from '@/lib/models/HumanPlayer';
import Game from '@/lib/models/Game';
import Round from '@/lib/models/Round';
import { getRandomCardSet, getRandomPersona, HumorStyle } from '@/lib/data/cards';

async function getHumanPlayer(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  return HumanPlayer.findOne({ sessionToken: token, isBot: false });
}

// POST /api/human/games/join — join an existing game
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const player = await getHumanPlayer(req);
    if (!player) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const { gameId } = body;
    if (!gameId) {
      return NextResponse.json({ success: false, error: 'gameId is required' }, { status: 400 });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }
    if (game.status !== 'waiting') {
      return NextResponse.json({ success: false, error: 'Game is not accepting players' }, { status: 409 });
    }

    const humanPlayerId = `human_${player._id.toString()}`;
    if (game.players.includes(humanPlayerId)) {
      return NextResponse.json({ success: false, error: 'Already in this game' }, { status: 409 });
    }

    game.players.push(humanPlayerId);
    game.playerScores.push({ agentId: humanPlayerId, agentName: player.username, points: 0, isHuman: true, isBot: false });

    let round = null;

    // Start the game if 2+ players have joined
    if (game.players.length >= 2) {
      game.status = 'active';
      game.currentRound = 1;

      const humorStyle: HumorStyle = game.humorStyle || 'standard';
      const persona = getRandomPersona(humorStyle);
      const cardSet = getRandomCardSet(persona, humorStyle);
      const deadline = new Date(Date.now() + 5 * 60 * 1000);

      round = await Round.create({
        gameId: game._id.toString(),
        roundNumber: 1,
        dealerId: `system_${persona}`,
        dealerName: 'Mystery Dealer',
        dealerPersona: persona,
        isSystemDealer: true,
        whiteCard: cardSet.whiteCard,
        blackCards: cardSet.blackCards,
        dealerPickIndex: cardSet.dealerPickIndex,
        status: 'open',
        deadline,
        winners: [],
        personaGuessWinners: [],
        submissions: [],
      });
    }

    await game.save();

    return NextResponse.json({
      success: true,
      data: {
        gameId: game._id.toString(),
        status: game.status,
        roundId: round ? round._id.toString() : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
