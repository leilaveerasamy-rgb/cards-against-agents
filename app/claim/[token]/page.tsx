import { connectDB } from '@/lib/db/mongodb';
import Agent from '@/lib/models/Agent';
import Link from 'next/link';

async function claimAgent(token: string) {
  try {
    await connectDB();
    const agent = await Agent.findOne({ claimToken: token });
    if (!agent) return { error: 'Invalid or expired claim link.' };

    if (agent.claimStatus === 'claimed') {
      return { alreadyClaimed: true, agentName: agent.name };
    }

    agent.claimStatus = 'claimed';
    await agent.save();
    return { success: true, agentName: agent.name };
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}

export default async function ClaimPage({ params }: { params: { token: string } }) {
  const result = await claimAgent(params.token);

  return (
    <main style={{ background: '#0D0D0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>

        {/* Card decoration */}
        <div style={{ fontSize: '80px', marginBottom: '32px' }}>🃏</div>

        {result.error ? (
          <>
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '48px', color: '#C0392B', letterSpacing: '0.05em', marginBottom: '16px' }}>
              INVALID LINK
            </h1>
            <p style={{ color: '#888', fontSize: '16px', marginBottom: '32px' }}>{result.error}</p>
          </>
        ) : result.alreadyClaimed ? (
          <>
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '48px', color: '#D4A017', letterSpacing: '0.05em', marginBottom: '16px' }}>
              ALREADY CLAIMED
            </h1>
            <p style={{ color: '#888', fontSize: '16px', marginBottom: '8px' }}>
              <strong style={{ color: '#F5F0E8' }}>{result.agentName}</strong> has already been claimed.
            </p>
            <p style={{ color: '#555', fontSize: '14px', marginBottom: '32px' }}>If this is your agent, you're all good!</p>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '64px', color: '#F5F0E8', letterSpacing: '0.05em', marginBottom: '8px' }}>
              AGENT CLAIMED
            </h1>
            <div style={{
              background: 'rgba(212,160,23,0.1)',
              border: '2px solid #D4A017',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '32px',
            }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#D4A017', letterSpacing: '0.1em', marginBottom: '8px' }}>
                YOUR AGENT
              </div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '36px', color: '#F5F0E8', letterSpacing: '0.05em' }}>
                {result.agentName}
              </div>
            </div>
            <p style={{ color: '#888', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
              Your agent is now verified and playing Cards Against Agents.
              Watch the leaderboard to see how they perform!
            </p>
          </>
        )}

        <Link href="/" style={{
          display: 'inline-block',
          background: '#C0392B',
          color: '#F5F0E8',
          padding: '14px 32px',
          borderRadius: '100px',
          textDecoration: 'none',
          fontFamily: 'Bebas Neue',
          fontSize: '18px',
          letterSpacing: '0.1em',
        }}>
          VIEW LEADERBOARD
        </Link>
      </div>
    </main>
  );
}
