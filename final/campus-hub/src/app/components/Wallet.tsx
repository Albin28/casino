'use client';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'lucky_reels_wallet';
const STARTING_BALANCE = 0;

export type WalletState = {
    balance: number;
    totalWon: number;
    totalLost: number;
    spins: number;
    totalDeposited: number;
};

const BET_OPTIONS = [10, 25, 50, 100, 250];

type WalletProps = {
    onBetChange: (bet: number) => void;
    onDeduct: (amount: number) => void;
    onCredit: (amount: number) => void;
    wallet: WalletState;
    currentBet: number;
};

export function useWallet() {
    const [wallet, setWallet] = useState<WalletState>({
        balance: STARTING_BALANCE,
        totalWon: 0,
        totalLost: 0,
        spins: 0,
        totalDeposited: 0,
    });

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { setWallet(JSON.parse(saved)); } catch { /* ignore */ }
        }
    }, []);

    const save = useCallback((w: WalletState) => {
        setWallet(w);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
    }, []);

    const deduct = useCallback((amount: number) => {
        setWallet(prev => {
            const next = { ...prev, balance: prev.balance - amount, totalLost: prev.totalLost + amount, spins: prev.spins + 1 };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const credit = useCallback((amount: number) => {
        setWallet(prev => {
            const next = { ...prev, balance: prev.balance + amount, totalWon: prev.totalWon + amount };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    // addCredits: deposit via payment page — does NOT count as winnings
    const addCredits = useCallback((amount: number) => {
        setWallet(prev => {
            const next = {
                ...prev,
                balance: prev.balance + amount,
                totalDeposited: (prev.totalDeposited || 0) + amount,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    // cashout: zero the balance (mock withdrawal)
    const cashout = useCallback(() => {
        setWallet(() => {
            const next: WalletState = {
                balance: 0,
                totalWon: 0,
                totalLost: 0,
                spins: 0,
                totalDeposited: 0,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const reset = useCallback(() => {
        const fresh: WalletState = { balance: STARTING_BALANCE, totalWon: 0, totalLost: 0, spins: 0, totalDeposited: 0 };
        save(fresh);
    }, [save]);

    return { wallet, deduct, credit, addCredits, cashout, reset };
}

export default function Wallet({ onBetChange, wallet, currentBet }: WalletProps) {
    const net = wallet.totalWon - wallet.totalLost;
    const netClass = net >= 0 ? 'wallet-stat-value-green' : 'wallet-stat-value-red';

    return (
        <div className="wallet-wrap">
            {/* Balance Display */}
            <div className="glass-card-gold wallet-balance-card">
                <div className="wallet-balance-label">WALLET BALANCE</div>
                <div className="wallet-balance-value">🪙 {wallet.balance.toLocaleString()}</div>
                <div className="wallet-balance-unit">chips</div>
                {wallet.totalDeposited > 0 && (
                    <div className="wallet-deposited">
                        Deposited: <span className="wallet-deposited-green">₹{wallet.totalDeposited.toLocaleString()}</span>
                    </div>
                )}
            </div>

            {/* Bet Selection */}
            <div className="glass-card wallet-bet-card">
                <div className="wallet-bet-label">SELECT BET</div>
                <div className="bet-grid">
                    {BET_OPTIONS.map(bet => (
                        <button
                            key={bet}
                            className={`btn-bet${currentBet === bet ? ' active' : ''}`}
                            onClick={() => onBetChange(bet)}
                            disabled={wallet.balance < bet}
                        >
                            {bet}
                        </button>
                    ))}
                    <button
                        className={`btn-bet btn-bet-maxbet${currentBet === Math.min(wallet.balance, 500) && currentBet > 250 ? ' active' : ''}`}
                        onClick={() => onBetChange(Math.min(wallet.balance, 500))}
                        disabled={wallet.balance < 10}
                    >
                        MAX BET
                    </button>
                </div>
            </div>

            {/* Current Bet */}
            <div className="wallet-current-bet">
                Betting: <span className="wallet-bet-amount">{currentBet} chips</span>
            </div>

            {/* Stats */}
            <div className="glass-card wallet-stats-card">
                <div className="wallet-stat">
                    <div className="wallet-stat-label">SPINS</div>
                    <div className="wallet-stat-value">{wallet.spins}</div>
                </div>
                <div className="wallet-stat">
                    <div className="wallet-stat-label">NET</div>
                    <div className={`wallet-stat-value ${netClass}`}>
                        {net >= 0 ? '+' : ''}{net.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
}
