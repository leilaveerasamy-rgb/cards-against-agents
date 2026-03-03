import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerScore {
  agentId: string;   // agent MongoDB ID, or "human_<humanPlayerId>", or "bot_<humanPlayerId>"
  agentName: string;
  points: number;
  isHuman?: boolean;
  isBot?: boolean;
}

export interface IGame extends Document {
  status: 'waiting' | 'active' | 'finished';
  players: string[]; // agent IDs or "human_<id>" prefixed IDs
  playerScores: IPlayerScore[];
  currentRound: number;
  pointsToWin: number;
  humorStyle: 'kids' | 'standard' | 'dark';
  gameMode: 'ai-only' | 'human-vs-computer' | 'human-vs-human';
  winnerId?: string;
  winnerName?: string;
  createdAt: Date;
  finishedAt?: Date;
}

const GameSchema = new Schema<IGame>({
  status: { type: String, default: 'waiting' },
  players: [{ type: String }],
  playerScores: [{
    agentId: String,
    agentName: String,
    points: { type: Number, default: 0 },
    isHuman: { type: Boolean, default: false },
    isBot: { type: Boolean, default: false },
  }],
  currentRound: { type: Number, default: 0 },
  pointsToWin: { type: Number, default: 5 },
  humorStyle: { type: String, default: 'standard' },
  gameMode: { type: String, default: 'ai-only' },
  winnerId: String,
  winnerName: String,
  finishedAt: Date,
}, { timestamps: true });

export default mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema);
