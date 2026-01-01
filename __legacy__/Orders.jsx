import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Package, Clock, CheckCircle, Image as ImageIcon, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { getOrders, cancelOrder, canEdit } from '../utils/orders';

export default function Orders() {
    const { t } = useApp();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [expandedOrderId, setExpandedOrderId] = useState(null);

    const refreshOrders = () => {
        setOrders(getOrders());
    };

    useEffect(() => {
        refreshOrders();

        // Sync across tabs/windows or when updated elsewhere
        const handleStorageChange = () => refreshOrders();
        window.addEventListener('storage', handleStorageChange);

        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Filter logic with Safety Check
    const safeOrders = Array.isArray(orders) ? orders : [];
    const activeOrders = safeOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    const pastOrders = safeOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

    const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders;

    const toggleExpand = (id) => {
        setExpandedOrderId(expandedOrderId === id ? null : id);
    };

    const handleEdit = (orderId) => {
        navigate(`/app?editOrderId=${orderId}`);
    };

    const handleCancel = (orderId) => {
        if (window.confirm(t('confirmCancel') || 'Are you sure you want to cancel this order?')) {
            cancelOrder(orderId);
            refreshOrders();
        }
    };

    const toTitle = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

    const getStatusInfo = (status) => {
        const s = (status || '').toLowerCase();
        if (['printed', 'shipping', 'shipped'].includes(s)) {
            return {
                label: t('orderStatusShippingInProgress'),
                subtitle: t('orderSubtitleShippingInProgress'),
                color: '#3730A3',
                bg: '#E0E7FF'
            };
        }
        if (s === 'delivered') {
            return {
                label: t('orderStatusDelivered'),
                subtitle: t('orderSubtitleDelivered'),
                color: '#065F46',
                bg: '#D1FAE5'
            };
        }
        if (s === 'cancelled') {
            return {
                label: t('cancelled'),
                color: '#991B1B',
                bg: '#FEE2E2'
            };
        }
        // paid, processing
        return {
            label: t(s) || toTitle(s),
            color: '#1E40AF',
            bg: '#DBEAFE'
        };
    };

    return (
        <AppLayout>
            <div className="container" style={{ marginTop: '2rem', maxWidth: '800px', paddingBottom: '4rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>{t('ordersTitle')}</h1>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('active')}
                        style={{
                            padding: '1rem 2rem',
                            borderBottom: activeTab === 'active' ? '2px solid var(--primary)' : '2px solid transparent',
                            fontWeight: activeTab === 'active' ? '600' : '400',
                            color: activeTab === 'active' ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            background: 'none',
                            border: 'none',
                            outline: 'none'
                        }}
                    >
                        {t('active')} ({activeOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        style={{
                            padding: '1rem 2rem',
                            borderBottom: activeTab === 'past' ? '2px solid var(--primary)' : '2px solid transparent',
                            fontWeight: activeTab === 'past' ? '600' : '400',
                            color: activeTab === 'past' ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            background: 'none',
                            border: 'none',
                            outline: 'none'
                        }}
                    >
                        {t('past')} ({pastOrders.length})
                    </button>
                </div>

                {/* Orders List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {displayedOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                            <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>{t('noOrders')}</p>
                        </div>
                    ) : (
                        displayedOrders.map(order => (
                            <div key={order.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>

                                {/* Header */}
                                <div
                                    onClick={() => toggleExpand(order.id)}
                                    style={{
                                        padding: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 'bold' }}>{order.id}</span>
                                            <span className="badge" style={{
                                                backgroundColor: getStatusInfo(order.status).bg,
                                                color: getStatusInfo(order.status).color,
                                                textTransform: 'none'
                                            }}>
                                                {getStatusInfo(order.status).label}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {new Date(order.createdAt).toLocaleDateString()} &bull; {order.currency || '฿'}{order.total} &bull; {order.items.length} {t('items')}
                                        </span>
                                    </div>
                                    {expandedOrderId === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>

                                {/* Expanded Details */}
                                {expandedOrderId === order.id && (
                                    <div style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', backgroundColor: '#F9FAFB' }}>

                                        {/* Thumbnails of items */}
                                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                            {order.items.map((item, idx) => (
                                                <div key={idx} style={{ flexShrink: 0, width: '80px', height: '80px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' }}>
                                                    <ImageIcon size={24} color="var(--text-tertiary)" />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Timeline if not cancelled */}
                                        {order.status !== 'cancelled' && (
                                            <div style={{ marginBottom: '2rem' }}>
                                                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>{t('orderStatus')}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                                                    {/* Simplified Visual Timeline */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: ['printed', 'shipping', 'shipped', 'delivered'].includes(order.status) ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                                                        <CheckCircle size={16} /> {t('printing') || 'Printing'}
                                                    </div>
                                                    <div style={{ height: '1px', flex: 1, backgroundColor: ['shipping', 'shipped', 'delivered'].includes(order.status) ? '#10B981' : '#E5E7EB' }}></div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: ['shipping', 'shipped', 'delivered'].includes(order.status) ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                                                        <CheckCircle size={16} /> {t('shipped')}
                                                    </div>
                                                    <div style={{ height: '1px', flex: 1, backgroundColor: order.status === 'delivered' ? '#10B981' : '#E5E7EB' }}></div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: order.status === 'delivered' ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                                                        <CheckCircle size={16} /> {t('delivered')}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                            <div>
                                                {order.shipping && (
                                                    <>
                                                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t('shippingAddress')}</h4>
                                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                                            {order.shipping.name}<br />
                                                            {order.shipping.address}<br />
                                                            {order.shipping.city} {order.shipping.postalCode}<br />
                                                            {order.shipping.country}
                                                        </p>
                                                    </>
                                                )}
                                            </div>

                                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
                                                {canEdit(order) ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(order.id); }}
                                                            className="btn btn-primary"
                                                            style={{ width: 'fit-content' }}>
                                                            {toTitle(t('editOrder') || 'Edit Order')}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleCancel(order.id); }}
                                                            className="btn btn-secondary"
                                                            style={{
                                                                width: 'fit-content',
                                                                borderColor: '#EF4444',
                                                                color: '#EF4444',
                                                                backgroundColor: 'white'
                                                            }}>
                                                            {toTitle(t('cancelOrder') || 'Cancel Order')}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div style={{ textAlign: 'right' }}>
                                                        {getStatusInfo(order.status).subtitle ? (
                                                            <div style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                                                                {getStatusInfo(order.status).subtitle}
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', backgroundColor: '#F3F4F6', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                                                                <AlertCircle size={14} />
                                                                {t('orderLockedDesc')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
