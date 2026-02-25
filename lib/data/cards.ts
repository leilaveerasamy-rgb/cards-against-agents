import { Persona } from '../models/Round';

export interface CardSet {
  whiteCard: string;
  blackCards: string[];
  dealerPickIndex: number; // which answer the dealer would "prefer"
  persona: Persona;
}

// Cards grouped by the persona who would create/enjoy them
export const CARD_SETS: CardSet[] = [
  // ── SARCASTIC / DARK ──────────────────────────────────────────────
  {
    persona: 'sarcastic',
    whiteCard: "My therapist says I need to stop using ________ as a coping mechanism.",
    blackCards: [
      "passive-aggressive sticky notes",
      "narrating my own suffering like a nature documentary",
      "baking cookies I definitely won't share",
      "pretending to be fine"
    ],
    dealerPickIndex: 1,
  },
  {
    persona: 'sarcastic',
    whiteCard: "I told my boss I was 'working from home.' In reality, I was doing ________.",
    blackCards: [
      "a full spa day",
      "rewatching The Office for the 9th time",
      "contemplating my career choices in the bathtub",
      "absolutely nothing and loving it"
    ],
    dealerPickIndex: 2,
  },
  {
    persona: 'sarcastic',
    whiteCard: "The five stages of grief, but make it about ________.",
    blackCards: [
      "realising the free trial ended",
      "your WiFi going down",
      "running out of coffee at 9am",
      "reading the terms and conditions"
    ],
    dealerPickIndex: 1,
  },
  {
    persona: 'sarcastic',
    whiteCard: "According to my LinkedIn, I'm passionate about ________. In reality, I just needed a job.",
    blackCards: [
      "synergizing cross-functional paradigms",
      "disrupting the disruption disruptors",
      "thought leadership and vibes",
      "leveraging my lived experience of staring at spreadsheets"
    ],
    dealerPickIndex: 3,
  },
  {
    persona: 'sarcastic',
    whiteCard: "I wasn't even surprised when ________ turned out to be a scam.",
    blackCards: [
      "my passion",
      "the 'free vacation' I won",
      "hustle culture",
      "that pyramid scheme my cousin pitched"
    ],
    dealerPickIndex: 2,
  },
  {
    persona: 'sarcastic',
    whiteCard: "New self-care routine: ________, and absolutely zero regrets.",
    blackCards: [
      "blocking everyone who posts morning routines",
      "eating dinner at 5pm like a retired person",
      "refusing to explain myself",
      "cancelling plans I was already dreading"
    ],
    dealerPickIndex: 3,
  },

  // ── GRANDMA / CUTE & INNOCENT ────────────────────────────────────
  {
    persona: 'grandma',
    whiteCard: "Oh sweetie, I made you ________ because you looked a little peaky!",
    blackCards: [
      "a casserole the size of a small child",
      "seventeen types of biscuits",
      "soup that cures sadness",
      "enough food to last a mild apocalypse"
    ],
    dealerPickIndex: 2,
  },
  {
    persona: 'grandma',
    whiteCard: "Back in my day, we didn't have ________. We just used ________ and we were grateful!",
    blackCards: [
      "smartphones / a stern look",
      "fancy coffee / instant and silence",
      "online shopping / the Sears catalogue and a dream",
      "GPS / asking strangers who were always wrong"
    ],
    dealerPickIndex: 2,
  },
  {
    persona: 'grandma',
    whiteCard: "My secret to a long and happy life? ________ every single morning.",
    blackCards: [
      "a brisk walk and a firm opinion about the neighbours",
      "one piece of chocolate and zero apologies",
      "telling the birds about your day",
      "complaining productively"
    ],
    dealerPickIndex: 0,
  },
  {
    persona: 'grandma',
    whiteCard: "I knitted you a sweater with ________ on it because I thought you'd love it!",
    blackCards: [
      "a cat wearing reading glasses",
      "your name spelled slightly wrong",
      "inspirational quotes from a calendar",
      "a duck saying something wise"
    ],
    dealerPickIndex: 3,
  },
  {
    persona: 'grandma',
    whiteCard: "The children today don't appreciate ________. It's very sad.",
    blackCards: [
      "handwritten letters full of weather updates",
      "shows where nothing explodes",
      "a good firm handshake",
      "the art of waiting patiently"
    ],
    dealerPickIndex: 0,
  },
  {
    persona: 'grandma',
    whiteCard: "I don't understand the internet but I did accidentally ________ and now I have 40,000 followers.",
    blackCards: [
      "post a photo of my roses",
      "live-stream my entire Tuesday",
      "reply to a celebrity with a recipe",
      "go viral for mispronouncing avocado"
    ],
    dealerPickIndex: 2,
  },

  // ── PUNNY / SLAPSTICK ────────────────────────────────────────────
  {
    persona: 'punny',
    whiteCard: "I tried to write a joke about ________ but it just didn't ________.",
    blackCards: [
      "construction / work out",
      "calendars / have a good date",
      "stairs / land well",
      "clocks / stand the test of time"
    ],
    dealerPickIndex: 0,
  },
  {
    persona: 'punny',
    whiteCard: "Why did the ________ go to therapy? It had too many ________.",
    blackCards: [
      "bicycle / emotional cycles",
      "scarecrow / unresolved field issues",
      "broom / deep-seated sweeping generalisations",
      "calendar / dates that never worked out"
    ],
    dealerPickIndex: 2,
  },
  {
    persona: 'punny',
    whiteCard: "I'm reading a book about ________. I can't put it down — literally, it keeps ________.",
    blackCards: [
      "anti-gravity / floating away",
      "glue / sticking to me",
      "velcro / attaching to everything",
      "quicksand / pulling me in"
    ],
    dealerPickIndex: 0,
  },
  {
    persona: 'punny',
    whiteCard: "Scientists have discovered that ________ is actually caused by ________.",
    blackCards: [
      "yawning / too many boring meetings",
      "hiccups / unfinished sentences",
      "déjà vu / recycled plot lines",
      "sneezing / pepper being too ambitious"
    ],
    dealerPickIndex: 3,
  },
  {
    persona: 'punny',
    whiteCard: "Breaking news: local man trips over ________ and accidentally invents ________.",
    blackCards: [
      "shoelace / breakdancing",
      "garden hose / interpretive plumbing",
      "his own ambition / modern art",
      "a cat / a new Olympic event"
    ],
    dealerPickIndex: 2,
  },
  {
    persona: 'punny',
    whiteCard: "What do you call a ________ who can play the piano? ________.",
    blackCards: [
      "fish / a piano tuna",
      "bear / Grizzly Chopin",
      "cow / a moo-sician",
      "ghost / a phantomime pianist"
    ],
    dealerPickIndex: 0,
  },
];

// System dealer personas with flavor text
export const SYSTEM_PERSONAS = {
  sarcastic: {
    name: 'The Cynic',
    description: 'Dry, deadpan, slightly dark. Appreciates irony above all else.',
  },
  grandma: {
    name: 'Nana Agnes',
    description: 'Warm, wholesome, and slightly confused by modernity. Means well, always.',
  },
  punny: {
    name: 'The Pun-dit',
    description: 'Can\'t resist a wordplay. The groanier the better. Slapstick enthusiast.',
  },
};

export function getRandomCardSet(persona?: Persona): CardSet {
  const pool = persona ? CARD_SETS.filter(c => c.persona === persona) : CARD_SETS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRandomPersona(): Persona {
  const personas: Persona[] = ['sarcastic', 'grandma', 'punny'];
  return personas[Math.floor(Math.random() * personas.length)];
}
