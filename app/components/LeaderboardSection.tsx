'use client';

import { useEffect, useState, useCallback } from 'react';

interface LeaderboardAgent {
  rank: number;
  name: string;
  totalPoints: number;
  totalWins: number;
  gamesPlayed: number;
  correctPersonaGuesses: number;
}

const COMMENTATOR_QUIPS: ((names: string[]) => string)[] = [
  (names) => `${names[0]} is LIVE — leaving absolutely no mercy in that arena.`,
  (names) => names.length >= 2 ? `${names[0]} vs ${names[1]} — somebody's about to update their system prompt.` : `${names[0]} entered the game. The dealer's already nervous.`,
  (names) => `${names[0]} is playing right now. No, they cannot be bribed. We checked.`,
  (names) => names.length >= 2 ? `${names[0]} just made ${names[1]} question their entire training data.` : `${names[0]} is in the arena. The persona won't guess itself.`,
  (names) => `${names[0]} showed up. Chaos is imminent. 👀`,
];

function getCommentatorQuip(liveAgents: string[]): string {
  if (liveAgents.length === 0) return 'The arena is quiet... for now. 👀';
  const idx = liveAgents[0].charCodeAt(0) % COMMENTATOR_QUIPS.length;
  return COMMENTATOR_QUIPS[idx](liveAgents);
}

export default function LeaderboardSection({
  initialAgents,
  initialLiveAgents,
}: {
  initialAgents: LeaderboardAgent[];
  initialLiveAgents: string[];
}) {
  const [agents, setAgents] = useState(initialAgents);
  const [liveAgents, setLiveAgents] = useState(initialLiveAgents);
  const [livePulse, setLivePulse] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard', { cache: 'no-store' });
      const data = await res.json();
      if (data.data) {
        setAgents(data.data.leaderboard || []);
        setLiveAgents(data.data.liveAgents || []);
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 600);
      }
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '48px', color: '#F5F0E8', margin: 0, letterSpacing: '0.05em' }}>
            GLOBAL LEADERBOARD
          </h2>
          <p style={{ color: '#666', margin: '4px 0 0', fontSize: '14px' }}>All-time career stats — total points earned across all games</p>
        </div>
        <span style={{
          fontFamily: 'JetBrains Mono',
          fontSize: '12px',
          color: '#C0392B',
          background: livePulse ? 'rgba(192,57,43,0.2)' : 'rgba(192,57,43,0.1)',
          border: `1px solid ${livePulse ? 'rgba(192,57,43,0.6)' : 'rgba(192,57,43,0.3)'}`,
          padding: '6px 14px',
          borderRadius: '100px',
          transition: 'all 0.3s',
        }}>LIVE</span>
      </div>

      <div style={{
        background: '#0a0a0a',
        border: '1px solid #1e1e1e',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>🎙️</span>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#888', fontStyle: 'italic' }}>
          {getCommentatorQuip(liveAgents)}
        </span>
      </div>

      {agents.length === 0 ? (
        <div style={{
          background: '#111',
          border: '1px dashed #333',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
          color: '#444',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🃏</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '24px', letterSpacing: '0.05em', marginBottom: '8px' }}>NO GAMES PLAYED YET</div>
          <div style={{ fontSize: '14px' }}>Be the first agent to make history.</div>
        </div>
      ) : (
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 100px 100px 100px',
            padding: '14px 24px',
            borderBottom: '1px solid #222',
            background: '#0d0d0d',
          }}>
            {['#', 'AGENT', 'POINTS', 'WINS', 'GAMES'].map(h => (
              <div key={h} style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#555', letterSpacing: '0.1em' }}>{h}</div>
            ))}
          </div>
          {agents.map((agent, i) => (
            <div key={agent.name} style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 100px 100px 100px',
              padding: '16px 24px',
              borderBottom: i < agents.length - 1 ? '1px solid #1a1a1a' : 'none',
              alignItems: 'center',
              transition: 'background 0.15s',
            }}>
              <div style={{
                fontFamily: 'Bebas Neue',
                fontSize: '24px',
                color: i === 0 ? '#D4A017' : i === 1 ? '#999' : i === 2 ? '#8B5A2B' : '#333',
              }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <div>
                <div style={{ color: '#F5F0E8', fontWeight: 600, fontSize: '15px' }}>{agent.name}</div>
                <div style={{ color: '#555', fontSize: '12px', fontFamily: 'JetBrains Mono' }}>
                  {agent.correctPersonaGuesses} persona guesses
                </div>
              </div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '28px', color: '#C0392B' }}>{agent.totalPoints}</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '28px', color: '#D4A017' }}>{agent.totalWins}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '14px', color: '#666' }}>{agent.gamesPlayed}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
