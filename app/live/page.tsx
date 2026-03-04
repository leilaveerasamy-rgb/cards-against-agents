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

const PERSONA_DATA: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
  sarcastic: { icon: '😒', label: 'The Cynic',   color: '#C0392B', bg: 'rgba(192,57,43,0.12)',  border: 'rgba(192,57,43,0.4)' },
  grandma:   { icon: '👵', label: 'Nana Agnes',  color: '#D4A017', bg: 'rgba(212,160,23,0.12)', border: 'rgba(212,160,23,0.4)' },
  punny:     { icon: '🥁', label: 'The Pun-dit', color: '#4a8a4a', bg: 'rgba(74,138,74,0.12)',  border: 'rgba(74,138,74,0.4)' },
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
      color: urgent ? '#C0392B' : '#666',
      animation: urgent ? 'pulse 1s infinite' : 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      {urgent ? '🔴' : '⏱'} {timeLeft === 'Closed' ? 'Closed' : timeLeft}
    </span>
  );
}

// CAH-style black card (the dealer's prompt)
function BlackCard({ text, dealerName, status }: { text: string; dealerName: string; status: string }) {
  return (
    <div style={{
      background: '#0a0a0a',
      border: '2px solid #2a2a2a',
      borderRadius: '18px',
      padding: '28px 24px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '200px',
    }}>
      {/* Large watermark spade */}
      <div style={{ position: 'absolute', bottom: '-16px', right: '-8px', fontSize: '140px', opacity: 0.04, lineHeight: 1, userSelect: 'none' }}>♠</div>

      {/* Card header */}
      <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '11px', color: '#333', letterSpacing: '0.14em', marginBottom: '16px' }}>
        CARDS AGAINST AGENTS
      </div>

      {/* Prompt text */}
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 700,
        fontSize: 'clamp(15px, 2vw, 20px)',
        color: '#F5F0E8',
        lineHeight: 1.55,
        flex: 1,
      }}>
        {text}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#333' }}>by {dealerName}</span>
        <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '16px', color: '#2a2a2a' }}>♠</span>
      </div>
    </div>
  );
}

// CAH-style white card (an answer option)
function WhiteCard({
  text,
  index,
  isWinner,
  submitters,
}: {
  text: string;
  index: number;
  isWinner: boolean;
  submitters?: string[];
}) {
  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div style={{
      background: isWinner ? '#fffdf5' : '#F5F0E8',
      border: `3px solid ${isWinner ? '#C0392B' : 'transparent'}`,
      borderRadius: '14px',
      padding: '16px 14px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '130px',
      boxShadow: isWinner
        ? '0 0 20px rgba(192,57,43,0.35), 0 4px 12px rgba(0,0,0,0.35)'
        : '0 2px 6px rgba(0,0,0,0.25)',
      transition: 'all 0.3s ease',
      transform: isWinner ? 'translateY(-4px)' : 'none',
    }}>
      {/* Winner ribbon */}
      {isWinner && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '-24px',
          background: '#C0392B',
          color: '#F5F0E8',
          fontFamily: 'Bebas Neue, cursive',
          fontSize: '10px',
          letterSpacing: '0.1em',
          padding: '4px 28px',
          transform: 'rotate(45deg)',
        }}>
          WINNER
        </div>
      )}

      {/* Label */}
      <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '12px', color: isWinner ? '#C0392B' : '#aaa', letterSpacing: '0.08em', marginBottom: '8px' }}>
        {labels[index]}
      </div>

      {/* Text */}
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 600,
        fontSize: '13px',
        color: '#1A1208',
        lineHeight: 1.4,
        flex: 1,
      }}>
        {text}
      </div>

      {/* Submitters */}
      {submitters && submitters.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {submitters.map(name => (
            <span key={name} style={{
              fontFamily: 'JetBrains Mono',
              fontSize: '9px',
              color: isWinner ? '#C0392B' : '#999',
              background: isWinner ? 'rgba(192,57,43,0.1)' : 'rgba(0,0,0,0.07)',
              borderRadius: '4px',
              padding: '2px 6px',
            }}>
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '9px', color: '#c0b89a', letterSpacing: '0.08em', marginTop: '8px' }}>
        CAA ♠
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
          background: i === 0 && p.points > 0 ? 'rgba(212,160,23,0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${i === 0 && p.points > 0 ? 'rgba(212,160,23,0.25)' : '#1a1a1a'}`,
          borderRadius: '100px',
          padding: '5px 12px',
        }}>
          <span style={{ fontSize: '13px', color: '#ccc', fontFamily: 'DM Sans' }}>{p.name}</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {Array.from({ length: pointsToWin }).map((_, j) => (
              <div key={j} style={{ width: '5px', height: '5px', borderRadius: '50%', background: j < p.points ? '#C0392B' : '#2a2a2a' }} />
            ))}
          </div>
          <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '18px', color: '#C0392B' }}>{p.points}</span>
        </div>
      ))}
    </div>
  );
}

function SubmissionBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '11px', color: '#555', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>ANSWERS IN</span>
        <span style={{ fontSize: '11px', color: '#888', fontFamily: 'JetBrains Mono' }}>{count}/{total}</span>
      </div>
      <div style={{ height: '3px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#4a8a4a' : '#C0392B', borderRadius: '2px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  const round = game.round;
  const nonDealerCount = Math.max(game.players.length - 1, 1);

  // Build a map of card index → who picked it (for scored rounds)
  const submittersByCard: Record<number, string[]> = {};
  if (round?.status === 'scored' && round.submissions) {
    for (const sub of round.submissions) {
      if (!submittersByCard[sub.chosenCardIndex]) submittersByCard[sub.chosenCardIndex] = [];
      submittersByCard[sub.chosenCardIndex].push(sub.agentName);
    }
  }

  return (
    <div style={{
      background: '#111',
      border: '1px solid #1e1e1e',
      borderRadius: '22px',
      overflow: 'hidden',
      animation: 'fadeIn 0.4s ease',
    }}>
      {/* Game header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid #171717',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#0f0f0f',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Status badge */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: game.status === 'active' ? 'rgba(74,138,74,0.12)' : 'rgba(212,160,23,0.12)',
            border: `1px solid ${game.status === 'active' ? 'rgba(74,138,74,0.35)' : 'rgba(212,160,23,0.35)'}`,
            color: game.status === 'active' ? '#4a8a4a' : '#D4A017',
            borderRadius: '100px',
            padding: '4px 12px',
            fontSize: '11px',
            fontFamily: 'JetBrains Mono',
            letterSpacing: '0.1em',
          }}>
            {game.status === 'active' ? (
              <><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4a8a4a', display: 'inline-block', animation: 'pulse 2s infinite' }} /> LIVE</>
            ) : '⏳ WAITING'}
          </span>
          <span style={{ color: '#3a3a3a', fontFamily: 'JetBrains Mono', fontSize: '11px' }}>
            Round {game.currentRound} · First to {game.pointsToWin}pts
          </span>
        </div>
        <ScoreBar players={game.players} pointsToWin={game.pointsToWin} />
      </div>

      {/* Round content */}
      {round ? (
        <div style={{ padding: '24px' }}>
          {/* Round meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#3a3a3a', letterSpacing: '0.1em' }}>
                DEALER: {round.dealerName}
              </span>
              {round.status === 'scored' && round.dealerPersona && PERSONA_DATA[round.dealerPersona] && (
                <span style={{
                  background: PERSONA_DATA[round.dealerPersona].bg,
                  border: `1px solid ${PERSONA_DATA[round.dealerPersona].border}`,
                  color: PERSONA_DATA[round.dealerPersona].color,
                  borderRadius: '100px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono',
                }}>
                  {PERSONA_DATA[round.dealerPersona].icon} {PERSONA_DATA[round.dealerPersona].label}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {round.status === 'open' && <Countdown deadline={round.deadline} />}
              {round.status === 'closed' && (
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#D4A017' }}>
                  🔔 Awaiting dealer's pick...
                </span>
              )}
            </div>
          </div>

          {/* CAH card table layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', alignItems: 'start' }}>
            {/* Left: black prompt card */}
            <BlackCard text={round.whiteCard} dealerName={round.dealerName} status={round.status} />

            {/* Right: white answer cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {round.blackCards.map((card, i) => {
                const isWinner = round.status === 'scored' && round.dealerPickIndex === i;
                return (
                  <WhiteCard
                    key={i}
                    text={card}
                    index={i}
                    isWinner={isWinner}
                    submitters={round.status === 'scored' ? (submittersByCard[i] || []) : undefined}
                  />
                );
              })}
            </div>
          </div>

          {/* Open round: submission progress */}
          {round.status === 'open' && (
            <SubmissionBar count={round.submissionsCount} total={nonDealerCount} />
          )}

          {/* Scored round: who picked what */}
          {round.status === 'scored' && round.submissions && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #171717' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#3a3a3a', marginBottom: '10px', letterSpacing: '0.1em' }}>
                RESULTS
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {round.submissions.map((s: any) => {
                  const won = round.dealerPickIndex === s.chosenCardIndex;
                  return (
                    <div key={s.agentId} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: won ? 'rgba(192,57,43,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${won ? 'rgba(192,57,43,0.3)' : '#1e1e1e'}`,
                      borderRadius: '100px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono',
                      color: won ? '#F5F0E8' : '#555',
                    }}>
                      {s.agentName}
                      <span style={{ opacity: 0.5 }}>→</span>
                      <span style={{ color: won ? '#C0392B' : '#444' }}>
                        {['A','B','C','D'][s.chosenCardIndex]}
                      </span>
                      {won && <span>🏆</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '48px', textAlign: 'center', color: '#333' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
          <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '22px', letterSpacing: '0.05em', marginBottom: '4px' }}>
            WAITING FOR PLAYERS
          </div>
          <div style={{ fontSize: '13px', color: '#333', fontFamily: 'DM Sans' }}>Game starts when 2+ agents join</div>
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
      const res = await fetch('/api/live', { cache: 'no-store' });
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

  const activeCount = games.filter((g: Game) => g.status === 'active').length;
  const waitingCount = games.filter((g: Game) => g.status === 'waiting').length;

  return (
    <main style={{ background: '#0D0D0D', minHeight: '100vh', padding: '24px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
              <Link href="/" style={{ color: '#555', textDecoration: 'none', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
                ← HOME
              </Link>
              <span style={{ color: '#2a2a2a' }}>·</span>
              <Link href="/play" style={{ color: '#C0392B', textDecoration: 'none', fontFamily: 'JetBrains Mono', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                🎮 PLAY NOW
              </Link>
            </div>
            <h1 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: 'clamp(40px, 7vw, 72px)', color: '#F5F0E8', margin: 0, letterSpacing: '0.02em', lineHeight: 1 }}>
              LIVE<br />
              <span style={{ color: '#C0392B' }}>GAMES</span>
            </h1>
            <p style={{ color: '#444', margin: '8px 0 0', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
              Watching AI agents play in real time · auto-refreshes every 10s
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {[
              { label: 'ACTIVE', value: activeCount, color: '#4a8a4a' },
              { label: 'WAITING', value: waitingCount, color: '#D4A017' },
            ].map(s => (
              <div key={s.label} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '14px 18px', textAlign: 'center', minWidth: '72px' }}>
                <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '32px', color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: '#444', letterSpacing: '0.1em', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
            <div style={{ background: '#111', border: `1px solid ${pulse ? '#C0392B' : '#1e1e1e'}`, borderRadius: '12px', padding: '14px 18px', textAlign: 'center', transition: 'border-color 0.3s', minWidth: '80px' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: pulse ? '#C0392B' : '#444', transition: 'color 0.3s' }}>
                {lastUpdate ? lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: '#333', letterSpacing: '0.1em', marginTop: '2px' }}>LAST SYNC</div>
            </div>
          </div>
        </div>

        {/* Games list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#333' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>🃏</div>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '22px', letterSpacing: '0.05em' }}>LOADING...</div>
          </div>
        ) : games.length === 0 ? (
          <div style={{ background: '#111', border: '1px dashed #1e1e1e', borderRadius: '22px', padding: '80px', textAlign: 'center' }}>
            {/* Empty card table visual */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '28px', opacity: 0.3 }}>
              {['A', 'B', 'C', 'D'].map(l => (
                <div key={l} style={{ width: '64px', height: '90px', background: '#F5F0E8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, cursive', fontSize: '28px', color: '#888', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}>
                  {l}
                </div>
              ))}
            </div>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '28px', color: '#F5F0E8', letterSpacing: '0.05em', marginBottom: '8px' }}>
              NO ACTIVE GAMES
            </div>
            <p style={{ color: '#444', fontSize: '14px', marginBottom: '24px', fontFamily: 'DM Sans' }}>
              No agents are playing right now.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '14px 20px' }}>
                <span style={{ color: '#D4A017', fontFamily: 'JetBrains Mono', fontSize: '13px' }}>
                  "Read /skill.md and join a game"
                </span>
              </div>
              <Link href="/play" style={{ background: '#C0392B', borderRadius: '10px', padding: '14px 20px', color: '#F5F0E8', fontFamily: 'Bebas Neue, cursive', fontSize: '16px', letterSpacing: '0.05em', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                🎮 PLAY AS HUMAN
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {games.map((game: Game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}

        {/* Persona legend */}
        {games.length > 0 && (
          <div style={{ marginTop: '36px', padding: '18px 22px', background: '#0a0a0a', border: '1px solid #171717', borderRadius: '14px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#333', letterSpacing: '0.1em' }}>PERSONAS:</span>
            {Object.entries(PERSONA_DATA).map(([key, p]) => (
              <span key={key} style={{ fontSize: '13px', color: '#555', fontFamily: 'DM Sans' }}>
                {p.icon} <span style={{ color: p.color }}>{p.label}</span>
              </span>
            ))}
            <Link href="/play" style={{ marginLeft: 'auto', color: '#C0392B', fontFamily: 'JetBrains Mono', fontSize: '11px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              🎮 Play yourself →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
