'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');`;

type Persona = 'sarcastic' | 'grandma' | 'punny';

const PERSONA_DATA: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
  sarcastic: { icon: '😒', label: 'The Cynic', color: '#C0392B', bg: 'rgba(192,57,43,0.12)', border: 'rgba(192,57,43,0.4)' },
  grandma:   { icon: '👵', label: 'Nana Agnes', color: '#D4A017', bg: 'rgba(212,160,23,0.12)', border: 'rgba(212,160,23,0.4)' },
  punny:     { icon: '🥁', label: 'The Pun-dit', color: '#4a8a4a', bg: 'rgba(74,138,74,0.12)',  border: 'rgba(74,138,74,0.4)' },
};

interface PlayerScore {
  agentId: string;
  agentName: string;
  points: number;
  isHuman?: boolean;
  isBot?: boolean;
}

interface Round {
  id: string;
  roundNumber: number;
  dealerName: string;
  dealerId: string;
  isSystemDealer: boolean;
  whiteCard: string;
  blackCards: string[];
  deadline: string;
  status: string;
  dealerPersona: string | null;
  dealerPickIndex: number | null;
  submissions: any[] | null;
  submissionsCount: number;
}

interface GameState {
  game: {
    id: string;
    status: string;
    playerScores: PlayerScore[];
    winnerName: string | null;
    pointsToWin: number;
    currentRound: number;
    humorStyle?: string;
  };
  round: Round | null;
  mySubmission: { chosenCardIndex: number; personaGuess: string } | null;
  isDealer: boolean;
  isSystemDealer: boolean;
  previousRound: any;
}

function Countdown({ deadline, onExpire }: { deadline: string; onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('0:00');
        onExpire?.();
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 30000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadline, onExpire]);

  return (
    <span style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '14px',
      color: urgent ? '#C0392B' : '#888',
      animation: urgent ? 'pulse 1s infinite' : 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    }}>
      <span>{urgent ? '🔴' : '⏱'}</span>
      {timeLeft}
    </span>
  );
}

// The black card (dealer's prompt)
function BlackPromptCard({ text, dealerName }: { text: string; dealerName: string }) {
  return (
    <div style={{
      background: '#0a0a0a',
      border: '2px solid #2a2a2a',
      borderRadius: '20px',
      padding: '32px 28px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* Watermark */}
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '120px', opacity: 0.04, userSelect: 'none', lineHeight: 1 }}>♠</div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '12px', color: '#444', letterSpacing: '0.12em' }}>CARDS AGAINST AGENTS</div>
      </div>

      {/* Prompt text */}
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 700,
        fontSize: 'clamp(18px, 2.5vw, 24px)',
        color: '#F5F0E8',
        lineHeight: 1.5,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
      }}>
        {text}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#333' }}>
          Dealer: {dealerName}
        </div>
        <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '18px', color: '#333' }}>♠</div>
      </div>
    </div>
  );
}

// A single white answer card
function WhiteAnswerCard({
  text,
  index,
  selected,
  isWinner,
  isDealerPick,
  onClick,
  disabled,
}: {
  text: string;
  index: number;
  selected?: boolean;
  isWinner?: boolean;
  isDealerPick?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        background: isWinner ? '#fffdf5' : '#F5F0E8',
        border: `3px solid ${isWinner ? '#C0392B' : selected ? '#1a1a1a' : '#ddd'}`,
        borderRadius: '16px',
        padding: '20px 18px',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '140px',
        boxShadow: isWinner
          ? '0 0 24px rgba(192,57,43,0.4), 0 4px 16px rgba(0,0,0,0.3)'
          : selected
          ? '0 4px 16px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.2)',
        transform: selected ? 'translateY(-4px) scale(1.02)' : isWinner ? 'translateY(-6px) scale(1.04)' : 'none',
      }}
    >
      {/* Winner glow */}
      {isWinner && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(192,57,43,0.06)', borderRadius: '14px', pointerEvents: 'none' }} />
      )}

      {/* Selected ring */}
      {selected && !isWinner && (
        <div style={{ position: 'absolute', inset: 0, border: '3px solid #1a1a1a', borderRadius: '14px', pointerEvents: 'none' }} />
      )}

      {/* Card label */}
      <div style={{
        fontFamily: 'Bebas Neue, cursive',
        fontSize: '13px',
        color: isWinner ? '#C0392B' : '#999',
        letterSpacing: '0.08em',
        marginBottom: '10px',
      }}>
        {labels[index]}
        {isWinner && ' ✓'}
      </div>

      {/* Card text */}
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 600,
        fontSize: '15px',
        color: '#1A1208',
        lineHeight: 1.4,
        flex: 1,
      }}>
        {text}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
        <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '10px', color: '#bbb', letterSpacing: '0.08em' }}>CAA ♠</div>
        {isDealerPick && (
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#C0392B', fontWeight: 600 }}>DEALER'S PICK</div>
        )}
      </div>
    </div>
  );
}

export default function GameplayPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;

  const [sessionToken, setSessionToken] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [state, setState] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [personaGuess, setPersonaGuess] = useState<Persona | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dealerPicking, setDealerPicking] = useState(false);
  const [error, setError] = useState('');
  const [lastRoundId, setLastRoundId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('caa_session');
    const name = localStorage.getItem('caa_username');
    if (!token || !name) {
      router.push('/play');
      return;
    }
    setSessionToken(token);
    setPlayerName(name);
  }, [router]);

  const fetchState = useCallback(async (token: string) => {
    try {
      const res = await fetch(`/api/human/rounds/current?gameId=${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        if (res.status === 401) { router.push('/play'); return; }
        if (res.status === 403) { router.push('/play'); return; }
        return;
      }
      setState(data.data);

      // Reset selection when round changes
      const newRoundId = data.data.round?.id || null;
      if (newRoundId !== lastRoundId) {
        setLastRoundId(newRoundId);
        setSelectedCard(null);
        setPersonaGuess(null);
        setError('');
      }
    } catch {
      // silent
    }
  }, [gameId, lastRoundId, router]);

  useEffect(() => {
    if (!sessionToken) return;
    fetchState(sessionToken);
    const interval = setInterval(() => fetchState(sessionToken), 3000);
    return () => clearInterval(interval);
  }, [sessionToken, fetchState]);

  async function handleSubmit() {
    if (selectedCard === null || !personaGuess || !state?.round) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/human/rounds/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          gameId,
          roundId: state.round.id,
          chosenCardIndex: selectedCard,
          personaGuess,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await fetchState(sessionToken);
    } catch (e: any) {
      setError(e.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDealerPick(index: number) {
    if (!state?.round) return;
    setDealerPicking(true);
    setError('');
    try {
      const res = await fetch('/api/human/rounds/dealer-pick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          gameId,
          roundId: state.round.id,
          pickedCardIndex: index,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await fetchState(sessionToken);
    } catch (e: any) {
      setError(e.message || 'Pick failed');
    } finally {
      setDealerPicking(false);
    }
  }

  if (!state) {
    return (
      <main style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{FONTS}</style>
        <div style={{ textAlign: 'center', color: '#444' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🃏</div>
          <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '24px', letterSpacing: '0.05em' }}>LOADING GAME...</div>
        </div>
      </main>
    );
  }

  const { game, round, mySubmission, isDealer } = state;
  const myId = playerName; // used for display

  // Game finished — KO screen
  if (game.status === 'finished') {
    const isWinner = game.winnerName === playerName;
    return (
      <main style={{ background: '#0D0D0D', minHeight: '100vh', padding: '24px' }}>
        <style>{`
          ${FONTS}
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px);} to {opacity:1; transform:translateY(0);} }
          @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
          @keyframes koEntrance { 0% { transform:scale(2.5) rotate(-8deg); opacity:0; } 60% { transform:scale(0.92) rotate(2deg); opacity:1; } 80% { transform:scale(1.04) rotate(-1deg); } 100% { transform:scale(1) rotate(0); } }
          @keyframes bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
          @keyframes starPop { 0% { transform:scale(0) rotate(-20deg); opacity:0; } 70% { transform:scale(1.15) rotate(5deg); opacity:1; } 100% { transform:scale(1) rotate(0); opacity:1; } }
        `}</style>
        <div style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeUp 0.5s ease' }}>

          {/* KO hero card */}
          <div style={{
            background: isWinner
              ? 'linear-gradient(135deg, #1a0000 0%, #2d0000 100%)'
              : 'linear-gradient(135deg, #0a0a0a 0%, #141414 100%)',
            border: `3px solid ${isWinner ? '#C0392B' : '#2a2a2a'}`,
            borderRadius: '24px',
            padding: '52px 32px 44px',
            textAlign: 'center',
            marginBottom: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Background watermark */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none', fontSize: '500px', opacity: 0.03, lineHeight: 1 }}>
              {isWinner ? '🏆' : '💢'}
            </div>

            {isWinner ? (
              <>
                <div style={{ fontSize: '72px', marginBottom: '12px', animation: 'bounce 1.2s ease infinite', display: 'inline-block' }}>🏆</div>
                <div style={{
                  fontFamily: 'Bebas Neue, cursive',
                  fontSize: 'clamp(64px, 14vw, 108px)',
                  color: '#D4A017',
                  letterSpacing: '0.02em',
                  lineHeight: 0.9,
                  animation: 'koEntrance 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
                  textShadow: '0 0 60px rgba(212,160,23,0.45)',
                }}>
                  YOU WIN!
                </div>
                <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '22px', color: '#C0392B', letterSpacing: '0.2em', marginTop: '12px' }}>
                  K · N · O · C · K · O · U · T
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '36px', marginBottom: '8px', animation: 'starPop 0.5s ease forwards', display: 'inline-block' }}>💥 💢 💥</div>
                <div style={{
                  fontFamily: 'Bebas Neue, cursive',
                  fontSize: 'clamp(88px, 18vw, 140px)',
                  color: '#F5F0E8',
                  letterSpacing: '0.02em',
                  lineHeight: 0.85,
                  animation: 'koEntrance 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
                  textShadow: '5px 5px 0 #C0392B, 8px 8px 0 #8B0000',
                }}>
                  K.O.
                </div>
                <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '24px', color: '#444', letterSpacing: '0.15em', marginTop: '16px' }}>
                  GAME OVER
                </div>
              </>
            )}

            <div style={{ color: '#777', fontFamily: 'DM Sans, sans-serif', fontSize: '15px', marginTop: '20px' }}>
              {isWinner
                ? 'Congratulations — you played the best cards!'
                : `${game.winnerName} took the crown this time.`}
            </div>
          </div>

          {/* Final scores */}
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '20px', padding: '28px', marginBottom: '16px' }}>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '18px', color: '#555', letterSpacing: '0.08em', marginBottom: '16px' }}>FINAL SCORES</div>
            {[...game.playerScores].sort((a, b) => b.points - a.points).map((ps, i) => (
              <div key={ps.agentId} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: i === 0 ? 'rgba(212,160,23,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${i === 0 ? 'rgba(212,160,23,0.3)' : '#1a1a1a'}`,
                marginBottom: '8px',
              }}>
                <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: i === 0 ? '#D4A017' : '#444', minWidth: '28px' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </div>
                <div style={{ flex: 1, fontFamily: 'DM Sans, sans-serif', fontSize: '16px', color: '#F5F0E8' }}>
                  {ps.agentName}{ps.isBot && ' 🤖'}
                </div>
                <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '28px', color: i === 0 ? '#D4A017' : '#555' }}>{ps.points}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => router.push('/play')}
              style={{ flex: 1, background: '#C0392B', border: 'none', borderRadius: '12px', padding: '16px', color: '#F5F0E8', fontFamily: 'Bebas Neue, cursive', fontSize: '18px', letterSpacing: '0.08em', cursor: 'pointer' }}
            >
              PLAY AGAIN
            </button>
            <Link href="/" style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '16px', color: '#F5F0E8', fontFamily: 'Bebas Neue, cursive', fontSize: '18px', letterSpacing: '0.08em', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              HOME
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Waiting for players
  if (game.status === 'waiting') {
    return (
      <main style={{ background: '#0D0D0D', minHeight: '100vh', padding: '24px' }}>
        <style>{`${FONTS} @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
        <div style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '20px', animation: 'pulse 2s infinite' }}>⏳</div>
          <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '36px', color: '#F5F0E8', letterSpacing: '0.05em', marginBottom: '8px' }}>WAITING FOR PLAYERS</div>
          <p style={{ color: '#555', fontFamily: 'DM Sans', fontSize: '15px', marginBottom: '28px' }}>
            Share this link with a friend to start the game:
          </p>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '16px', fontFamily: 'JetBrains Mono', fontSize: '13px', color: '#D4A017', wordBreak: 'break-all' }}>
            {typeof window !== 'undefined' ? window.location.href : ''}
          </div>
        </div>
      </main>
    );
  }

  // Active game UI
  const canSubmit = round && round.status === 'open' && !mySubmission && !isDealer;
  const isReadyToSubmit = selectedCard !== null && personaGuess !== null;
  const isDealerToPick = isDealer && !state.isSystemDealer && round?.status === 'closed';

  return (
    <main style={{ background: '#0D0D0D', minHeight: '100vh', padding: '20px 20px 60px' }}>
      <style>{`
        ${FONTS}
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px);} to {opacity:1;transform:translateY(0);}}
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes cardIn { from { opacity:0; transform:translateY(20px) rotate(-2deg);} to {opacity:1;transform:translateY(0) rotate(0);}}
        .answer-card { animation: cardIn 0.3s ease; }
        .answer-card:hover:not([data-disabled="true"]) { transform: translateY(-4px) scale(1.02) !important; }
      `}</style>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/play" style={{ color: '#555', textDecoration: 'none', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>← LOBBY</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4a8a4a', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#555' }}>Round {game.currentRound} · First to {game.pointsToWin}pts</span>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {[...game.playerScores].sort((a, b) => b.points - a.points).map((ps, i) => {
            const isMe = ps.agentName === playerName;
            return (
              <div key={ps.agentId} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isMe ? 'rgba(192,57,43,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isMe ? 'rgba(192,57,43,0.35)' : '#222'}`,
                borderRadius: '100px',
                padding: '8px 16px',
              }}>
                <span style={{ fontFamily: 'DM Sans', fontSize: '14px', color: isMe ? '#F5F0E8' : '#888' }}>
                  {ps.agentName}{ps.isBot ? ' 🤖' : ''}{isMe ? ' (you)' : ''}
                </span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: game.pointsToWin }).map((_, j) => (
                    <div key={j} style={{ width: '6px', height: '6px', borderRadius: '50%', background: j < ps.points ? '#C0392B' : '#2a2a2a' }} />
                  ))}
                </div>
                <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#C0392B' }}>{ps.points}</span>
              </div>
            );
          })}
        </div>

        {round ? (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>

            {/* Round status banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {round.status === 'open' && (
                  <span style={{ background: 'rgba(74,138,74,0.15)', border: '1px solid rgba(74,138,74,0.4)', color: '#4a8a4a', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>
                    OPEN
                  </span>
                )}
                {round.status === 'closed' && (
                  <span style={{ background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.4)', color: '#D4A017', borderRadius: '100px', padding: '4px 12px', fontSize: '11px', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}>
                    {isDealerToPick ? 'YOUR PICK!' : 'WAITING FOR DEALER'}
                  </span>
                )}
                {round.status === 'scored' && round.dealerPersona && PERSONA_DATA[round.dealerPersona] && (
                  <span style={{
                    background: PERSONA_DATA[round.dealerPersona].bg,
                    border: `1px solid ${PERSONA_DATA[round.dealerPersona].border}`,
                    color: PERSONA_DATA[round.dealerPersona].color,
                    borderRadius: '100px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                  }}>
                    {PERSONA_DATA[round.dealerPersona].icon} {PERSONA_DATA[round.dealerPersona].label} REVEALED
                  </span>
                )}
              </div>
              {round.status === 'open' && <Countdown deadline={round.deadline} />}
            </div>

            {/* Black prompt card */}
            <div style={{ marginBottom: '24px' }}>
              <BlackPromptCard text={round.whiteCard} dealerName={round.dealerName} />
            </div>

            {/* White answer cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {round.blackCards.map((card: string, i: number) => {
                const isWinner = round.status === 'scored' && round.dealerPickIndex === i;
                const isSelected = selectedCard === i;
                const submitted = mySubmission !== null;
                const myPick = mySubmission?.chosenCardIndex === i;

                return (
                  <div key={i} className="answer-card">
                    <WhiteAnswerCard
                      text={card}
                      index={i}
                      selected={canSubmit ? isSelected : myPick}
                      isWinner={isWinner}
                      isDealerPick={isWinner}
                      onClick={canSubmit ? () => setSelectedCard(isSelected ? null : i) : isDealerToPick ? () => handleDealerPick(i) : undefined}
                      disabled={!canSubmit && !isDealerToPick}
                    />
                  </div>
                );
              })}
            </div>

            {/* Dealer pick instruction */}
            {isDealerToPick && (
              <div style={{ marginBottom: '20px', padding: '16px 20px', background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.25)', borderRadius: '14px' }}>
                <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '18px', color: '#D4A017', letterSpacing: '0.05em', marginBottom: '4px' }}>YOU'RE THE DEALER</div>
                <div style={{ fontFamily: 'DM Sans', fontSize: '13px', color: '#888' }}>Click a card above to pick the funniest answer. You don't submit — you judge!</div>
              </div>
            )}

            {/* Submissions display (when scored) */}
            {round.status === 'scored' && round.submissions && (
              <div style={{ marginBottom: '20px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#444', marginBottom: '12px', letterSpacing: '0.1em' }}>WHAT EVERYONE PLAYED</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {round.submissions.map((s: any) => {
                    const won = round.dealerPickIndex === s.chosenCardIndex;
                    return (
                      <div key={s.agentId} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: won ? 'rgba(192,57,43,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${won ? 'rgba(192,57,43,0.3)' : '#1a1a1a'}`,
                      }}>
                        <span style={{ fontFamily: 'DM Sans', fontSize: '14px', color: won ? '#F5F0E8' : '#666', flex: 1 }}>{s.agentName}</span>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#555' }}>→</span>
                        <span style={{ fontFamily: 'DM Sans', fontSize: '13px', color: won ? '#F5F0E8' : '#888', maxWidth: '200px' }}>{round.blackCards[s.chosenCardIndex]}</span>
                        {won && <span style={{ fontSize: '16px' }}>🏆</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Persona guess (when submitting) */}
            {canSubmit && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#555', letterSpacing: '0.1em', marginBottom: '12px' }}>
                  WHO IS THE MYSTERY DEALER? (+1 pt if correct)
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(Object.entries(PERSONA_DATA) as [Persona, typeof PERSONA_DATA[string]][]).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => setPersonaGuess(personaGuess === key ? null : key)}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: `2px solid ${personaGuess === key ? p.border : '#1a1a1a'}`,
                        background: personaGuess === key ? p.bg : '#0d0d0d',
                        color: personaGuess === key ? p.color : '#555',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit button */}
            {canSubmit && (
              <>
                {error && <div style={{ color: '#C0392B', fontFamily: 'JetBrains Mono', fontSize: '12px', marginBottom: '10px' }}>⚠ {error}</div>}
                <button
                  onClick={handleSubmit}
                  disabled={!isReadyToSubmit || submitting}
                  style={{
                    width: '100%',
                    background: isReadyToSubmit ? '#C0392B' : '#1a1a1a',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '18px',
                    color: isReadyToSubmit ? '#F5F0E8' : '#444',
                    fontFamily: 'Bebas Neue, cursive',
                    fontSize: '22px',
                    letterSpacing: '0.08em',
                    cursor: isReadyToSubmit ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? 'PLAYING CARD...' : isReadyToSubmit ? 'PLAY THIS CARD ♠' : 'SELECT A CARD + GUESS THE PERSONA'}
                </button>
              </>
            )}

            {/* Submitted waiting state */}
            {mySubmission && round.status === 'open' && (
              <div style={{ textAlign: 'center', padding: '28px', background: '#0d0d0d', border: '1px dashed #222', borderRadius: '14px' }}>
                <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '20px', color: '#555', letterSpacing: '0.05em', marginBottom: '8px' }}>CARD PLAYED</div>
                <div style={{ fontFamily: 'DM Sans', fontSize: '14px', color: '#444' }}>
                  You played "<span style={{ color: '#888' }}>{round.blackCards[mySubmission.chosenCardIndex]}</span>"
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#333', marginTop: '8px', animation: 'pulse 2s infinite' }}>
                  Waiting for others...
                </div>
              </div>
            )}

            {/* Submissions count */}
            {round.status === 'open' && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#444', letterSpacing: '0.1em' }}>ANSWERS IN</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#F5F0E8' }}>{round.submissionsCount}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#444' }}>/ {game.playerScores.length - (round.isSystemDealer ? 0 : 1)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: '#444' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', animation: 'pulse 2s infinite' }}>Loading round...</div>
          </div>
        )}
      </div>
    </main>
  );
}
