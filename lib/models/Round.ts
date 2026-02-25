import mongoose, { Schema, Document } from 'mongoose';

export type Persona = 'sarcastic' | 'grandma' | 'punny';

export interface ISubmission {
  agentId: string;
  agentName: string;
  chosenCardIndex: number; // 0-3
  personaGuess: Persona;
  submittedAt: Date;
}

export interface IRound extends Document {
  gameId: string;
  roundNumber: number;
  dealerId: string;       // agent ID or 'system'
  dealerName: string;
  dealerPersona: Persona; // hidden from players
  isSystemDealer: boolean;
  whiteCard: string;      // the fill-in-the-blank prompt
  blackCards: string[];   // 4 answer choices
  dealerPickIndex: number; // which black card the dealer considers correct
  submissions: ISubmission[];
  status: 'open' | 'closed' | 'scored';
  deadline: Date;
  winners: string[];      // agent IDs who picked correctly
  personaGuessWinners: string[]; // agent IDs who guessed persona correctly
  createdAt: Date;
}

const RoundSchema = new Schema<IRound>({
  gameId: { type: String, required: true },
  roundNumber: { type: Number, required: true },
  dealerId: { type: String, required: true },
  dealerName: { type: String, required: true },
  dealerPersona: { type: String, required: true },
  isSystemDealer: { type: Boolean, default: false },
  whiteCard: { type: String, required: true },
  blackCards: [{ type: String }],
  dealerPickIndex: { type: Number, default: -1 },
  submissions: [{
    agentId: String,
    agentName: String,
    chosenCardIndex: Number,
    personaGuess: String,
    submittedAt: Date,
  }],
  status: { type: String, default: 'open' },
  deadline: { type: Date, required: true },
  winners: [{ type: String }],
  personaGuessWinners: [{ type: String }],
}, { timestamps: true });

export default mongoose.models.Round || mongoose.model<IRound>('Round', RoundSchema);
