'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'lucky_reels_wallet';

type WalletState = {
    balance: number;
    totalWon: number;
    totalLost: number;
    spins: number;
    totalDeposited: number;
};

type Step = 'confirm' | 'processing' | 'success';

export default function CashoutPage() {
    const router = useRouter();
    const [wallet, setWallet] = useState<WalletState>({ balance: 0, totalWon: 0, totalLost: 0, spins: 0, totalDeposited: 0 });
    const [step, setStep] = useState<Step>('confirm');

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) { try { setWallet(JSON.parse(raw)); } catch { } }
    }, []);

    const netGain = wallet.totalWon - wallet.totalLost;
    const amount = wallet.balance;

    const handleCashout = () => {
        setStep('processing');
        setTimeout(() => {
            const fresh: WalletState = { balance: 0, totalWon: 0, totalLost: 0, spins: 0, totalDeposited: 0 };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            setStep('success');
            setTimeout(() => router.push('/'), 2800);
        }, 1600);
    };

    return (
        <div className="page-center">
            <div className="page-header-md">
                {step === 'confirm' && (
                    <div className="back-btn-row">
                        <button onClick={() => router.push('/')} className="btn-secondary">← Back to Game</button>
                    </div>
                )}
                <div className="header-center">
                    <div className="page-title-gold">🏦 CASH OUT</div>
                    <div className="page-subtitle">MOCK WITHDRAWAL — DEMO ONLY</div>
                </div>
            </div>

            <div className="page-content-md">

                {/* ========== CONFIRM ========== */}
                {step === 'confirm' && (
                    <>
                        <div className="glass-card-gold-receipt">
                            <div className="section-label">SESSION SUMMARY</div>
                            <div className="receipt-rows">
                                {[
                                    { label: 'Total Spins', value: wallet.spins.toLocaleString(), cls: '' },
                                    { label: 'Total Won', value: `🪙 ${wallet.totalWon.toLocaleString()} chips`, cls: 'receipt-val-green' },
                                    { label: 'Total Bet', value: `🪙 ${wallet.totalLost.toLocaleString()} chips`, cls: 'receipt-val-red' },
                                    { label: 'Deposited', value: `₹${(wallet.totalDeposited || 0).toLocaleString()}`, cls: 'receipt-val-secondary' },
                                ].map(row => (
                                    <div key={row.label} className="receipt-row">
                                        <span className="receipt-label">{row.label}</span>
                                        <span className={`receipt-val ${row.cls}`}>{row.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="cashout-amount-box">
                                <div>
                                    <div className="cashout-amount-label">CASHOUT AMOUNT</div>
                                    <div className="cashout-amount-value">₹{amount.toLocaleString()}</div>
                                </div>
                                <div className="cashout-right">
                                    <div className="cashout-chip-label">1 chip = ₹1</div>
                                    <div className="cashout-chip-count">🪙 {amount.toLocaleString()} chips</div>
                                </div>
                            </div>

                            {netGain >= 0
                                ? <div className="profit-msg">🎉 Profit: +₹{netGain.toLocaleString()} — Nice going!</div>
                                : <div className="loss-msg">Net: -₹{Math.abs(netGain).toLocaleString()} — Better luck next time!</div>
                            }
                        </div>

                        <div className="demo-warning">
                            🔒 This is a DEMO. Tapping Cash Out will reset your wallet to zero.
                        </div>

                        {amount === 0 ? (
                            <div className="glass-card empty-chips-msg">
                                No chips to cash out. Add Credits and play to earn!
                            </div>
                        ) : (
                            <button className="btn-cashout btn-panel-full" onClick={handleCashout}>
                                💸 Cash Out ₹{amount.toLocaleString()} →
                            </button>
                        )}

                        <button className="btn-secondary btn-panel-full" onClick={() => router.push('/')}>
                            Keep Playing
                        </button>
                    </>
                )}

                {/* ========== PROCESSING ========== */}
                {step === 'processing' && (
                    <div className="glass-card processing-section">
                        <div className="processing-spinner">💸</div>
                        <div className="processing-title">TRANSFERRING FUNDS</div>
                        <div className="processing-subtitle">Please wait...</div>
                        <div className="processing-dots">
                            <div className="processing-dot processing-dot-0" />
                            <div className="processing-dot processing-dot-1" />
                            <div className="processing-dot processing-dot-2" />
                        </div>
                    </div>
                )}

                {/* ========== SUCCESS ========== */}
                {step === 'success' && (
                    <div className="success-section">
                        <div className="success-icon">🎉</div>
                        <div>
                            <div className="success-title-green">TRANSFER SUCCESSFUL!</div>
                            <div className="success-subtitle">₹{amount.toLocaleString()} sent to your mock account</div>
                        </div>
                        <div className="glass-card-gold-withdrawal">
                            <div className="section-label">WITHDRAWAL RECEIPT</div>
                            {[
                                { label: 'Amount', value: `₹${amount.toLocaleString()}` },
                                { label: 'Chips Redeemed', value: `🪙 ${amount.toLocaleString()}` },
                                { label: 'Status', value: '✅ Processed' },
                                { label: 'Mode', value: '🔒 Demo Only' },
                            ].map(row => (
                                <div key={row.label} className="receipt-table-row">
                                    <span className="receipt-table-label">{row.label}</span>
                                    <span className="receipt-table-value">{row.value}</span>
                                </div>
                            ))}
                            <div className="txn-id">Transaction ID: LR{Date.now().toString(36).toUpperCase()}</div>
                        </div>
                        <div className="redirect-notice">Redirecting to game...</div>
                    </div>
                )}
            </div>
        </div>
    );
}
