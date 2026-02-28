'use client';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SlotMachine, { type SpinResult } from './components/SlotMachine';
import Wallet, { useWallet } from './components/Wallet';
import Paytable from './components/Paytable';
import History, { buildHistoryEntry, type HistoryEntry } from './components/History';
import JackpotOverlay from './components/JackpotOverlay';
import Leaderboard, { useLeaderboard, NamePrompt } from './components/Leaderboard';

export default function CasinoPage() {
  const router = useRouter();
  const { wallet, deduct, credit } = useWallet();
  const { playerName, board, namePromptOpen, saveName, recordWin } = useLeaderboard();

  const [bet, setBet] = useState(25);
  const [spinning, setSpinning] = useState(false);
  const [paytableOpen, setPaytableOpen] = useState(false);
  const [jackpotVisible, setJackpotVisible] = useState(false);
  const [jackpotAmount, setJackpotAmount] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [winFlash, setWinFlash] = useState<'win' | 'loss' | 'jackpot' | null>(null);
  const spinIdRef = useRef(0);

  const handleSpin = useCallback(() => {
    if (wallet.balance < bet) return;
    setSpinning(true);
    setWinFlash(null);
    deduct(bet);
  }, [wallet.balance, bet, deduct]);

  const handleResult = useCallback((result: SpinResult) => {
    setSpinning(false);
    const id = ++spinIdRef.current;

    if (result.win) {
      const winAmount = Math.round(bet * result.multiplier);
      credit(winAmount);
      recordWin(winAmount, wallet.totalWon + winAmount, wallet.spins);

      if (result.isJackpot) {
        setJackpotAmount(winAmount);
        setJackpotVisible(true);
        setWinFlash('jackpot');
      } else {
        setWinFlash('win');
      }
    } else {
      setWinFlash('loss');
    }

    const entry = buildHistoryEntry(result, bet, id);
    setHistory(prev => [entry, ...prev].slice(0, 30));
  }, [bet, credit, recordWin, wallet.totalWon, wallet.spins]);

  const handleBetChange = (newBet: number) => {
    if (newBet <= wallet.balance) setBet(newBet);
  };

  // Dynamic background flash — must stay inline as it's runtime-computed
  const bgFlash =
    winFlash === 'jackpot' ? 'rgba(245,200,66,0.06)' :
      winFlash === 'win' ? 'rgba(0,230,118,0.04)' :
        winFlash === 'loss' ? 'rgba(229,57,53,0.02)' : 'transparent';

  const bgStyle = bgFlash !== 'transparent'
    ? { background: `radial-gradient(ellipse at center, ${bgFlash}, transparent 70%)` }
    : undefined;

  return (
    <>
      {/* Name Prompt */}
      <NamePrompt open={namePromptOpen} onSave={saveName} />

      {/* Jackpot Overlay */}
      <JackpotOverlay
        show={jackpotVisible}
        amount={jackpotAmount}
        onDismiss={() => setJackpotVisible(false)}
      />

      {/* Paytable Modal */}
      {paytableOpen && <Paytable onClose={() => setPaytableOpen(false)} />}

      {/* Main Layout */}
      <div className="casino-page-wrap" data-flash={winFlash ?? 'none'}>

        {/* ======= HEADER ======= */}
        <header className="casino-header">
          <div className="casino-header-left">
            <span className="casino-header-icon">🎰</span>
            <div>
              <div className="casino-brand-name">LUCKY REELS</div>
              <div className="casino-brand-sub">CASINO SIMULATOR</div>
            </div>
          </div>

          <div className="casino-header-right">
            {playerName && (
              <div className="casino-player-name">
                👤 <span className="casino-player-name-gold">{playerName}</span>
              </div>
            )}
            <div className="casino-balance">
              🪙 {wallet.balance.toLocaleString()}
            </div>
          </div>
        </header>

        {/* ======= MAIN CONTENT ======= */}
        <main className="casino-main">

          {/* ---- LEFT PANEL ---- */}
          <div className="panel-left">
            <Wallet
              wallet={wallet}
              currentBet={bet}
              onBetChange={handleBetChange}
              onDeduct={deduct}
              onCredit={credit}
            />

            {/* Add Credits Button */}
            <button
              className="btn-payment btn-panel-full"
              onClick={() => router.push('/add-credits')}
            >
              💳 Add Credits
            </button>

            {/* Cash Out Button */}
            <button
              className="btn-cashout btn-panel-full"
              disabled={wallet.balance === 0}
              onClick={() => router.push('/cashout')}
            >
              🏦 Cash Out
            </button>

            {/* Paytable Button */}
            <button
              className="btn-secondary btn-panel-full"
              onClick={() => setPaytableOpen(true)}
            >
              📋 View Paytable
            </button>
          </div>

          {/* ---- CENTER: SLOT MACHINE ---- */}
          <div className="panel-center">
            {/* Machine Title */}
            <div className="machine-title-wrap">
              <div className="machine-title">JACKPOT MACHINE</div>
              <div className="machine-tagline">MATCH SYMBOLS • WIN CHIPS</div>
            </div>

            {/* Machine Cabinet */}
            <div className="machine-cabinet">
              <div className="cabinet-light cabinet-light-0" />
              <div className="cabinet-light cabinet-light-1" />
              <div className="cabinet-light cabinet-light-2" />
              <div className="cabinet-light cabinet-light-3" />
              <div className="cabinet-light cabinet-light-4" />
              <div className="cabinet-light cabinet-light-5" />

              <SlotMachine
                bet={bet}
                onSpin={handleSpin}
                onResult={handleResult}
                disabled={spinning || wallet.balance < bet}
              />

              {/* Low balance warning */}
              {wallet.balance < bet && !spinning && (
                <div className="low-balance-warn">
                  ⚠ Not enough chips!{' '}
                  <span
                    className="low-balance-link"
                    onClick={() => router.push('/add-credits')}
                  >Add Credits</span>
                </div>
              )}
            </div>

            {/* Jackpot meter teaser */}
            <div className="jackpot-teaser">
              🎯 JACKPOT: <span className="jackpot-teaser-gold">
                THREE 7️⃣ = {(bet * 100).toLocaleString()} chips!
              </span>
            </div>

            {/* Game Rules */}
            <div className="glass-card how-to-play-card">
              <div className="how-to-play-title">HOW TO PLAY</div>
              <div className="how-to-play-list">
                {[
                  { icon: '1️⃣', text: 'Select your bet amount on the left' },
                  { icon: '2️⃣', text: 'Press SPIN — the reels will roll!' },
                  { icon: '3️⃣', text: 'Match 2 or 3 symbols to win chips' },
                  { icon: '🎰', text: 'Hit three 7️⃣s for the JACKPOT!' },
                  { icon: '🪙', text: 'Add Credits to top up your wallet' },
                ].map((rule, i) => (
                  <div key={i} className="how-to-play-row">
                    <span>{rule.icon}</span>
                    <span>{rule.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---- RIGHT PANEL ---- */}
          <div className="panel-right">
            <Leaderboard board={board} playerName={playerName} />
            <History entries={history} />
          </div>
        </main>

        {/* ======= FOOTER ======= */}
        <footer className="casino-footer">
          🎰 Lucky Reels Casino Simulator — For entertainment only. No real money involved.
        </footer>
      </div>
    </>
  );
}
