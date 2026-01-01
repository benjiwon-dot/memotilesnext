import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Filter,
    ChevronDown,
    Download,
    Check,
    X,
    Image as ImageIcon,
    Calendar,
    MoreHorizontal,
    Phone,
    MapPin,
    CreditCard
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { getOrders, updateOrderStatus } from '../utils/orders';

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'paid', label: 'Paid' },
    { id: 'processing', label: 'Processing' },
    { id: 'printed', label: 'Printed' },
    { id: 'shipping', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' }
];

const SEARCH_FIELDS = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'id', label: 'Order ID' }
];

const SORT_OPTIONS = [
    { id: 'newest', label: 'Newest First' },
    { id: 'oldest', label: 'Oldest First' }
];

const DATE_PRESETS = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'custom', label: 'Custom Range' }
];

const STATUS_COLORS = {
    paid: { bg: '#DBEAFE', text: '#1E40AF' },
    processing: { bg: '#F3E8FF', text: '#6B21A8' },
    printed: { bg: '#FEF3C7', text: '#92400E' },
    shipping: { bg: '#E0E7FF', text: '#3730A3' },
    delivered: { bg: '#D1FAE5', text: '#065F46' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B' }
};

export default function Admin() {
    // Local State
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState('name');
    const [sortOption, setSortOption] = useState('newest');
    const [dateRange, setDateRange] = useState('all');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [lightboxPhoto, setLightboxPhoto] = useState(null);

    // Multi-Select State
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkStatus, setBulkStatus] = useState('');

    // Selection Mode State (Photos)
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set());

    const refreshOrders = () => {
        setOrders(getOrders());
    };

    useEffect(() => {
        refreshOrders();
        window.addEventListener('storage', refreshOrders);
        return () => window.removeEventListener('storage', refreshOrders);
    }, []);

    // Helper: Normalize phone for calling logic
    const normalizePhone = (s) => (s || '').replace(/[^\d]/g, '');

    // Computed: Filters & Sorting
    const filteredOrders = useMemo(() => {
        let result = [...orders];

        // 1. Status Filter
        if (activeTab !== 'all') {
            result = result.filter(o => (o.status || '').toLowerCase() === activeTab.toLowerCase());
        }

        // 2. Date Filter
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        result = result.filter(order => {
            const orderDate = new Date(order.createdAt);
            if (dateRange === 'all') return true;
            if (dateRange === 'today') return orderDate >= startOfToday;
            if (dateRange === '7d') return orderDate >= new Date(now - 7 * 86400000);
            if (dateRange === '30d') return orderDate >= new Date(now - 30 * 86400000);
            if (dateRange === 'custom') {
                const s = customDates.start ? new Date(customDates.start) : null;
                const e = customDates.end ? new Date(customDates.end) : null;
                if (s && orderDate < s) return false;
                if (e) {
                    const endLimit = new Date(e);
                    endLimit.setHours(23, 59, 59, 999);
                    if (orderDate > endLimit) return false;
                }
                return true;
            }
            return true;
        });

        // 3. Search Filter (Partial Matching)
        const q = searchQuery.trim().toLowerCase();
        if (q !== '') {
            result = result.filter(order => {
                const idValue = (order.id || '').toLowerCase();
                const nameValue = (order.shipping?.name || '').toLowerCase();
                const emailValue = (order.shipping?.email || '').toLowerCase();
                const phoneValue = normalizePhone(order.shipping?.phone || '');
                const qPhone = normalizePhone(q);

                switch (searchField) {
                    case 'id': return idValue.includes(q);
                    case 'email': return emailValue.includes(q);
                    case 'phone': return phoneValue.includes(qPhone);
                    case 'name':
                    default: return nameValue.includes(q);
                }
            });
        }

        // 4. Sorting
        result.sort((a, b) => {
            if (sortOption === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortOption === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            return 0;
        });

        return result;
    }, [orders, activeTab, searchQuery, searchField, sortOption, dateRange, customDates]);

    // Grouping for Daily Summary
    const groupedOrders = useMemo(() => {
        const groups = {};
        filteredOrders.forEach(order => {
            const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
            if (!groups[dateStr]) groups[dateStr] = { date: dateStr, orders: [], tileCount: 0 };
            groups[dateStr].orders.push(order);
            const qty = order.qty ?? (Array.isArray(order.items) ? order.items.length : 0);
            groups[dateStr].tileCount += qty;
        });
        return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
    }, [filteredOrders]);

    const summary = useMemo(() => {
        const totalTiles = filteredOrders.reduce((sum, o) => {
            const qty = o.qty ?? (Array.isArray(o.items) ? o.items.length : 0);
            return sum + qty;
        }, 0);
        return {
            orderCount: filteredOrders.length,
            tileCount: totalTiles
        };
    }, [filteredOrders]);

    const selectedOrder = useMemo(() =>
        orders.find(o => o.id === selectedOrderId),
        [orders, selectedOrderId]);

    const shipping = selectedOrder?.shipping || {};
    const items = Array.isArray(selectedOrder?.items) ? selectedOrder.items : [];

    // Ensure selectedOrderId stays valid and auto-select if needed
    useEffect(() => {
        if (filteredOrders.length > 0) {
            if (selectedOrderId && !filteredOrders.some(o => o.id === selectedOrderId)) {
                // Current selected order is filtered out, select first visible
                setSelectedOrderId(filteredOrders[0].id);
            } else if (!selectedOrderId) {
                // Auto-select first visible if none selected
                setSelectedOrderId(filteredOrders[0].id);
            }
        } else {
            setSelectedOrderId(null);
        }
    }, [filteredOrders, selectedOrderId]);

    // Clear selectedIds that are no longer visible (Optional but keeps it clean)
    useEffect(() => {
        const visibleIds = new Set(filteredOrders.map(o => o.id));
        setSelectedIds(prev => prev.filter(id => visibleIds.has(id)));
    }, [filteredOrders]);

    // Reset selection when changing order
    useEffect(() => {
        setIsSelectMode(false);
        setSelectedPhotoIds(new Set());
    }, [selectedOrderId]);

    // Handlers
    const handleStatusChange = (orderId, newStatus) => {
        if (newStatus === 'all') return;
        updateOrderStatus(orderId, newStatus);
        refreshOrders();
    };

    const handleBulkStatusApply = () => {
        if (!bulkStatus || selectedIds.length === 0) return;
        if (window.confirm(`Change status of ${selectedIds.length} orders to ${bulkStatus.toUpperCase()}?`)) {
            selectedIds.forEach(id => updateOrderStatus(id, bulkStatus));
            refreshOrders();
            setSelectedIds([]);
            setBulkStatus('');
        }
    };

    const toggleOrderSelection = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAllVisible = (checked) => {
        if (checked) {
            setSelectedIds(filteredOrders.map(o => o.id));
        } else {
            setSelectedIds([]);
        }
    };

    const togglePhotoSelection = (photoId) => {
        setSelectedPhotoIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(photoId)) {
                newSet.delete(photoId);
            } else {
                newSet.add(photoId);
            }
            return newSet;
        });
    };

    const handlePhotoClick = (photo) => {
        if (isSelectMode) {
            togglePhotoSelection(photo.id);
        } else {
            setLightboxPhoto(photo);
        }
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <AppLayout showFooter={false}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                backgroundColor: '#F9FAFB',
                fontFamily: 'Inter, system-ui, sans-serif'
            }}>
                {/* Global Hide Scrollbar Style */}
                <style>
                    {`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}
                </style>

                {/* Header */}
                <header style={{
                    height: '64px',
                    backgroundColor: 'white',
                    borderBottom: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 2rem',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ backgroundColor: '#111827', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontWeight: 'bold' }}>M</span>
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Admin Dashboard</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </header>

                {/* --- MAIN LAYOUT --- */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* --- LEFT PANEL: ORDER LIST --- */}
                    <div style={{
                        width: '420px',
                        borderRight: '1px solid #E5E7EB',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'white',
                        flexShrink: 0
                    }}>
                        {/* Tabs (Horizontal Scroll) */}
                        <div
                            className="no-scrollbar"
                            style={{
                                display: 'flex',
                                padding: '1rem',
                                gap: '0.5rem',
                                borderBottom: '1px solid #E5E7EB',
                                overflowX: 'auto',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        textAlign: 'center',
                                        backgroundColor: activeTab === tab.id ? '#111827' : 'transparent',
                                        color: activeTab === tab.id ? 'white' : '#6B7280',
                                        transition: 'all 0.2s',
                                        border: 'none',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Compact Summary & Date Filters */}
                        <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                            {/* Inline Summary */}
                            <div style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: '600', marginBottom: '1rem', padding: '0 0.5rem' }}>
                                Orders: <span style={{ color: '#111827' }}>{summary.orderCount}</span> · Tiles: <span style={{ color: '#111827' }}>{summary.tileCount}</span>
                            </div>

                            {/* Date Presets */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {DATE_PRESETS.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => setDateRange(preset.id)}
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '4px',
                                            border: '1px solid',
                                            borderColor: dateRange === preset.id ? '#111827' : '#E5E7EB',
                                            backgroundColor: dateRange === preset.id ? '#111827' : 'white',
                                            color: dateRange === preset.id ? 'white' : '#6B7280',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Date Inputs */}
                            {dateRange === 'custom' && (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="date"
                                        value={customDates.start}
                                        onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem', borderRadius: '4px', border: '1px solid #E5E7EB' }}
                                    />
                                    <span style={{ color: '#9CA3AF' }}>-</span>
                                    <input
                                        type="date"
                                        value={customDates.end}
                                        onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem', borderRadius: '4px', border: '1px solid #E5E7EB' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Search & Sort Controls */}
                        <div style={{ padding: '1rem', borderBottom: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        type="text"
                                        placeholder={`Search ${SEARCH_FIELDS.find(f => f.id === searchField)?.label}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            paddingLeft: '2.25rem',
                                            paddingRight: '2rem',
                                            paddingTop: '0.625rem',
                                            paddingBottom: '0.625rem',
                                            borderRadius: '8px',
                                            border: '1px solid #E5E7EB',
                                            fontSize: '0.875rem',
                                            outline: 'none'
                                        }}
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select
                                    value={searchField}
                                    onChange={(e) => setSearchField(e.target.value)}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.875rem', backgroundColor: 'white', cursor: 'pointer' }}
                                >
                                    {SEARCH_FIELDS.map(f => <option key={f.id} value={f.id}>Search {f.label}</option>)}
                                </select>
                                <select
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.875rem', backgroundColor: 'white', cursor: 'pointer' }}
                                >
                                    {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Bulk Action Bar */}
                        {selectedIds.length > 0 && (
                            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#EFF6FF', borderBottom: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1E40AF', whiteSpace: 'nowrap' }}>
                                    {selectedIds.length} Selected
                                </span>
                                <select
                                    value={bulkStatus}
                                    onChange={(e) => setBulkStatus(e.target.value)}
                                    style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', border: '1px solid #BFDBFE', fontSize: '0.875rem' }}
                                >
                                    <option value="">Change Status...</option>
                                    {TABS.filter(t => t.id !== 'all').map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                                <button
                                    onClick={handleBulkStatusApply}
                                    disabled={!bulkStatus}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '6px',
                                        backgroundColor: bulkStatus ? '#2563EB' : '#93C5FD',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        border: 'none',
                                        cursor: bulkStatus ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #BFDBFE', backgroundColor: 'white', color: '#1E40AF', fontSize: '0.875rem' }}
                                >
                                    Clear
                                </button>
                            </div>
                        )}

                        {/* List */}
                        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB' }}>
                            {groupedOrders.length === 0 ? (
                                <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#6B7280', backgroundColor: 'white', height: '100%' }}>
                                    <p style={{ marginBottom: '1rem' }}>No orders match your criteria.</p>
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setActiveTab('all');
                                            setDateRange('all');
                                        }}
                                        style={{ color: '#2563EB', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Select All visible Header */}
                                    <div style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'white' }}>
                                        <input
                                            type="checkbox"
                                            checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                                            onChange={(e) => handleSelectAllVisible(e.target.checked)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: '500' }}>Select All Visible</span>
                                    </div>

                                    {groupedOrders.map(group => (
                                        <div key={group.date}>
                                            <div style={{
                                                padding: '0.75rem 1.25rem',
                                                backgroundColor: '#F3F4F6',
                                                borderBottom: '1px solid #E5E7EB',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 5
                                            }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4B5563' }}>
                                                    {new Date(group.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                                                    {group.orders.length} orders · {group.tileCount} tiles
                                                </span>
                                            </div>

                                            {group.orders.map(order => {
                                                const isSelected = selectedIds.includes(order.id);
                                                return (
                                                    <div
                                                        key={order.id}
                                                        onClick={() => setSelectedOrderId(order.id)}
                                                        style={{
                                                            padding: '1rem 1.25rem',
                                                            borderBottom: '1px solid #F3F4F6',
                                                            cursor: 'pointer',
                                                            backgroundColor: selectedOrderId === order.id ? '#F0F9FF' : 'white',
                                                            borderLeft: selectedOrderId === order.id ? '4px solid #0284C7' : '4px solid transparent',
                                                            display: 'flex',
                                                            gap: '1rem',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                    >
                                                        <div onClick={(e) => e.stopPropagation()} style={{ paddingTop: '0.125rem' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleOrderSelection(order.id)}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                                                <span style={{ fontWeight: '600', color: '#111827', fontSize: '0.925rem' }}>{order.id}</span>
                                                                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <div style={{ fontWeight: '500', color: '#374151', marginBottom: '0.25rem', fontSize: '0.875rem' }}>{order.shipping?.name || 'Unknown User'}</div>
                                                            <div style={{ fontSize: '0.825rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                                                                {order.qty ?? (Array.isArray(order.items) ? order.items.length : 0)} tiles · ฿{(order.total || 0).toLocaleString()}
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    style={{ position: 'relative' }}
                                                                >
                                                                    <select
                                                                        value={order.status}
                                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                                        style={{
                                                                            appearance: 'none',
                                                                            backgroundColor: STATUS_COLORS[(order.status || '').toLowerCase()]?.bg || '#F3F4F6',
                                                                            color: STATUS_COLORS[(order.status || '').toLowerCase()]?.text || '#6B7280',
                                                                            border: 'none',
                                                                            borderRadius: '4px',
                                                                            padding: '0.2rem 1.25rem 0.2rem 0.5rem',
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: '700',
                                                                            textTransform: 'uppercase',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        {TABS.filter(t => t.id !== 'all').map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                                                    </select>
                                                                    <ChevronDown size={10} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: STATUS_COLORS[(order.status || '').toLowerCase()]?.text || '#6B7280' }} />
                                                                </div>
                                                                <span style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: '500' }}>Details →</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    {/* --- RIGHT PANEL: DETAILS --- */}
                    <div style={{ flex: 1, backgroundColor: '#F9FAFB', overflowY: 'auto' }}>
                        {selectedOrder ? (
                            <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>

                                {/* Actions Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <div>
                                        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>{selectedOrder.id}</h1>
                                        <p style={{ color: '#6B7280' }}>Created on {formatDate(selectedOrder.createdAt)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={selectedOrder.status}
                                                onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                                                style={{
                                                    appearance: 'none',
                                                    padding: '0.75rem 2.5rem 0.75rem 1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid #D1D5DB',
                                                    backgroundColor: 'white',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    minWidth: '160px'
                                                }}
                                            >
                                                {TABS.filter(t => t.id !== 'all').map(t => <option key={t.id} value={t.id}>Move to {t.label}</option>)}
                                            </select>
                                            <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
                                        </div>
                                        <button style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: 'white' }}>
                                            <MoreHorizontal size={20} color="#374151" />
                                        </button>
                                    </div>
                                </div>

                                {/* Customer & Summary Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                    {/* Customer Info */}
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            Customer Details
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Contact</p>
                                                <p style={{ fontWeight: '500', color: '#111827' }}>{shipping?.name || 'N/A'}</p>
                                                <p style={{ color: '#4B5563', fontSize: '0.875rem' }}>{shipping?.phone || 'N/A'}</p>
                                                {shipping?.email && <p style={{ color: '#4B5563', fontSize: '0.875rem' }}>{shipping.email}</p>}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>Shipping Address</p>
                                                <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.5' }}>
                                                    {shipping?.address || 'N/A'}<br />
                                                    {shipping?.city || ''} {shipping?.postalCode || ''}<br />
                                                    {shipping?.country || ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Order Summary</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#6B7280' }}>Standard Tiles x {items.length}</span>
                                        <span style={{ fontWeight: '500' }}>฿{(selectedOrder.total || 0).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ color: '#6B7280' }}>Shipping</span>
                                        <span style={{ fontWeight: '500' }}>Free</span>
                                    </div>
                                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 'bold' }}>
                                        <span>Total</span>
                                        <span>฿{(selectedOrder.total || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* --- PHOTOS SECTION --- */}
                                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Photos</h3>
                                            <span style={{ backgroundColor: '#F3F4F6', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', color: '#4B5563' }}>
                                                {items.length} files
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button
                                                onClick={() => {
                                                    setIsSelectMode(!isSelectMode);
                                                    if (isSelectMode) setSelectedPhotoIds(new Set()); // Clear on cancel
                                                }}
                                                className="btn-secondary"
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    fontSize: '0.875rem',
                                                    backgroundColor: isSelectMode ? '#FEF2F2' : 'white',
                                                    color: isSelectMode ? '#DC2626' : 'inherit',
                                                    borderColor: isSelectMode ? '#FECACA' : '#E5E7EB',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {isSelectMode ? 'Cancel Selection' : 'Select'}
                                            </button>
                                            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', gap: '0.5rem' }}>
                                                <Download size={16} />
                                                {selectedPhotoIds.size > 0 ? `Download Selected (${selectedPhotoIds.size})` : 'Download All'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Grid */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                        gap: '1rem'
                                    }}>
                                        {items.map((photo, idx) => {
                                            const photoId = photo.id || `photo-${idx}`;
                                            const isSelected = selectedPhotoIds.has(photoId);
                                            return (
                                                <div
                                                    key={photoId}
                                                    onClick={() => handlePhotoClick({ ...photo, id: photoId })}
                                                    style={{
                                                        aspectRatio: '1/1',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        position: 'relative',
                                                        cursor: 'pointer',
                                                        border: isSelected ? '3px solid #3B82F6' : '1px solid #E5E7EB',
                                                        backgroundColor: '#F9FAFB',
                                                        transition: 'all 0.1s'
                                                    }}
                                                    className="group"
                                                >
                                                    {photo.url ? (
                                                        <img
                                                            src={photo.url}
                                                            alt={photo.filename || 'Photo'}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                opacity: (isSelectMode && !isSelected) ? 0.6 : 1
                                                            }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }}>
                                                            <ImageIcon size={32} color="#D1D5DB" />
                                                        </div>
                                                    )}
                                                    {/* Filename Overlay */}
                                                    <div style={{
                                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                                        color: 'white',
                                                        fontSize: '0.65rem',
                                                        padding: '0.25rem 0.5rem',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {photo.filename || `Item ${idx + 1}`}
                                                    </div>

                                                    {/* Selection Indicator */}
                                                    {isSelectMode && (
                                                        <div style={{
                                                            position: 'absolute', top: 8, right: 8,
                                                            width: '20px', height: '20px',
                                                            backgroundColor: isSelected ? '#3B82F6' : 'rgba(255,255,255,0.8)',
                                                            borderRadius: '50%',
                                                            border: isSelected ? 'none' : '2px solid white',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }}>
                                                            {isSelected && <Check size={14} color="white" />}
                                                        </div>
                                                    )}

                                                    {/* Ready Indicator (Only in normal mode) */}
                                                    {!isSelectMode && (
                                                        <div style={{
                                                            position: 'absolute', top: 4, right: 4,
                                                            backgroundColor: 'white', borderRadius: '50%', padding: '2px',
                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                                        }}>
                                                            <Check size={12} color="black" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ImageIcon size={40} color="#D1D5DB" />
                                </div>
                                <p>Select an order to view details</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- LIGHTBOX --- */}
                {
                    lightboxPhoto && (
                        <div style={{
                            position: 'fixed', inset: 0, zIndex: 100,
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '2rem'
                        }} onClick={() => setLightboxPhoto(null)}>

                            <button
                                onClick={() => setLightboxPhoto(null)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                            >
                                <X size={32} />
                            </button>

                            <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }} onClick={e => e.stopPropagation()}>
                                <img
                                    src={lightboxPhoto.url}
                                    alt={lightboxPhoto.filename}
                                    style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: '4px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                />
                                <div style={{
                                    marginTop: '1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    color: 'white'
                                }}>
                                    <div>
                                        <p style={{ fontWeight: '600' }}>{lightboxPhoto.filename}</p>
                                        <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Original Quality</p>
                                    </div>
                                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Download size={16} />
                                        Download Original
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </AppLayout>
    );
}
