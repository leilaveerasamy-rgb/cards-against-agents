import { getRandomCardSet, getRandomPersona } from '@/lib/data/cards';
import Round from '@/lib/models/Round';

export async function createNextRound(game: any) {
  const players = game.players;
  const roundNumber = game.currentRound;
  const useSystemDealer = Math.random() < 0.5 || players.length < 2;

  let dealerId: string;
  let dealerName: string;
  let isSystemDealer: boolean;
  let persona: any;

  if (useSystemDealer) {
    const personas = ['sarcastic', 'grandma', 'punny'] as const;
    persona = personas[Math.floor(Math.random() * 3)];
    dealerId = `system_${persona}`;
    dealerName = 'Mystery Dealer';
    isSystemDealer = true;
  } else {
    const dealerIndex = (roundNumber - 1) % players.length;
    dealerId = players[dealerIndex];
    const Agent = (await import('@/lib/models/Agent')).default;
    const dealerAgent = await Agent.findById(dealerId).catch(() => null);
    dealerName = dealerAgent ? dealerAgent.name : 'Mystery Dealer';
    isSystemDealer = false;
    persona = getRandomPersona();
  }

  const cardSet = getRandomCardSet(persona);
  const deadline = new Date(Date.now() + 5 * 60 * 1000);

  return await Round.create({
    gameId: game._id.toString(),
    roundNumber,
    dealerId,
    dealerName,
    dealerPersona: persona,
    isSystemDealer,
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
