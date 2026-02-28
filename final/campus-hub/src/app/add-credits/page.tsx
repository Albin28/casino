'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'lucky_reels_wallet';

const AMOUNT_PRESETS = [
    { label: '₹100', value: 100, chips: 100 },
    { label: '₹200', value: 200, chips: 200 },
    { label: '₹500', value: 500, chips: 500 },
    { label: '₹1000', value: 1000, chips: 1000 },
];

// Accepted demo UPI IDs (any of these will work)
const DEMO_UPI_IDS = ['demo@upi', 'casino@ybl', 'lucky@paytm', '9999999999@upi'];
// Demo PIN
const DEMO_PIN = '1234';

type Step = 'amount' | 'details' | 'pin' | 'success';
const ORDER: Step[] = ['amount', 'details', 'pin'];

export default function AddCreditsPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('amount');
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [pin, setPin] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const finalAmount = selectedAmount ?? (parseInt(customAmount) || 0);

    const canProceedAmount = finalAmount >= 10;
    const canProceedDetails = upiId.includes('@') && upiId.length >= 5;

    const handlePinKey = (key: string) => {
        setError('');
        if (key === '⌫') { setPin(p => p.slice(0, -1)); return; }
        if (pin.length >= 4) return;
        const next = pin + key;
        setPin(next);
        if (next.length === 4) {
            setTimeout(() => submitPayment(next), 300);
        }
    };

    const submitPayment = (enteredPin: string) => {
        if (enteredPin.length !== 4) { setError('Enter 4-digit PIN'); return; }
        if (enteredPin !== DEMO_PIN) {
            setError('Incorrect PIN. Try: ' + DEMO_PIN);
            setPin('');
            return;
        }
        setProcessing(true);
        setTimeout(() => {
            const raw = localStorage.getItem(STORAGE_KEY);
            const wallet = raw ? JSON.parse(raw) : { balance: 0, totalWon: 0, totalLost: 0, spins: 0, totalDeposited: 0 };
            wallet.balance = (wallet.balance || 0) + finalAmount;
            wallet.totalDeposited = (wallet.totalDeposited || 0) + finalAmount;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
            setProcessing(false);
            setStep('success');
            setTimeout(() => router.push('/'), 2500);
        }, 1800);
    };

    const goBack = () => {
        if (step === 'amount') { router.push('/'); return; }
        const idx = ORDER.indexOf(step as Step);
        if (idx > 0) setStep(ORDER[idx - 1]);
    };

    const pinKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];

    return (
        <div className="page-center">
            {/* Header */}
            <div className="page-header-sm">
                <div className="back-btn-row">
                    <button onClick={goBack} className="btn-secondary">← Back</button>
                </div>
                <div className="header-center">
                    <div className="page-title-cyan">💳 ADD CREDITS</div>
                    <div className="page-subtitle">MOCK PAYMENT GATEWAY — DEMO ONLY</div>
                </div>
            </div>

            {/* Main card */}
            <div className="glass-card add-credits-card">

                {/* Step indicator */}
                {step !== 'success' && (
                    <div className="step-indicators">
                        {ORDER.map((s, i) => {
                            const current = ORDER.indexOf(step as Step);
                            const done = ORDER.indexOf(s) <= current;
                            const passed = done && ORDER.indexOf(s) < current;
                            return (
                                <div key={s} className="step-indicator-group">
                                    <div className={`step-dot${done ? ' step-dot-done' : ''}`}>
                                        {passed ? '✓' : i + 1}
                                    </div>
                                    {i < ORDER.length - 1 && <div className={passed ? 'step-connector-done' : 'step-connector'} />}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ========== STEP 1: SELECT AMOUNT ========== */}
                {step === 'amount' && (
                    <div className="page-content-sm">
                        <div>
                            <div className="section-label-sm">SELECT AMOUNT</div>
                            <div className="amount-grid">
                                {AMOUNT_PRESETS.map(p => (
                                    <button
                                        key={p.value}
                                        className={`amount-chip${selectedAmount === p.value ? ' selected' : ''}`}
                                        onClick={() => { setSelectedAmount(p.value); setCustomAmount(''); }}
                                    >
                                        <div>{p.label}</div>
                                        <div className="amount-chip-sub">{p.chips} chips</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="custom-amount-label">OR ENTER CUSTOM AMOUNT (₹)</div>
                            <input
                                className="pay-input"
                                type="number"
                                min={10}
                                max={100000}
                                placeholder="e.g. 750"
                                value={customAmount}
                                onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                            />
                            {customAmount && parseInt(customAmount) < 10 && (
                                <div className="amount-error">Minimum amount is ₹10</div>
                            )}
                        </div>

                        {finalAmount > 0 && (
                            <div className="glass-card-gold-transfer">
                                <div className="preview-row">
                                    <span className="preview-label">You will receive</span>
                                    <span className="preview-chips">🪙 {finalAmount.toLocaleString()} chips</span>
                                </div>
                            </div>
                        )}

                        <button
                            className={`btn-payment btn-panel-full${canProceedAmount ? '' : ' btn-disabled'}`}
                            disabled={!canProceedAmount}
                            onClick={() => setStep('details')}
                        >
                            Continue →
                        </button>
                    </div>
                )}

                {/* ========== STEP 2: UPI DETAILS ========== */}
                {step === 'details' && (
                    <div className="page-content-sm">
                        <div className="section-label-sm-mb8">📱 UPI PAYMENT</div>

                        <div className="glass-card pay-method-preview">
                            <div className="pay-method-info">
                                <span className="pay-method-icon">📱</span>
                                <div>
                                    <div className="pay-method-name">UPI Payment</div>
                                    <div className="pay-method-desc">Instant transfer · No charges</div>
                                </div>
                            </div>
                        </div>

                        <div className="form-fields">
                            <div>
                                <label className="form-label">UPI ID</label>
                                <input
                                    className="pay-input"
                                    placeholder="yourname@upi"
                                    value={upiId}
                                    onChange={e => setUpiId(e.target.value)}
                                />
                            </div>
                            <div className="glass-card upi-hint">
                                💡 Demo UPI ID: <strong>demo@upi</strong> &nbsp;|&nbsp; PIN: <strong>1234</strong>
                            </div>
                        </div>

                        <div className="glass-card-gold-transfer">
                            <div className="pay-amount-row">
                                <span className="pay-amount-label">Paying</span>
                                <span className="pay-amount-value">₹{finalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="demo-warning">
                            🔒 This is a DEMO simulator. No real transactions are processed.
                        </div>

                        <button
                            className={`btn-payment btn-panel-full${canProceedDetails ? '' : ' btn-disabled'}`}
                            disabled={!canProceedDetails}
                            onClick={() => { setPin(''); setError(''); setStep('pin'); }}
                        >
                            Proceed to Pay ₹{finalAmount.toLocaleString()} →
                        </button>
                    </div>
                )}

                {/* ========== STEP 3: UPI PIN ========== */}
                {step === 'pin' && (
                    <div className="pin-section">
                        <div className="pin-header">
                            <div className="section-label">ENTER UPI PIN</div>
                            <div className="pin-subtitle">
                                Confirm payment of <span className="pin-amount-gold">₹{finalAmount.toLocaleString()}</span>
                            </div>
                            <div className="pin-upiid-label">via <strong>{upiId}</strong></div>
                        </div>

                        <div className="pin-dots">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className={`pin-dot${i >= pin.length ? ' empty' : ''}`} />
                            ))}
                        </div>

                        {error && <div className="pin-error">{error}</div>}

                        {processing ? (
                            <div className="pin-processing">
                                <div className="pin-processing-icon">⚙️</div>
                                <div className="pin-processing-text">PROCESSING PAYMENT...</div>
                            </div>
                        ) : (
                            <div className="pin-grid">
                                {pinKeys.map(k => (
                                    <button
                                        key={k}
                                        className={`pin-btn${k === '✓' ? ' pin-btn-confirm' : k === '⌫' ? ' pin-btn-delete' : ''}`}
                                        onClick={() => handlePinKey(k)}
                                    >
                                        {k}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ========== STEP 4: SUCCESS ========== */}
                {step === 'success' && (
                    <div className="payment-success">
                        <div className="payment-success-icon">✅</div>

                        <div>
                            <div className="success-title-payment">PAYMENT SUCCESSFUL!</div>
                            <div className="success-subtitle">₹{finalAmount.toLocaleString()} received</div>
                        </div>

                        <div className="glass-card-gold-receipt-sm">
                            <div className="payment-receipt-inner">RECEIPT</div>
                            <div className="payment-receipt-row">
                                <span className="payment-receipt-label">Amount Paid</span>
                                <span className="payment-receipt-value">₹{finalAmount.toLocaleString()}</span>
                            </div>
                            <div className="payment-receipt-row">
                                <span className="payment-receipt-label">UPI ID</span>
                                <span className="payment-receipt-value">{upiId}</span>
                            </div>
                            <div className="payment-receipt-chips">
                                <span className="payment-chips-label">Credits Added</span>
                                <span className="payment-chips-value">🪙 {finalAmount.toLocaleString()} chips</span>
                            </div>
                        </div>

                        <div className="redirect-notice">Redirecting to game in a moment...</div>
                    </div>
                )}
            </div>

            {/* Security badge */}
            {step !== 'success' && (
                <div className="security-badge">
                    <span>🔐</span>
                    <span>256-bit SSL Encrypted · Demo Gateway · No real money</span>
                </div>
            )}
        </div>
    );
}
