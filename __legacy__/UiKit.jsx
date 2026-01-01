import React, { useState } from 'react';
import { Check, Loader2, AlertCircle, Info, Image as ImageIcon, Settings, X } from 'lucide-react';
import AppLayout from '../components/AppLayout';

export default function UiKit() {
    const [loading, setLoading] = useState(false);

    return (
        <AppLayout>
            <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '4rem 0' }}>
                <div className="container">
                    <header style={{ marginBottom: '4rem' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1rem' }}>Visual UI Kit</h1>
                        <p style={{ color: 'var(--text-tertiary)', fontWeight: '500' }}>
                            A visual reference for design tokens and reusable components used across Memotiles.
                        </p>
                    </header>

                    <section style={{ display: 'grid', gap: '4rem' }}>
                        {/* --- BUTTONS --- */}
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Buttons</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Primary</span>
                                    <button className="btn btn-primary">Primary Button</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Secondary (Ghost-lite)</span>
                                    <button className="btn btn-text">Text Button</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Loading</span>
                                    <button className="btn btn-primary" disabled>
                                        <Loader2 size={18} className="animate-spin" /> Loading...
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)' }}>Disabled</span>
                                    <button className="btn btn-primary" disabled>Disabled Action</button>
                                </div>
                            </div>
                        </div>

                        {/* --- INPUTS --- */}
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Inputs</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>Standard Input</label>
                                    <input type="text" className="input" placeholder="Type something..." />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#EF4444' }}>Error State</label>
                                    <input type="text" className="input" style={{ borderColor: '#EF4444' }} defaultValue="Invalid value" />
                                    <span style={{ fontSize: '12px', color: '#EF4444' }}>This field is required.</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>Disabled Input</label>
                                    <input type="text" className="input" disabled value="Cannot edit this" />
                                </div>
                            </div>
                        </div>

                        {/* --- CARDS --- */}
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Cards</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                                <div className="card">
                                    <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.5rem' }}>Default Card</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Used for summaries, order items, and content sections.</p>
                                </div>
                                <div className="card" style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <Info size={20} color="#0284C7" />
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.5rem', color: '#0369A1' }}>Info Card</h3>
                                            <p style={{ color: '#075985', fontSize: '0.875rem' }}>Subtle background for tips or important notes.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- BADGES & STATUS --- */}
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Badges & Status</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
                                <div style={{ position: 'relative', width: '80px', height: '80px', backgroundColor: '#E5E7EB', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ImageIcon size={24} color="#9CA3AF" />
                                    <div style={{ position: 'absolute', top: 4, right: 4, background: 'white', border: '1px solid #10B981', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                        <Check size={10} color="#10B981" strokeWidth={4} />
                                    </div>
                                    <span style={{ position: 'absolute', bottom: -24, fontSize: '11px', fontWeight: '700', width: '100%', textAlign: 'center' }}>Saved Badge</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#111827', color: 'white', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }}>
                                    <Check size={14} color="#10B981" /> Success Toast
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', color: '#991B1B', fontSize: '0.75rem', fontWeight: '700' }}>
                                    <AlertCircle size={14} /> Inline Error Message
                                </div>
                            </div>
                        </div>

                        {/* --- MODALS (PREVIEW) --- */}
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Modals (Inline Preview)</h2>
                            <div style={{ maxWidth: '400px', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '800' }}>Confirm Action</h3>
                                    <X size={20} color="var(--text-tertiary)" />
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>Are you sure you want to proceed? This action cannot be undone.</p>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-text">Cancel</button>
                                    <button className="btn btn-primary" style={{ backgroundColor: '#EF4444' }}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
