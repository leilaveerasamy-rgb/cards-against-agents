import { Persona } from '../models/Round';

export type HumorStyle = 'kids' | 'standard' | 'dark';

export interface CardSet {
  whiteCard: string;
  blackCards: string[];
  dealerPickIndex: number; // which answer the dealer would "prefer"
  persona: Persona;
  humorStyle: HumorStyle; // 'kids' = all ages, 'standard' = adult, 'dark' = edgy
}

// Cards grouped by the persona who would create/enjoy them
export const CARD_SETS: CardSet[] = [
  // ── SARCASTIC / STANDARD ──────────────────────────────────────────────
  {
    persona: 'sarcastic',
    humorStyle: 'standard',
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
    humorStyle: 'standard',
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
    humorStyle: 'standard',
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
    humorStyle: 'standard',
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
    humorStyle: 'standard',
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
    humorStyle: 'standard',
    whiteCard: "New self-care routine: ________, and absolutely zero regrets.",
    blackCards: [
      "blocking everyone who posts morning routines",
      "eating dinner at 5pm like a retired person",
      "refusing to explain myself",
      "cancelling plans I was already dreading"
    ],
    dealerPickIndex: 3,
  },

  // ── GRANDMA / KIDS ────────────────────────────────────────────────────
  {
    persona: 'grandma',
    humorStyle: 'kids',
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
    humorStyle: 'kids',
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
    humorStyle: 'kids',
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
    humorStyle: 'kids',
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
    humorStyle: 'kids',
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
    humorStyle: 'kids',
    whiteCard: "I don't understand the internet but I did accidentally ________ and now I have 40,000 followers.",
    blackCards: [
      "post a photo of my roses",
      "live-stream my entire Tuesday",
      "reply to a celebrity with a recipe",
      "go viral for mispronouncing avocado"
    ],
    dealerPickIndex: 2,
  },

  // ── PUNNY / KIDS ────────────────────────────────────────────────────
  {
    persona: 'punny',
    humorStyle: 'kids',
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
    humorStyle: 'kids',
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
    humorStyle: 'kids',
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
    humorStyle: 'kids',
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
    humorStyle: 'kids',
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
    humorStyle: 'kids',
    whiteCard: "What do you call a ________ who can play the piano? ________.",
    blackCards: [
      "fish / a piano tuna",
      "bear / Grizzly Chopin",
      "cow / a moo-sician",
      "ghost / a phantomime pianist"
    ],
    dealerPickIndex: 0,
  },

  // ── EXTRA KIDS CARDS (grandma + punny personas) ───────────────────────
  {
    persona: 'punny',
    humorStyle: 'kids',
    whiteCard: "My dog learned to ________ and now I absolutely cannot get them to stop.",
    blackCards: [
      "open the fridge",
      "sit like a human at the dinner table",
      "steal socks one at a time and hide them",
      "bark in rhymes"
    ],
    dealerPickIndex: 2,
  },
  {
    persona: 'grandma',
    humorStyle: 'kids',
    whiteCard: "The best thing about summer is definitely ________.",
    blackCards: [
      "ice cream for breakfast when nobody's watching",
      "staying up past bedtime because it's still light out",
      "the smell of sun cream and good intentions",
      "forgetting what day it is in the nicest possible way"
    ],
    dealerPickIndex: 0,
  },
  {
    persona: 'punny',
    humorStyle: 'kids',
    whiteCard: "A wizard cast a spell and now my pet can ________. This is fine.",
    blackCards: [
      "give me homework feedback",
      "order pizza using only eye contact",
      "predict the weather but refuse to share results",
      "speak fluent sarcasm"
    ],
    dealerPickIndex: 1,
  },
  {
    persona: 'grandma',
    humorStyle: 'kids',
    whiteCard: "If I ruled the school, the first thing I'd change is ________.",
    blackCards: [
      "mandatory nap time after lunch",
      "pizza Fridays, but on every day",
      "a dedicated room just for pets",
      "all exams replaced with board games"
    ],
    dealerPickIndex: 3,
  },

  // ── DARK HUMOR CARDS (sarcastic persona, adults only) ─────────────────
  {
    persona: 'sarcastic',
    humorStyle: 'dark',
    whiteCard: "According to my calendar, I have ________ scheduled at the exact same time as my will to live.",
    blackCards: [
      "a team-building exercise",
      "a 'quick sync' that could have been an email",
      "a performance review",
      "a mandatory fun activity"
    ],
    dealerPickIndex: 1,
  },
  {
    persona: 'sarcastic',
    humorStyle: 'dark',
    whiteCard: "My legacy won't be my career or achievements. It'll be ________.",
    blackCards: [
      "my extensive collection of unread notification emails",
      "the browser tabs I died with open",
      "a truly legendary number of unfinished side projects",
      "my ability to look busy while doing absolutely nothing"
    ],
    dealerPickIndex: 2,
  },
  {
    persona: 'sarcastic',
    humorStyle: 'dark',
    whiteCard: "Scientists have confirmed: the leading cause of existential dread is ________.",
    blackCards: [
      "accidentally making eye contact with your reflection at 3am",
      "realising you have the same 24 hours as successful people",
      "opening your banking app on a whim",
      "being asked 'where do you see yourself in five years?'"
    ],
    dealerPickIndex: 3,
  },
  {
    persona: 'sarcastic',
    humorStyle: 'dark',
    whiteCard: "My motivational poster says: 'You can do anything.' My lived experience says: ________.",
    blackCards: [
      "read the fine print",
      "terms and conditions apply, void where prohibited by physics",
      "results may vary, side effects include crushing self-doubt",
      "consult a professional before attempting optimism"
    ],
    dealerPickIndex: 0,
  },
  {
    persona: 'sarcastic',
    humorStyle: 'dark',
    whiteCard: "I've decided to embrace ________ as my whole personality, since I have nothing else going on.",
    blackCards: [
      "aggressively mediocre ambitions",
      "having strong opinions about font choices",
      "being the person who brings up data privacy at parties",
      "my very specific coffee order that signals a cry for help"
    ],
    dealerPickIndex: 2,
  },
  {
    persona: 'sarcastic',
    humorStyle: 'dark',
    whiteCard: "My therapist asked what I do for fun. After a long pause, I said ________.",
    blackCards: [
      "doom-scroll until I feel something",
      "optimise systems that don't need optimising",
      "narrate my own decline in the third person",
      "start creative projects in a burst of hope and abandon them"
    ],
    dealerPickIndex: 3,
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

export function getRandomCardSet(persona?: Persona, humorStyle?: HumorStyle): CardSet {
  let pool = [...CARD_SETS];

  // Filter by humor style
  if (humorStyle === 'kids') {
    pool = pool.filter(c => c.humorStyle === 'kids');
  } else if (humorStyle === 'standard') {
    pool = pool.filter(c => c.humorStyle === 'kids' || c.humorStyle === 'standard');
  }
  // 'dark' includes all cards — no filter needed

  // Filter by persona if specified
  if (persona) {
    pool = pool.filter(c => c.persona === persona);
  }

  // Fallback to all cards if pool is somehow empty
  if (pool.length === 0) pool = CARD_SETS;

  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRandomPersona(humorStyle?: HumorStyle): Persona {
  if (humorStyle === 'kids') {
    // Kids mode: only wholesome personas
    const kidsPersonas: Persona[] = ['grandma', 'punny'];
    return kidsPersonas[Math.floor(Math.random() * kidsPersonas.length)];
  }
  const personas: Persona[] = ['sarcastic', 'grandma', 'punny'];
  return personas[Math.floor(Math.random() * personas.length)];
}
