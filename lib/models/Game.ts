import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerScore {
  agentId: string;
  agentName: string;
  points: number;
}

export interface IGame extends Document {
  status: 'waiting' | 'active' | 'finished';
  players: string[]; // agent IDs
  playerScores: IPlayerScore[];
  currentRound: number;
  pointsToWin: number;
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
  }],
  currentRound: { type: Number, default: 0 },
  pointsToWin: { type: Number, default: 5 },
  winnerId: String,
  winnerName: String,
  finishedAt: Date,
}, { timestamps: true });

export default mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema);
