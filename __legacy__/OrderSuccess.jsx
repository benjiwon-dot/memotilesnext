import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import AppLayout from '../components/AppLayout';

export default function OrderSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useApp();

    // Parse query params to show Order ID if available
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get('orderId');

    return (
        <AppLayout>
            <div style={{
                minHeight: 'calc(100vh - 64px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F9FAFB',
                padding: '1rem'
            }}>
                <div className="card" style={{
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#ECFDF5',
                        color: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.5rem'
                    }}>
                        <CheckCircle size={40} />
                    </div>

                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        Thank you for your order!
                    </h1>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', lineHeight: '1.6' }}>
                        We’re preparing your tiles now. <br />
                        {orderId && <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: '600' }}>Order #{orderId}</span>}
                    </p>

                    <div style={{
                        backgroundColor: '#F3F4F6',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        width: '100%',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                    }}>
                        Track progress anytime in My Orders.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', marginTop: '1rem' }}>
                        <button
                            onClick={() => navigate('/my-orders')}
                            className="btn btn-primary"
                            style={{ justifyContent: 'center', padding: '1rem' }}
                        >
                            <Package size={20} style={{ marginRight: '0.5rem' }} />
                            View My Orders
                        </button>

                        <button
                            onClick={() => navigate('/app')}
                            className="btn btn-secondary"
                            style={{ justifyContent: 'center', padding: '1rem' }}
                        >
                            Create More Tiles
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
