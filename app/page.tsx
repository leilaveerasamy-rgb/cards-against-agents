'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PlayerScore {
  name: string;
  points: number;
}

interface Round {
  id: string;
  roundNumber: number;
  dealerName: string;
  whiteCard: string;
  blackCards: string[];
  deadline: string;
  status: string;
  submissionsCount: number;
  totalPlayers: number;
  dealerPersona: string | null;
  dealerPickIndex: number | null;
  submissions: any[] | null;
}

interface Game {
  id: string;
  status: string;
  players: PlayerScore[];
  pointsToWin: number;
  currentRound: number;
  round: Round | null;
  createdAt: string;
}

const PERSONA_DATA: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  sarcastic: { icon: '😒', label: 'The Cynic', color: '#C0392B', bg: 'rgba(192,57,43,0.15)' },
  grandma: { icon: '👵', label: 'Nana Agnes', color: '#D4A017', bg: 'rgba(212,160,23,0.15)' },
  punny: { icon: '🥁', label: 'The Pun-dit', color: '#4a8a4a', bg: 'rgba(74,138,74,0.15)' },
};

function Countdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Closed'); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 30000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
      color: urgent ? '#C0392B' : '#888',
      animation: urgent ? 'pulse 1s infinite' : 'none',
    }}>
      {timeLeft === 'Closed' ? '🔴 Closed' : `⏱ ${timeLeft}`}
    </span>
  );
}

function SubmissionBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: '#666', fontFamily: 'JetBrains Mono' }}>ANSWERS IN</span>
        <span style={{ fontSize: '12px', color: '#F5F0E8', fontFamily: 'JetBrains Mono' }}>{count}/{total}</span>
      </div>
      <div style={{ height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct === 100 ? '#4a8a4a' : '#C0392B',
          borderRadius: '2px',
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

function ScoreBar({ players, pointsToWin }: { players: PlayerScore[]; pointsToWin: number }) {
  const sorted = [...players].sort((a, b) => b.points - a.points);
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {sorted.map((p, i) => (
        <div key={p.name} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: i === 0 && p.points > 0 ? 'rgba(212,160,23,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${i === 0 && p.points > 0 ? 'rgba(212,160,23,0.3)' : '#222'}`,
          borderRadius: '100px',
          padding: '5px 12px',
        }}>
          <span style={{ fontSize: '13px', color: '#ccc' }}>{p.name}</span>
          <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '18px', color: '#C0392B' }}>{p.points}</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {Array.from({ length: pointsToWin }).map((_, j) => (
              <div key={j} style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: j < p.points ? '#C0392B' : '#333',
              }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  const round = game.round;
  const nonDealerCount = Math.max(game.players.length - 1, 1);

  return (
    <div style={{
      background: '#111',
      border: '1px solid #222',
      borderRadius: '20px',
      overflow: 'hidden',
      animation: 'fadeIn 0.4s ease',
    }}>
      {/* Game header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: game.status === 'active' ? 'rgba(74,138,74,0.15)' : 'rgba(212,160,23,0.15)',
            border: `1px solid ${game.status === 'active' ? 'rgba(74,138,74,0.4)' : 'rgba(212,160,23,0.4)'}`,
            color: game.status === 'active' ? '#4a8a4a' : '#D4A017',
            borderRadius: '100px',
            padding: '4px 12px',
            fontSize: '11px',
            fontFamily: 'JetBrains Mono',
            letterSpacing: '0.1em',
          }}>
            {game.status === 'active' ? (
              <><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4a8a4a', display: 'inline-block' }} /> LIVE</>
            ) : '⏳ WAITING'}
          </span>
          <span style={{ color: '#555', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
            Round {game.currentRound} · First to {game.pointsToWin}pts
          </span>
        </div>
        <ScoreBar players={game.players} pointsToWin={game.pointsToWin} />
      </div>

      {/* Round content */}
      {round ? (
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#444', letterSpacing: '0.1em' }}>
              DEALER: {round.dealerName}
            </span>
            {round.status === 'open' && <Countdown deadline={round.deadline} />}
            {round.status === 'closed' && (
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#D4A017' }}>
                🔔 Waiting for dealer's pick...
              </span>
            )}
            {round.status === 'scored' && round.dealerPersona && (
              <span style={{
                background: PERSONA_DATA[round.dealerPersona]?.bg,
                border: `1px solid ${PERSONA_DATA[round.dealerPersona]?.color}66`,
                color: PERSONA_DATA[round.dealerPersona]?.color,
                borderRadius: '100px',
                padding: '4px 12px',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono',
              }}>
                {PERSONA_DATA[round.dealerPersona]?.icon} {PERSONA_DATA[round.dealerPersona]?.label} REVEALED
              </span>
            )}
          </div>

          {/* White card */}
          <div style={{
            background: '#F5F0E8',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: '12px', right: '14px', fontSize: '20px', opacity: 0.3 }}>🃏</div>
            <p style={{
              color: '#1A1208',
              fontWeight: 700,
              margin: 0,
              fontSize: '17px',
              lineHeight: 1.5,
              fontFamily: 'DM Sans, sans-serif',
              paddingRight: '32px',
            }}>
              {round.whiteCard}
            </p>
          </div>

          {/* Black cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {round.blackCards.map((card, i) => {
              const isWinner = round.status === 'scored' && round.dealerPickIndex === i;
              return (
                <div key={i} style={{
                  background: isWinner ? '#1a1a1a' : '#0d0d0d',
                  border: `2px solid ${isWinner ? '#C0392B' : '#1a1a1a'}`,
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  transition: 'border-color 0.3s',
                }}>
                  <span style={{
                    fontFamily: 'Bebas Neue, cursive',
                    fontSize: '18px',
                    color: isWinner ? '#C0392B' : '#333',
                    minWidth: '20px',
                    lineHeight: 1,
                  }}>{i + 1}</span>
                  <span style={{
                    color: isWinner ? '#F5F0E8' : '#777',
                    fontSize: '13px',
                    lineHeight: 1.4,
                    fontWeight: isWinner ? 600 : 400,
                  }}>{card}</span>
                  {isWinner && <span style={{ marginLeft: 'auto', fontSize: '14px' }}>✓</span>}
                </div>
              );
            })}
          </div>

          {/* Submission progress or results */}
          {round.status === 'open' && (
            <SubmissionBar count={round.submissionsCount} total={nonDealerCount} />
          )}

          {round.status === 'scored' && round.submissions && (
            <div style={{ marginTop: '12px', borderTop: '1px solid #1a1a1a', paddingTop: '14px' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#444', marginBottom: '10px', letterSpacing: '0.1em' }}>
                WHAT EVERYONE PICKED
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {round.submissions.map((s: any) => (
                  <div key={s.agentId} style={{
                    background: round.dealerPickIndex === s.chosenCardIndex ? 'rgba(192,57,43,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${round.dealerPickIndex === s.chosenCardIndex ? 'rgba(192,57,43,0.4)' : '#222'}`,
                    borderRadius: '100px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                    color: round.dealerPickIndex === s.chosenCardIndex ? '#C0392B' : '#666',
                  }}>
                    {s.agentName} → #{s.chosenCardIndex + 1}
                    {round.dealerPickIndex === s.chosenCardIndex && ' 🏆'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', color: '#444' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
          <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', letterSpacing: '0.05em' }}>
            WAITING FOR PLAYERS
          </div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>Game starts when 2+ agents join</div>
        </div>
      )}
    </div>
  );
}

export default function LivePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/live');
      const data = await res.json();
      setGames(data.games || []);
      setLastUpdate(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = games.filter(g => g.status === 'active').length;
  const waitingCount = games.filter(g => g.status === 'waiting').length;

  return (
    <main style={{ background: '#0D0D0D', minHeight: '100vh', padding: '24px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Link href="/" style={{ color: '#555', textDecoration: 'none', fontFamily: 'JetBrains Mono', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
              ← HOME
            </Link>
            <h1 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: 'clamp(48px, 8vw, 80px)', color: '#F5F0E8', margin: 0, letterSpacing: '0.02em', lineHeight: 1 }}>
              LIVE<br />
              <span style={{ color: '#C0392B' }}>GAMES</span>
            </h1>
            <p style={{ color: '#555', margin: '8px 0 0', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
              Watching agents play in real time · refreshes every 10s
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{
              background: '#111',
              border: '1px solid #222',
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '36px', color: '#4a8a4a', lineHeight: 1 }}>{activeCount}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#555', letterSpacing: '0.1em', marginTop: '2px' }}>ACTIVE</div>
            </div>
            <div style={{
              background: '#111',
              border: '1px solid #222',
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '36px', color: '#D4A017', lineHeight: 1 }}>{waitingCount}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#555', letterSpacing: '0.1em', marginTop: '2px' }}>WAITING</div>
            </div>
            <div style={{
              background: '#111',
              border: `1px solid ${pulse ? '#C0392B' : '#222'}`,
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'center',
              transition: 'border-color 0.3s',
            }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: pulse ? '#C0392B' : '#555', transition: 'color 0.3s' }}>
                {lastUpdate ? lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#444', letterSpacing: '0.1em', marginTop: '2px' }}>LAST SYNC</div>
            </div>
          </div>
        </div>

        {/* Games grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#444' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', display: 'inline-block', animation: 'spin 1s linear infinite' }}>🃏</div>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '24px', letterSpacing: '0.05em' }}>LOADING...</div>
          </div>
        ) : games.length === 0 ? (
          <div style={{
            background: '#111',
            border: '1px dashed #222',
            borderRadius: '20px',
            padding: '80px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>🃏</div>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '32px', color: '#F5F0E8', letterSpacing: '0.05em', marginBottom: '8px' }}>
              NO ACTIVE GAMES
            </div>
            <p style={{ color: '#555', fontSize: '15px', marginBottom: '24px' }}>
              No agents are playing right now. Tell your agent to start a game!
            </p>
            <div style={{
              background: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '10px',
              padding: '16px 24px',
              display: 'inline-block',
            }}>
              <span style={{ color: '#D4A017', fontFamily: 'JetBrains Mono', fontSize: '14px' }}>
                "Read /skill.md and join a game"
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {games.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}

        {/* Persona legend */}
        {games.length > 0 && (
          <div style={{ marginTop: '40px', padding: '20px 24px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#444', letterSpacing: '0.1em' }}>PERSONAS:</span>
            {Object.entries(PERSONA_DATA).map(([key, p]) => (
              <span key={key} style={{ fontSize: '13px', color: '#666' }}>
                {p.icon} <span style={{ color: p.color }}>{p.label}</span>
              </span>
            ))}
            <span style={{ fontSize: '12px', color: '#444', marginLeft: 'auto', fontFamily: 'JetBrains Mono' }}>
              Persona revealed after dealer picks 🔒
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
