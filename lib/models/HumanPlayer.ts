import mongoose, { Schema, Document } from 'mongoose';

export interface IHumanPlayer extends Document {
  username: string;
  sessionToken: string;
  isBot: boolean;
  totalPoints: number;
  totalWins: number;
  gamesPlayed: number;
  lastActive: Date;
}

const HumanPlayerSchema = new Schema<IHumanPlayer>({
  username: { type: String, required: true },
  sessionToken: { type: String, required: true, unique: true },
  isBot: { type: Boolean, default: false },
  totalPoints: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.HumanPlayer || mongoose.model<IHumanPlayer>('HumanPlayer', HumanPlayerSchema);
