
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CreditCard, Image as ImageIcon } from 'lucide-react';
import AppLayout from '../components/AppLayout';

import { createOrder } from '../utils/orders';

export default function Checkout() {
    const { cart: contextCart, t } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    // Use items passed from Dashboard, otherwise fallback to context cart
    const cart = location.state?.orderItems || contextCart;

    const [shipping, setShipping] = useState({
        name: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'Thailand',
        phone: ''
    });

    const total = cart.length * 200;

    const handlePay = (e) => {
        e.preventDefault();
        const newOrder = createOrder({
            items: cart,
            total,
            currency: '฿',
            shipping
        });
        navigate(`/order-success?orderId=${newOrder.id}`);
    };

    if (cart.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <h2>{t('cartEmpty')}</h2>
                <button
                    onClick={() => navigate('/app')}
                    className="btn btn-primary"
                    style={{ marginTop: '1rem' }}
                >
                    {t('goToDashboard')}
                </button>
            </div>
        )
    }

    return (
        <AppLayout>
            <div className="container" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>{t('checkoutTitle')}</h1>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '4rem' }}>
                    {/* Left: Shipping & Payment */}
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>{t('shippingAddress')}</h2>
                        <form id="checkout-form" onSubmit={handlePay} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="text-secondary text-sm">{t('fullName')}</label>
                                <input
                                    type="text" required
                                    className="input"
                                    value={shipping.name}
                                    onChange={e => setShipping({ ...shipping, name: e.target.value })}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="text-secondary text-sm">{t('address')}</label>
                                <input
                                    type="text" required
                                    className="input"
                                    value={shipping.address}
                                    onChange={e => setShipping({ ...shipping, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-secondary text-sm">{t('city')}</label>
                                <input
                                    type="text" required
                                    className="input"
                                    value={shipping.city}
                                    onChange={e => setShipping({ ...shipping, city: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-secondary text-sm">{t('postalCode')}</label>
                                <input
                                    type="text" required
                                    className="input"
                                    value={shipping.postalCode}
                                    onChange={e => setShipping({ ...shipping, postalCode: e.target.value })}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="text-secondary text-sm">{t('country')}</label>
                                <select
                                    className="input"
                                    value={shipping.country}
                                    onChange={e => setShipping({ ...shipping, country: e.target.value })}
                                >
                                    <option value="Thailand">Thailand</option>
                                    <option value="USA">USA</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="text-secondary text-sm">{t('phone')}</label>
                                <input
                                    type="tel" required
                                    className="input"
                                    value={shipping.phone}
                                    onChange={e => setShipping({ ...shipping, phone: e.target.value })}
                                />
                            </div>
                        </form>

                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginTop: '3rem', marginBottom: '1.5rem' }}>{t('payment')}</h2>
                        <div className="card">
                            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem', backgroundColor: 'black' }}>
                                {t('payGPay')}
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-tertiary)' }}>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                                <span style={{ padding: '0 0.5rem', fontSize: '0.875rem' }}>{t('payCard')}</span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CreditCard size={20} className="text-secondary" />
                                    <input type="text" placeholder="Card number" style={{ border: 'none', width: '100%', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input type="text" placeholder="MM / YY" className="input" />
                                    <input type="text" placeholder="CVC" className="input" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div>
                        <div className="card" style={{ position: 'sticky', top: '100px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>{t('orderSummary')}</h3>

                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                                {cart.map(item => (
                                    <div key={item.id} style={{ flexShrink: 0, width: '60px', height: '60px', background: '#E5E7EB', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ImageIcon size={16} color="var(--text-tertiary)" />
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{cart.length} {t('tilesCount')}</span>
                                <span>฿{total}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{t('shipping')}</span>
                                <span style={{ color: '#10B981' }}>{t('free')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                                <span>{t('total')}</span>
                                <span>฿{total}</span>
                            </div>

                            <button type="submit" form="checkout-form" className="btn btn-primary" style={{ width: '100%' }}>
                                {t('payNow')}
                            </button>
                            <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                                {t('paymentRedirect')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

