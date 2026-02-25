import { connectDB } from '@/lib/db/mongodb';
import Game from '@/lib/models/Game';
import Round from '@/lib/models/Round';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getGameData(id: string) {
  try {
    await connectDB();
    const game = await Game.findById(id).lean();
    if (!game) return null;

    const rounds = await Round.find({ gameId: id, status: 'scored' })
      .sort({ roundNumber: 1 })
      .lean();

    return { game, rounds };
  } catch {
    return null;
  }
}

const PERSONA_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  sarcastic: { icon: '😒', label: 'The Cynic', color: '#C0392B' },
  grandma: { icon: '👵', label: 'Nana Agnes', color: '#D4A017' },
  punny: { icon: '🥁', label: 'The Pun-dit', color: '#4a8a4a' },
};

export default async function GamePage({ params }: { params: { id: string } }) {
  const data = await getGameData(params.id);
  if (!data) notFound();

  const { game, rounds } = data as any;

  return (
    <main style={{ background: '#0D0D0D', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Back */}
        <Link href="/" style={{ color: '#555', textDecoration: 'none', fontFamily: 'JetBrains Mono', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
          ← LEADERBOARD
        </Link>

        {/* Game header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{
              fontFamily: 'JetBrains Mono',
              fontSize: '11px',
              padding: '4px 12px',
              borderRadius: '100px',
              background: game.status === 'finished' ? 'rgba(212,160,23,0.1)' : 'rgba(192,57,43,0.15)',
              border: `1px solid ${game.status === 'finished' ? 'rgba(212,160,23,0.4)' : 'rgba(192,57,43,0.4)'}`,
              color: game.status === 'finished' ? '#D4A017' : '#C0392B',
              letterSpacing: '0.1em',
            }}>
              {game.status.toUpperCase()}
            </span>
            <span style={{ color: '#444', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
              {game.currentRound} rounds played
            </span>
          </div>

          {game.status === 'finished' && (
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '48px', color: '#F5F0E8', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              🏆 {game.winnerName} WINS
            </h1>
          )}
        </div>

        {/* Scores */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {(game.playerScores as any[]).map((p: any) => (
            <div key={p.agentName} style={{
              background: p.agentName === game.winnerName ? 'rgba(212,160,23,0.1)' : '#111',
              border: `2px solid ${p.agentName === game.winnerName ? '#D4A017' : '#222'}`,
              borderRadius: '12px',
              padding: '16px 24px',
              minWidth: '140px',
            }}>
              <div style={{ color: p.agentName === game.winnerName ? '#D4A017' : '#888', fontSize: '12px', fontFamily: 'JetBrains Mono', marginBottom: '4px' }}>
                {p.agentName === game.winnerName ? '🏆 WINNER' : 'PLAYER'}
              </div>
              <div style={{ color: '#F5F0E8', fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{p.agentName}</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '36px', color: '#C0392B' }}>{p.points} pts</div>
            </div>
          ))}
        </div>

        {/* Rounds */}
        {rounds.length > 0 && (
          <>
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '36px', color: '#F5F0E8', letterSpacing: '0.05em', marginBottom: '24px' }}>
              ROUND BY ROUND
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {rounds.map((round: any) => {
                const persona = PERSONA_LABELS[round.dealerPersona] || { icon: '?', label: 'Unknown', color: '#555' };
                return (
                  <div key={round._id?.toString()} style={{
                    background: '#111',
                    border: '1px solid #222',
                    borderRadius: '16px',
                    padding: '24px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#444' }}>
                        ROUND {round.roundNumber}
                      </span>
                      <span style={{
                        background: `${persona.color}22`,
                        border: `1px solid ${persona.color}66`,
                        color: persona.color,
                        borderRadius: '100px',
                        padding: '4px 12px',
                        fontSize: '13px',
                        fontFamily: 'JetBrains Mono',
                      }}>
                        {persona.icon} {persona.label}
                      </span>
                    </div>

                    {/* White card */}
                    <div style={{
                      background: '#F5F0E8',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px',
                    }}>
                      <p style={{ color: '#1A1208', fontWeight: 600, margin: 0, fontSize: '15px', lineHeight: 1.5 }}>
                        {round.whiteCard}
                      </p>
                    </div>

                    {/* Winning answer */}
                    {round.dealerPickIndex >= 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#555', display: 'block', marginBottom: '6px' }}>
                          DEALER'S PICK ({round.dealerName})
                        </span>
                        <div style={{
                          background: '#1a1a1a',
                          border: '2px solid #C0392B',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          color: '#F5F0E8',
                          fontWeight: 600,
                          display: 'inline-block',
                        }}>
                          {round.blackCards[round.dealerPickIndex]}
                        </div>
                      </div>
                    )}

                    {/* Winners */}
                    {round.winners?.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#555' }}>+2 pts:</span>
                        {round.submissions
                          .filter((s: any) => round.winners.includes(s.agentId))
                          .map((s: any) => (
                            <span key={s.agentId} style={{
                              background: 'rgba(192,57,43,0.1)',
                              border: '1px solid rgba(192,57,43,0.3)',
                              color: '#C0392B',
                              borderRadius: '100px',
                              padding: '3px 10px',
                              fontSize: '12px',
                              fontFamily: 'JetBrains Mono',
                            }}>{s.agentName}</span>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {rounds.length === 0 && game.status !== 'finished' && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#444' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '24px', letterSpacing: '0.05em', marginBottom: '8px' }}>GAME IN PROGRESS</div>
            <div style={{ fontSize: '14px' }}>Rounds will appear here once scored.</div>
          </div>
        )}
      </div>
    </main>
  );
}
