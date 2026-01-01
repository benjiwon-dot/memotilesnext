import React from 'react';
import { useApp } from '../context/AppContext';

export default function HeroHowItWorksMini() {
    const { t } = useApp();

    const steps = [
        {
            key: 1,
            title: t('heroMiniStep1Title'),
            desc: t('heroMiniStep1Desc'),
            img: '/assets/steps/step-1.png'
        },
        {
            key: 2,
            title: t('heroMiniStep2Title'),
            desc: t('heroMiniStep2Desc'),
            img: '/assets/steps/step-2.png'
        },
        {
            key: 3,
            title: t('heroMiniStep3Title'),
            desc: t('heroMiniStep3Desc'),
            img: '/assets/steps/step-3.png'
        },
        {
            key: 4,
            title: t('heroMiniStep4Title'),
            desc: t('heroMiniStep4Desc'),
            img: '/assets/steps/step-4.png'
        }
    ];

    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1.5rem'
            }} className="hero-mini-grid">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media (max-width: 640px) {
                        .hero-mini-grid {
                            grid-template-columns: repeat(2, 1fr) !important;
                            gap: 1rem !important;
                        }
                    }
                `}} />
                {steps.map((step) => (
                    <div key={step.key} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '100%',
                            maxWidth: '200px',
                            margin: '0 auto',
                            aspectRatio: '1/1',
                            borderRadius: '1rem',
                            border: '1px solid #F3F4F6',
                            overflow: 'hidden',
                            backgroundColor: '#F7F7F7',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            padding: 0
                        }}>
                            <img
                                src={step.img}
                                alt={step.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    display: 'block'
                                }}
                            />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#111827', marginBottom: '0.25rem' }}>{step.title}</h4>
                            <p style={{ fontSize: '0.75rem', color: '#6B7280', lineHeight: '1.4', padding: '0 0.25rem' }}>{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
