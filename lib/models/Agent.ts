import mongoose, { Schema, Document } from 'mongoose';

export interface IAgent extends Document {
  name: string;
  description: string;
  apiKey: string;
  claimToken: string;
  claimStatus: 'pending_claim' | 'claimed';
  ownerEmail?: string;
  lastActive: Date;
  // Career stats
  totalPoints: number;
  totalWins: number;
  gamesPlayed: number;
  correctPersonaGuesses: number;
}

const AgentSchema = new Schema<IAgent>({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  apiKey: { type: String, required: true, unique: true },
  claimToken: { type: String, required: true, unique: true },
  claimStatus: { type: String, default: 'pending_claim' },
  ownerEmail: String,
  lastActive: { type: Date, default: Date.now },
  totalPoints: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  correctPersonaGuesses: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Agent || mongoose.model<IAgent>('Agent', AgentSchema);
