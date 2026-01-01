import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Upload, Plus, ZoomIn, ZoomOut, Check, ArrowRight, Image as ImageIcon, ChevronLeft, RefreshCcw, AlertCircle, Loader2, X, Settings, Info } from 'lucide-react';
import { getOrders, canEdit, updateOrderItems } from '../utils/orders';
import AppLayout from '../components/AppLayout';

export default function Editor() {
    const { t, language } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    // Parse editOrderId from URL
    const searchParams = new URLSearchParams(location.search);
    const editOrderId = searchParams.get('editOrderId');
    const hasDevParam = searchParams.get('dev') === '1';

    // --- STATE MANAGEMENT ---
    const [uploads, setUploads] = useState([]);
    const [selectedUploadId, setSelectedUploadId] = useState(null);
    const [isDevAvailable, setIsDevAvailable] = useState(hasDevParam);
    const [isLabOpen, setIsLabOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [navTimerExceeded, setNavTimerExceeded] = useState(false);
    const [showGuidance, setShowGuidance] = useState(null); // { title, subtitle }
    const [shouldNudgeSave, setShouldNudgeSave] = useState(false);

    // Per-photo settings and status
    const [crops, setCrops] = useState({}); // { [id]: { zoom, dragPos, filter } }
    const [saveStatuses, setSaveStatuses] = useState({}); // { [id]: "idle" | "saving" | "saved" | "error" }

    // State Lab granular control (for dev overlay)
    const [labState, setLabState] = useState({
        photoSlot: 'has-photo',
        uploadState: 'idle',
        loadState: 'loaded',
        interactionState: 'ready',
        checkoutState: 'ready',
        validationError: 'off'
    });

    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    const FILTERS = useMemo(() => [
        { name: 'Original', style: 'none' },
        { name: 'Warm', style: 'sepia(30%) saturate(140%)' },
        { name: 'Cool', style: 'saturate(0.5) hue-rotate(30deg)' },
        { name: 'Vivid', style: 'saturate(200%)' },
        { name: 'B&W', style: 'grayscale(100%)' },
        { name: 'Soft', style: 'brightness(110%) contrast(90%)' },
        { name: 'Contrast', style: 'contrast(150%)' },
        { name: 'Fade', style: 'opacity(0.8) contrast(90%)' },
        { name: 'Film', style: 'sepia(20%) contrast(110%) brightness(105%) saturate(80%)' },
        { name: 'Bright', style: 'brightness(125%) saturate(110%)' },
    ], []);

    // --- INITIALIZATION ---
    useEffect(() => {
        if (editOrderId) {
            const orders = getOrders();
            const order = orders.find(o => o.id === editOrderId);
            if (!order || !canEdit(order)) {
                navigate('/my-orders');
                return;
            }
            const initialCrops = {};
            const initialStatuses = {};
            const loadedUploads = order.items.map(item => {
                initialCrops[item.id] = {
                    zoom: item.zoom || 1.2,
                    dragPos: item.dragPos || { x: 0, y: 0 },
                    filter: item.filter || 'Original'
                };
                initialStatuses[item.id] = 'saved';
                return { ...item, status: 'cropped', isCropped: true };
            });
            setUploads(loadedUploads);
            setCrops(initialCrops);
            setSaveStatuses(initialStatuses);
            if (loadedUploads.length > 0) setSelectedUploadId(loadedUploads[0].id);
        } else {
            // Start with empty uploads - user will add photos manually
            setUploads([]);
            setCrops({});
        }
    }, [editOrderId, navigate]);

    // Keyboard trigger for Dev Mode
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key.toLowerCase() === 'd' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                setIsDevAvailable(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle photo selection
    const currentCrop = useMemo(() => crops[selectedUploadId] || { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: 'Original' }, [crops, selectedUploadId]);
    const currentSaveStatus = saveStatuses[selectedUploadId] || 'idle';

    const updateCurrentCrop = (updates) => {
        if (!selectedUploadId) return;
        setCrops(prev => ({
            ...prev,
            [selectedUploadId]: { ...(prev[selectedUploadId] || {}), ...updates }
        }));
        if (currentSaveStatus === 'saved') {
            setSaveStatuses(prev => ({ ...prev, [selectedUploadId]: 'idle' }));
        }
    };

    // --- HANDLERS ---
    const handleUpload = () => {
        if (uploads.length >= 20) return;
        const newId = `u-${Date.now()}`;
        const newUpload = { id: newId, status: 'needs-crop', isCropped: false };
        setUploads(prev => [...prev, newUpload]);
        setCrops(prev => ({ ...prev, [newId]: { zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: 'Original' } }));
        setSelectedUploadId(newId);
    };

    const [showAllSavedToast, setShowAllSavedToast] = useState(false);

    const handleSaveCrop = () => {
        if (interactionsDisabled || currentSaveStatus === 'saving') return;

        // Immediate Interaction Reset
        setIsDragging(false);
        setSaveStatuses(prev => ({ ...prev, [selectedUploadId]: 'saving' }));

        setTimeout(() => {
            // Batch marks and metadata updates
            setUploads(prev => prev.map(u => u.id === selectedUploadId ? { ...u, isCropped: true } : u));
            setSaveStatuses(prev => {
                const newStatuses = { ...prev, [selectedUploadId]: 'saved' };

                // Advanced Selection logic
                setTimeout(() => {
                    const nextUnsaved = uploads.find(u => u.id !== selectedUploadId && !newStatuses[u.id]?.startsWith('saved'));
                    if (nextUnsaved) {
                        setSelectedUploadId(nextUnsaved.id);
                    } else {
                        const allSaved = uploads.every(u => u.id === selectedUploadId || newStatuses[u.id]?.startsWith('saved'));
                        if (allSaved) {
                            setShowAllSavedToast(true);
                            setTimeout(() => setShowAllSavedToast(false), 3000);
                        }
                    }
                }, 1000);

                return newStatuses;
            });
        }, 500); // Reduced delay for faster perceived speed
    };

    const savedCount = useMemo(() => uploads.filter(u => saveStatuses[u.id] === 'saved').length, [uploads, saveStatuses]);

    const handleContinueToCheckout = () => {
        if (isNavigating) return;

        // Validation Gate
        if (uploads.length === 0) {
            setShowGuidance({ title: 'Upload a photo to continue', subtitle: 'You need at least 1 tile for an order.' });
            setTimeout(() => setShowGuidance(null), 3000);
            return;
        }

        if (isLoadingImage) {
            setShowGuidance({ title: 'Loading photo...', subtitle: 'Please wait until your photo is ready.' });
            setTimeout(() => setShowGuidance(null), 3000);
            return;
        }

        if (savedCount === 0) {
            setShowGuidance({ title: 'Save at least 1 crop', subtitle: "Tap 'Save This Crop' to continue." });
            setShouldNudgeSave(true);
            setTimeout(() => {
                setShowGuidance(null);
                setShouldNudgeSave(false);
            }, 3000);
            return;
        }

        if (checkoutDisabled) return;

        setIsNavigating(true);
        const navTimer = setTimeout(() => setNavTimerExceeded(true), 600);

        setTimeout(() => {
            clearTimeout(navTimer);
            // Only include saved crops in the order
            const orderItems = uploads
                .filter(u => saveStatuses[u.id] === 'saved')
                .map(u => ({
                    ...u,
                    ...crops[u.id]
                }));
            navigate('/checkout', { state: { orderItems } });
        }, 300);
    };

    const handleRemove = (id) => {
        if (uploads.length <= 1) return;
        const newUploads = uploads.filter(u => u.id !== id);
        setUploads(newUploads);
        if (selectedUploadId === id) {
            setSelectedUploadId(newUploads[0].id);
        }
    };

    const handleReset = () => {
        updateCurrentCrop({ zoom: 1.2, dragPos: { x: 0, y: 0 }, filter: 'Original' });
    };

    // --- POINTER DRAG LOGIC ---
    const startDragging = (e) => {
        if (interactionsDisabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - currentCrop.dragPos.x, y: e.clientY - currentCrop.dragPos.y };
    };

    const onDragging = (e) => {
        if (!isDragging || interactionsDisabled) return;
        updateCurrentCrop({
            dragPos: {
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
            }
        });
    };

    const stopDragging = (e) => {
        if (!isDragging) return;
        setIsDragging(false);
        if (e.pointerId) e.currentTarget.releasePointerCapture(e.pointerId);
    };

    // --- DERIVED STATES & LOCKS ---
    const isValidationError = labState.validationError === 'on';
    const hasNoPhoto = labState.photoSlot === 'no-photo' || uploads.length === 0;
    const hasPhoto = !hasNoPhoto;
    const isUploading = labState.uploadState === 'uploading';
    const isLoadingImage = labState.loadState === 'loading' && !hasNoPhoto;
    const isLoadError = labState.loadState === 'error' && !hasNoPhoto;

    const interactionsDisabled = hasNoPhoto || isUploading || isLoadingImage || isLoadError || labState.interactionState === 'disabled';
    const checkoutDisabled = hasNoPhoto || isLoadingImage || labState.checkoutState === 'disabled' || isNavigating;
    const croppedCount = uploads.filter(u => u.isCropped).length;

    return (
        <AppLayout showFooter={false}>
            <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', paddingBottom: '120px' }}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                .editor-grid { display: grid; grid-template-columns: 1fr 340px; gap: 3rem; padding-top: 1rem; }
                @media (max-width: 1023px) { .editor-grid { grid-template-columns: 1fr; gap: 1.5rem; padding-top: 0; } }
                
                .cropper-frame { aspect-ratio: 1/1; width: 100%; max-width: 480px; margin: 0 auto; position: relative; overflow: hidden; background-color: #F3F4F6; border: 1px solid rgba(0,0,0,0.06); transition: all 0.2s; touch-action: none; }
                .cropper-frame.ready { cursor: grab; }
                .cropper-frame.ready:active { cursor: grabbing; border-color: var(--text-primary); }
                .cropper-frame.disabled { cursor: not-allowed; opacity: 0.8; }
                
                .album-strip { display: grid; grid-template-columns: repeat(10, 1fr); gap: 10px; margin-top: 2rem; }
                @media (max-width: 600px) { .album-strip { grid-template-columns: repeat(5, 1fr); } }

                .filter-chip { padding: 6px 16px; border-radius: 999px; font-size: 13px; font-weight: 600; border: 1px solid var(--border); background: white; color: var(--text-secondary); cursor: pointer; white-space: nowrap; transition: all 0.2s; }
                .filter-chip.active { background: var(--text-primary); color: white; border-color: var(--text-primary); }

                .skeleton { background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; }
                @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

                .nudge-pulse { animation: nudge-pulse 0.8s ease-in-out; }
                @keyframes nudge-pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(17, 24, 39, 0.4); }
                    50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(17, 24, 39, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(17, 24, 39, 0); }
                }

                .guidance-toast {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%) translateY(-12px);
                    background: white;
                    border: 1px solid var(--border);
                    padding: 1rem;
                    border-radius: 1rem;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
                    min-width: 240px;
                    z-index: 50;
                    animation: slide-up 0.3s ease-out;
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateX(-50%) translateY(0); }
                    to { opacity: 1; transform: translateX(-50%) translateY(-12px); }
                }
            ` }} />

                <div className="container" style={{ padding: '1rem 0', display: 'flex', justifyContent: 'flex-end' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-tertiary)', fontSize: '0.8125rem', fontWeight: '600' }}>
                        <ChevronLeft size={16} /> {t('backToHome') || 'Back'}
                    </Link>
                </div>

                <div className="container editor-grid">
                    <div>
                        {isValidationError && (
                            <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', color: '#991B1B', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={14} /> Unsupported file type or file too large.
                            </div>
                        )}

                        <div
                            className={`cropper-frame ${interactionsDisabled ? 'disabled' : 'ready'}`}
                            onPointerDown={startDragging}
                            onPointerMove={onDragging}
                            onPointerUp={stopDragging}
                            onPointerCancel={stopDragging}
                            onPointerLeave={stopDragging}
                        >
                            {hasNoPhoto ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-tertiary)' }}>
                                    <ImageIcon size={40} strokeWidth={1.5} />
                                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Upload a photo</span>
                                </div>
                            ) : isLoadingImage ? (
                                <div className="skeleton" style={{ width: '100%', height: '100%' }}></div>
                            ) : isLoadError ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#F9FAFB' }}>
                                    <AlertCircle size={32} color="#EF4444" />
                                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827' }}>Error loading image</span>
                                    <button onClick={() => setLabState(ps => ({ ...ps, loadState: 'loaded' }))} style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textDecoration: 'underline' }}>Retry</button>
                                </div>
                            ) : (
                                <div style={{
                                    width: '100%', height: '100%',
                                    transform: `translate(${currentCrop.dragPos.x}px, ${currentCrop.dragPos.y}px) scale(${currentCrop.zoom})`,
                                    filter: (FILTERS.find(f => f.name === currentCrop.filter)?.style || 'none'),
                                    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <div style={{ width: '100%', height: '100%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ImageIcon size={48} color="#D1D5DB" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ maxWidth: '480px', margin: '2rem auto 0', opacity: interactionsDisabled ? 0.3 : 1, pointerEvents: interactionsDisabled ? 'none' : 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <ZoomOut size={22} strokeWidth={1.5} />
                                <div style={{ flex: 1 }}>
                                    <input type="range" min="1" max="3" step="0.01" value={currentCrop.zoom} onChange={(e) => updateCurrentCrop({ zoom: parseFloat(e.target.value) })} style={{ width: '100%', accentColor: 'var(--text-primary)', height: '2px', background: '#E5E7EB' }} />
                                </div>
                                <ZoomIn size={22} strokeWidth={1.5} />
                                <button onClick={handleReset} style={{ marginLeft: '0.5rem', color: 'var(--text-tertiary)' }}><RefreshCcw size={14} /></button>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px' }}>
                                {FILTERS.map(f => (
                                    <button key={f.name} className={`filter-chip ${currentCrop.filter === f.name ? 'active' : ''}`} onClick={() => updateCurrentCrop({ filter: f.name })}>
                                        {f.name}
                                    </button>
                                ))}
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                <button
                                    onClick={handleSaveCrop}
                                    className={`btn btn-primary ${shouldNudgeSave ? 'nudge-pulse' : ''}`}
                                    disabled={interactionsDisabled || currentSaveStatus === 'saving' || currentSaveStatus === 'saved'}
                                    style={{ padding: '0.875rem 2.5rem', borderRadius: '999px', fontSize: '0.9375rem', fontWeight: '700', minWidth: '180px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    {currentSaveStatus === 'saving' ? (
                                        <><Loader2 size={18} className="animate-spin" /> Saving...</>
                                    ) : currentSaveStatus === 'saved' ? (
                                        <><Check size={18} color="#10B981" strokeWidth={3} /> <span style={{ color: '#10B981' }}>Saved</span></>
                                    ) : 'Save This Crop'}
                                </button>
                            </div>
                        </div>

                        <div className="album-strip">
                            {uploads.map(u => (
                                <div key={u.id} style={{ position: 'relative' }}>
                                    <div
                                        onClick={() => setSelectedUploadId(u.id)}
                                        style={{
                                            aspectRatio: '1/1', borderRadius: '0.5rem', backgroundColor: '#E5E7EB', cursor: 'pointer',
                                            border: selectedUploadId === u.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                        }}
                                    >
                                        <ImageIcon size={20} color="#9CA3AF" />
                                    </div>
                                    {saveStatuses[u.id] === 'saved' && (
                                        <div style={{ position: 'absolute', top: 4, right: 4, background: 'white', border: '1px solid #10B981', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10 }}>
                                            <Check size={10} color="#10B981" strokeWidth={4} />
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button onClick={handleUpload} style={{ aspectRatio: '1/1', borderRadius: '0.5rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}><Plus size={20} /></button>
                        </div>
                    </div>

                    <div>
                        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)', position: 'sticky', top: '100px' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: '800', marginBottom: '1.5rem' }}>Order Summary</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Quantity</span>
                                    <span style={{ fontWeight: '700' }}>{uploads.length} tiles</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800' }}>
                                    <span>Price</span>
                                    <span>฿{uploads.length * 200}</span>
                                </div>
                            </div>
                            <div style={{ position: 'relative' }}>
                                {showGuidance && (
                                    <div className="guidance-toast">
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Info size={16} className="text-secondary" />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px' }}>{showGuidance.title}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{showGuidance.subtitle}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <button onClick={handleContinueToCheckout} className="btn btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '999px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {isNavigating ? <><Loader2 size={18} className="animate-spin" /> Loading...</> : 'Continue to checkout'}
                                </button>
                            </div>
                            {navTimerExceeded && <p style={{ marginTop: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--text-tertiary)' }}>Preparing checkout...</p>}
                        </div>
                    </div>
                </div>

                {isDevAvailable && (
                    <div className="dev-badge" onClick={() => setIsLabOpen(true)}>
                        <Settings size={14} /> ⚙︎ Dev Only
                    </div>
                )}

                {isLabOpen && (
                    <div className="lab-overlay" onClick={() => setIsLabOpen(false)}>
                        <div className="lab-modal" onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '14px', fontWeight: '900' }}>DEV ONLY: STATE LAB</h2>
                                <X size={20} onClick={() => setIsLabOpen(false)} style={{ cursor: 'pointer' }} />
                            </div>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {[
                                    { label: 'Photo Slot', key: 'photoSlot', options: ['has-photo', 'no-photo'] },
                                    { label: 'Upload State', key: 'uploadState', options: ['idle', 'uploading', 'error'] },
                                    { label: 'Image Load', key: 'loadState', options: ['loaded', 'loading', 'error'] },
                                    { label: 'Validation', key: 'validationError', options: ['off', 'on'] },
                                    { label: 'Checkout', key: 'checkoutState', options: ['ready', 'disabled'] }
                                ].map(row => (
                                    <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '600' }}>{row.label}</span>
                                        <select style={{ fontSize: '12px' }} value={labState[row.key]} onChange={e => setLabState(ps => ({ ...ps, [row.key]: e.target.value }))}>
                                            {row.options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                    {showAllSavedToast && (
                        <div style={{ padding: '0.625rem 1.25rem', backgroundColor: '#111827', color: 'white', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: '600', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
                            <Check size={14} color="#10B981" /> All photos saved
                        </div>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
