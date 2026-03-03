'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');`;

type HumorStyle = 'kids' | 'standard' | 'dark';
type GameMode = 'human-vs-computer' | 'human-vs-human';

interface JoinableGame {
  id: string;
  humorStyle: HumorStyle;
  pointsToWin: number;
  players: { name: string; points: number }[];
  createdAt: string;
}

const HUMOR_OPTIONS: { id: HumorStyle; emoji: string; label: string; desc: string; color: string; bg: string; border: string }[] = [
  {
    id: 'kids',
    emoji: '🧒',
    label: 'FAMILY FUN',
    desc: 'Wholesome puns, grandma wisdom, and animal jokes. Safe for all ages.',
    color: '#4a8a4a',
    bg: 'rgba(74,138,74,0.1)',
    border: 'rgba(74,138,74,0.4)',
  },
  {
    id: 'standard',
    emoji: '🎭',
    label: 'STANDARD',
    desc: 'Classic wit, millennial irony, and workplace sarcasm. The full experience.',
    color: '#D4A017',
    bg: 'rgba(212,160,23,0.1)',
    border: 'rgba(212,160,23,0.4)',
  },
  {
    id: 'dark',
    emoji: '🖤',
    label: 'DARK MODE',
    desc: 'Existential dread, cynical social commentary, and midnight energy. Adults only.',
    color: '#C0392B',
    bg: 'rgba(192,57,43,0.1)',
    border: 'rgba(192,57,43,0.4)',
  },
];

export default function PlayPage() {
  const router = useRouter();
  const [step, setStep] = useState<'login' | 'lobby'>('login');
  const [username, setUsername] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [humorStyle, setHumorStyle] = useState<HumorStyle>('standard');
  const [gameMode, setGameMode] = useState<GameMode>('human-vs-computer');
  const [pointsToWin, setPointsToWin] = useState(5);
  const [joinableGames, setJoinableGames] = useState<JoinableGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('caa_session');
    const name = localStorage.getItem('caa_username');
    if (token && name) {
      setSessionToken(token);
      setPlayerName(name);
      setStep('lobby');
      fetchJoinableGames(token);
    }
  }, []);

  async function fetchJoinableGames(token: string) {
    try {
      const res = await fetch('/api/human/games', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setJoinableGames(data.data || []);
    } catch {
      // silent
    }
  }

  async function handleLogin() {
    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/human/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      localStorage.setItem('caa_session', data.data.sessionToken);
      localStorage.setItem('caa_username', data.data.username);
      setSessionToken(data.data.sessionToken);
      setPlayerName(data.data.username);
      setStep('lobby');
      fetchJoinableGames(data.data.sessionToken);
    } catch (e: any) {
      setError(e.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGame() {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/human/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ humorStyle, gameMode, pointsToWin }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      router.push(`/play/${data.data.gameId}`);
    } catch (e: any) {
      setError(e.message || 'Failed to create game');
      setCreating(false);
    }
  }

  async function handleJoinGame(gameId: string) {
    try {
      const res = await fetch('/api/human/games/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ gameId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      router.push(`/play/${gameId}`);
    } catch (e: any) {
      setError(e.message || 'Failed to join game');
    }
  }

  function handleLogout() {
    localStorage.removeItem('caa_session');
    localStorage.removeItem('caa_username');
    setStep('login');
    setSessionToken('');
    setPlayerName('');
    setUsername('');
  }

  const selectedHumor = HUMOR_OPTIONS.find(h => h.id === humorStyle)!;

  return (
    <main style={{ background: '#0D0D0D', minHeight: '100vh', padding: '24px' }}>
      <style>{`
        ${FONTS}
        * { box-sizing: border-box; }
        input { outline: none; }
        button { cursor: pointer; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .fade-up { animation: fadeUp 0.4s ease; }
        .humor-card:hover { transform: translateY(-2px); transition: all 0.2s; }
      `}</style>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <Link href="/" style={{ color: '#555', textDecoration: 'none', fontFamily: 'JetBrains Mono', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            ← HOME
          </Link>
          <h1 style={{ fontFamily: 'Bebas Neue, cursive', fontSize: 'clamp(40px, 8vw, 72px)', color: '#F5F0E8', margin: 0, letterSpacing: '0.02em', lineHeight: 1 }}>
            PLAY<br /><span style={{ color: '#C0392B' }}>CARDS</span>
          </h1>
          <p style={{ color: '#555', margin: '8px 0 0', fontFamily: 'DM Sans, sans-serif', fontSize: '15px' }}>
            Pick a humor style, pick your opponent, and play.
          </p>
        </div>

        {step === 'login' && (
          <div className="fade-up" style={{ background: '#111', border: '1px solid #222', borderRadius: '20px', padding: '40px' }}>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '28px', color: '#F5F0E8', marginBottom: '8px', letterSpacing: '0.05em' }}>
              CHOOSE YOUR NAME
            </div>
            <p style={{ color: '#555', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', marginBottom: '28px' }}>
              No account needed — just pick a username to play.
            </p>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="e.g. FunnyHuman42"
              maxLength={30}
              style={{
                width: '100%',
                background: '#0d0d0d',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '16px 20px',
                color: '#F5F0E8',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '16px',
                marginBottom: '16px',
              }}
            />
            {error && (
              <div style={{ color: '#C0392B', fontFamily: 'JetBrains Mono', fontSize: '12px', marginBottom: '12px' }}>
                ⚠ {error}
              </div>
            )}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%',
                background: '#C0392B',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                color: '#F5F0E8',
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '20px',
                letterSpacing: '0.08em',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'SETTING UP...' : 'LET\'S PLAY →'}
            </button>
          </div>
        )}

        {step === 'lobby' && (
          <div className="fade-up">
            {/* Player header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', border: '1px solid #222', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#C0392B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, cursive', fontSize: '18px', color: '#F5F0E8' }}>
                  {playerName[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '18px', color: '#F5F0E8', letterSpacing: '0.05em' }}>{playerName}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#555' }}>Human Player</div>
                </div>
              </div>
              <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #333', borderRadius: '8px', padding: '8px 14px', color: '#666', fontFamily: 'JetBrains Mono', fontSize: '11px' }}>
                SWITCH USER
              </button>
            </div>

            {/* Create new game */}
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
              <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '24px', color: '#F5F0E8', marginBottom: '24px', letterSpacing: '0.05em' }}>
                NEW GAME
              </div>

              {/* Humor Style */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#555', letterSpacing: '0.1em', marginBottom: '12px' }}>
                  HUMOR STYLE
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {HUMOR_OPTIONS.map(opt => (
                    <div
                      key={opt.id}
                      className="humor-card"
                      onClick={() => setHumorStyle(opt.id)}
                      style={{
                        background: humorStyle === opt.id ? opt.bg : '#0d0d0d',
                        border: `2px solid ${humorStyle === opt.id ? opt.border : '#1a1a1a'}`,
                        borderRadius: '14px',
                        padding: '16px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{opt.emoji}</div>
                      <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '15px', color: humorStyle === opt.id ? opt.color : '#555', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#555', lineHeight: 1.4 }}>
                        {opt.desc}
                      </div>
                    </div>
                  ))}
                </div>
                {humorStyle === 'dark' && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#C0392B' }}>
                    ⚠ Dark mode contains adult themes of existential dread and cynical social commentary.
                  </div>
                )}
              </div>

              {/* Game Mode */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#555', letterSpacing: '0.1em', marginBottom: '12px' }}>
                  OPPONENT
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { id: 'human-vs-computer', emoji: '🤖', label: 'VS COMPUTER', desc: 'Play immediately against RoboPlayer' },
                    { id: 'human-vs-human', emoji: '👥', label: 'VS HUMAN', desc: 'Create a room and wait for a friend' },
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setGameMode(opt.id as GameMode)}
                      style={{
                        background: gameMode === opt.id ? 'rgba(245,240,232,0.06)' : '#0d0d0d',
                        border: `2px solid ${gameMode === opt.id ? '#444' : '#1a1a1a'}`,
                        borderRadius: '14px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '6px' }}>{opt.emoji}</div>
                      <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '16px', color: gameMode === opt.id ? '#F5F0E8' : '#555', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#555' }}>
                        {opt.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Points to Win */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#555', letterSpacing: '0.1em' }}>POINTS TO WIN</div>
                  <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '24px', color: '#C0392B' }}>{pointsToWin}</div>
                </div>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={pointsToWin}
                  onChange={e => setPointsToWin(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#C0392B' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#444', marginTop: '4px' }}>
                  <span>3 (Quick)</span>
                  <span>10 (Epic)</span>
                </div>
              </div>

              {error && (
                <div style={{ color: '#C0392B', fontFamily: 'JetBrains Mono', fontSize: '12px', marginBottom: '12px' }}>
                  ⚠ {error}
                </div>
              )}

              <button
                onClick={handleCreateGame}
                disabled={creating}
                style={{
                  width: '100%',
                  background: '#C0392B',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '18px',
                  color: '#F5F0E8',
                  fontFamily: 'Bebas Neue, cursive',
                  fontSize: '22px',
                  letterSpacing: '0.08em',
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? 'STARTING GAME...' : `CREATE ${selectedHumor.emoji} GAME`}
              </button>
            </div>

            {/* Join existing human-vs-human games */}
            {joinableGames.length > 0 && (
              <div style={{ background: '#111', border: '1px solid #222', borderRadius: '20px', padding: '28px' }}>
                <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#F5F0E8', marginBottom: '16px', letterSpacing: '0.05em' }}>
                  JOIN A GAME
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {joinableGames.map(g => {
                    const humor = HUMOR_OPTIONS.find(h => h.id === g.humorStyle)!;
                    return (
                      <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '14px 18px', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '20px' }}>{humor?.emoji || '🎭'}</span>
                          <div>
                            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#F5F0E8' }}>
                              {g.players[0]?.name}'s game
                            </div>
                            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#555' }}>
                              {humor?.label} · First to {g.pointsToWin}pts
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinGame(g.id)}
                          style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '8px 16px', color: '#F5F0E8', fontFamily: 'Bebas Neue, cursive', fontSize: '14px', letterSpacing: '0.05em' }}
                        >
                          JOIN
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
