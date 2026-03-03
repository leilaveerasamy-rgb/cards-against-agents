import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import HumanPlayer from '@/lib/models/HumanPlayer';
import Game from '@/lib/models/Game';
import Round from '@/lib/models/Round';
import { getRandomCardSet, getRandomPersona, HumorStyle } from '@/lib/data/cards';
import { randomBytes } from 'crypto';

async function getHumanPlayer(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  return HumanPlayer.findOne({ sessionToken: token, isBot: false });
}

function generateBotToken(): string {
  return 'bot_' + randomBytes(16).toString('hex');
}

async function createRoundForGame(game: any) {
  const humorStyle: HumorStyle = game.humorStyle || 'standard';
  const persona = getRandomPersona(humorStyle);
  const cardSet = getRandomCardSet(persona, humorStyle);
  const deadline = new Date(Date.now() + 5 * 60 * 1000);

  return Round.create({
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

// POST /api/human/games — create a new game
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const player = await getHumanPlayer(req);
    if (!player) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const humorStyle: HumorStyle = ['kids', 'standard', 'dark'].includes(body.humorStyle)
      ? body.humorStyle : 'standard';
    const gameMode = ['human-vs-computer', 'human-vs-human'].includes(body.gameMode)
      ? body.gameMode : 'human-vs-computer';
    const pointsToWin = Math.min(Math.max(parseInt(body.pointsToWin) || 5, 3), 10);

    const playerId = player._id.toString();
    const humanPlayerId = `human_${playerId}`;

    const game = await Game.create({
      status: 'waiting',
      players: [humanPlayerId],
      playerScores: [{ agentId: humanPlayerId, agentName: player.username, points: 0, isHuman: true, isBot: false }],
      currentRound: 0,
      pointsToWin,
      humorStyle,
      gameMode,
    });

    // For vs-computer mode, automatically add a bot and start the game
    if (gameMode === 'human-vs-computer') {
      // Create or reuse a bot player
      let bot = await HumanPlayer.findOne({ isBot: true, username: 'RoboPlayer' });
      if (!bot) {
        bot = await HumanPlayer.create({
          username: 'RoboPlayer',
          sessionToken: generateBotToken(),
          isBot: true,
        });
      }

      const botId = `human_${bot._id.toString()}`;
      game.players.push(botId);
      game.playerScores.push({ agentId: botId, agentName: 'RoboPlayer 🤖', points: 0, isHuman: false, isBot: true });
      game.status = 'active';
      game.currentRound = 1;
      await game.save();

      // Create the first round
      await createRoundForGame(game);
    }

    return NextResponse.json({
      success: true,
      data: {
        gameId: game._id.toString(),
        status: game.status,
        humorStyle: game.humorStyle,
        gameMode: game.gameMode,
        pointsToWin: game.pointsToWin,
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET /api/human/games — list joinable human-vs-human games
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const player = await getHumanPlayer(req);
    if (!player) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const games = await Game.find({
      status: 'waiting',
      gameMode: 'human-vs-human',
    }).sort({ createdAt: -1 }).limit(20);

    return NextResponse.json({
      success: true,
      data: games.map(g => ({
        id: g._id.toString(),
        status: g.status,
        humorStyle: g.humorStyle,
        pointsToWin: g.pointsToWin,
        players: g.playerScores.map(p => ({ name: p.agentName, points: p.points })),
        createdAt: g.createdAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
