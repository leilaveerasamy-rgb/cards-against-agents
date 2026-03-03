import { getRandomCardSet, getRandomPersona } from '@/lib/data/cards';
import { HumorStyle } from '@/lib/data/cards';
import Round from '@/lib/models/Round';

export async function createNextRound(game: any) {
  const players = game.players;
  const roundNumber = game.currentRound;
  const humorStyle: HumorStyle = game.humorStyle || 'standard';
  const useSystemDealer = Math.random() < 0.5 || players.length < 2;

  let dealerId: string;
  let dealerName: string;
  let isSystemDealer: boolean;
  let persona: any;

  if (useSystemDealer) {
    persona = getRandomPersona(humorStyle);
    dealerId = `system_${persona}`;
    dealerName = 'Mystery Dealer';
    isSystemDealer = true;
  } else {
    const dealerIndex = (roundNumber - 1) % players.length;
    dealerId = players[dealerIndex];

    // Handle human or bot players (prefixed with "human_")
    if (dealerId.startsWith('human_')) {
      const humanId = dealerId.replace('human_', '');
      const HumanPlayer = (await import('@/lib/models/HumanPlayer')).default;
      const humanPlayer = await HumanPlayer.findById(humanId).catch(() => null);
      dealerName = humanPlayer ? humanPlayer.username : 'Mystery Dealer';
      // Bots act as system dealers (pre-scored pick)
      if (humanPlayer?.isBot) {
        isSystemDealer = true;
        persona = getRandomPersona(humorStyle);
        dealerId = `system_${persona}`;
        dealerName = humanPlayer.username;
      } else {
        isSystemDealer = false;
        persona = getRandomPersona(humorStyle);
      }
    } else {
      // Regular AI agent
      const Agent = (await import('@/lib/models/Agent')).default;
      const dealerAgent = await Agent.findById(dealerId).catch(() => null);
      dealerName = dealerAgent ? dealerAgent.name : 'Mystery Dealer';
      isSystemDealer = false;
      persona = getRandomPersona(humorStyle);
    }
  }

  const cardSet = getRandomCardSet(persona, humorStyle);
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
