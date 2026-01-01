import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight } from 'lucide-react';
import googleLogo from '../assets/google-g.png';

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const { login, t } = useApp();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        login();
        navigate('/app');
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 64px)',
            backgroundColor: '#F3F4F6',
            padding: '1rem'
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>MEMOTILES</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    {isRegistering ? t('createAccount') : t('welcomeBack')}
                </p>

                {/* Google Login Mock */}
                <button
                    onClick={handleSubmit}
                    className="btn btn-secondary"
                    style={{ width: '100%', marginBottom: '1.5rem', justifyContent: 'center', gap: '0.75rem' }}
                >
                    <img src={googleLogo} alt="Google" style={{ width: '18px', height: '18px' }} />
                    {t('continueGoogle')}
                </button>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '1.5rem 0',
                    color: 'var(--text-tertiary)',
                    fontSize: '0.875rem'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    <span style={{ padding: '0 0.5rem' }}>{t('or')}</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {isRegistering && (
                        <input type="text" placeholder={t('fullName')} className="input" />
                    )}
                    <input type="email" placeholder={t('emailPlaceholder')} className="input" required />
                    <input type="password" placeholder={t('passwordPlaceholder')} className="input" required />
                    {isRegistering && (
                        <input type="password" placeholder={t('confirmPasswordPlaceholder')} className="input" required />
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        {isRegistering ? t('createAccountBtn') : t('signIn')}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
                    {isRegistering ? t('alreadyHaveAccount') + " " : t('newHere') + " "}
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        style={{ color: 'var(--accent)', fontWeight: '600' }}
                    >
                        {isRegistering ? t('signIn') : t('createAccount')}
                    </button>
                </div>

                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2rem' }}>
                    {t('termsPrivacy')}
                    <br />
                    {t('loginRedirect')}
                </p>
            </div>
        </div>
    );
}
