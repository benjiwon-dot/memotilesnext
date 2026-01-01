import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * AppLayout - Wrapper for Editor, Checkout, Orders, Admin.
 * Full-width or wider containers, supports application-specific density.
 */
export default function AppLayout({ children, showFooter = true }) {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
            <Navbar variant="app" />
            <main style={{ flex: 1, paddingTop: '1rem' }}>
                {children}
            </main>
            {showFooter && <Footer minimal />}
        </div>
    );
}
