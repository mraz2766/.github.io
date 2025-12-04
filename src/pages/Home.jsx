import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Utility to shuffle array
const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const Home = () => {
    const [photos, setPhotos] = useState([]);
    const [displayPhotos, setDisplayPhotos] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [filter, setFilter] = useState('All');
    // Theme state: 'light' or 'dark'
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    // Toggle Theme
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // Load Data
    useEffect(() => {
        fetch('/src/photos.json')
            .then(res => res.json())
            .then(data => {
                setPhotos(data);
                setDisplayPhotos(shuffleArray(data));
            })
            .catch(err => console.error("Failed to load photos:", err));

        // Inject Fonts
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        return () => document.head.removeChild(link);
    }, []);

    // Apply Theme Variables
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.style.setProperty('--bg-color', '#000000');
            root.style.setProperty('--text-primary', '#f5f5f7');
            root.style.setProperty('--text-secondary', '#86868b');
            root.style.setProperty('--btn-bg', 'rgba(255,255,255,0.1)');
            root.style.setProperty('--btn-bg-active', '#fff');
            root.style.setProperty('--btn-text-active', '#000');
            root.style.setProperty('--lightbox-bg', 'rgba(0,0,0,0.92)');
            root.style.setProperty('--glass-bg', 'rgba(20,20,20,0.7)');
            root.style.setProperty('--glass-border', 'rgba(255,255,255,0.1)');
        } else {
            root.style.setProperty('--bg-color', '#ffffff');
            root.style.setProperty('--text-primary', '#1d1d1f');
            root.style.setProperty('--text-secondary', '#86868b');
            root.style.setProperty('--btn-bg', 'rgba(0,0,0,0.05)');
            root.style.setProperty('--btn-bg-active', '#1d1d1f');
            root.style.setProperty('--btn-text-active', '#fff');
            root.style.setProperty('--lightbox-bg', 'rgba(255,255,255,0.95)');
            root.style.setProperty('--glass-bg', 'rgba(255,255,255,0.8)');
            root.style.setProperty('--glass-border', 'rgba(0,0,0,0.05)');
        }
    }, [theme]);

    // Handle Filter
    useEffect(() => {
        if (photos.length === 0) return;
        let filtered = filter === 'All' ? photos : photos.filter(p => p.category === filter);
        setDisplayPhotos(shuffleArray(filtered));
    }, [filter, photos]);

    // Navigation Logic
    const handleNext = useCallback(() => {
        if (selectedId === null) return;
        const currentIndex = displayPhotos.findIndex(p => p.id === selectedId);
        const nextIndex = (currentIndex + 1) % displayPhotos.length;
        setSelectedId(displayPhotos[nextIndex].id);
    }, [selectedId, displayPhotos]);

    const handlePrev = useCallback(() => {
        if (selectedId === null) return;
        const currentIndex = displayPhotos.findIndex(p => p.id === selectedId);
        const prevIndex = (currentIndex - 1 + displayPhotos.length) % displayPhotos.length;
        setSelectedId(displayPhotos[prevIndex].id);
    }, [selectedId, displayPhotos]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (selectedId === null) return;
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') setSelectedId(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, handleNext, handlePrev]);

    const categories = ['All', ...new Set(photos.map(p => p.category))];
    const selectedPhoto = photos.find(p => p.id === selectedId);

    return (
        <div style={styles.container}>
            {/* Minimal Header */}
            <header style={styles.header}>
                {/* Left spacer for balance if needed, or Logo */}
                <div style={{ width: '40px' }}></div>

                {/* Centered Filter Pills */}
                <nav style={styles.nav}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            style={filter === cat ? styles.activeFilterButton : styles.filterButton}
                        >
                            {cat}
                        </button>
                    ))}
                </nav>

                {/* Right Theme Toggle */}
                <button onClick={toggleTheme} style={styles.themeBtn} aria-label="Toggle Theme">
                    {theme === 'light' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                    )}
                </button>
            </header>

            {/* Clean Grid */}
            <motion.div
                style={styles.grid}
                layout
            >
                <AnimatePresence mode='popLayout'>
                    {displayPhotos.map((photo, index) => (
                        <motion.div
                            key={photo.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            style={styles.item}
                            onClick={() => setSelectedId(photo.id)}
                            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                        >
                            <div style={styles.imageWrapper}>
                                <img
                                    src={photo.thumbnail || photo.src}
                                    alt={photo.title}
                                    style={styles.image}
                                    loading="lazy"
                                />
                                {/* Minimal Overlay - Only visible on hover */}
                                <div style={styles.overlay}></div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Glassmorphism Lightbox */}
            <AnimatePresence>
                {selectedId && selectedPhoto && (
                    <motion.div
                        style={styles.lightbox}
                        onClick={() => setSelectedId(null)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <motion.div
                            style={styles.lightboxContent}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ scale: 0.98, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.98, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <img
                                src={selectedPhoto.src}
                                alt={selectedPhoto.title}
                                style={styles.lightboxImage}
                            />

                            {/* Glass Metadata Panel */}
                            <div style={styles.metadata}>
                                <h2 style={styles.metadataTitle}>{selectedPhoto.title}</h2>
                                {selectedPhoto.exif && (
                                    <div style={styles.exifGrid}>
                                        <ExifItem label="Camera" value={selectedPhoto.exif.camera} />
                                        <ExifItem label="Lens" value={selectedPhoto.exif.lens} />
                                        <ExifItem label="ISO" value={selectedPhoto.exif.iso} />
                                        <ExifItem label="Aperture" value={selectedPhoto.exif.aperture} />
                                        <ExifItem label="Shutter" value={selectedPhoto.exif.shutter} />
                                    </div>
                                )}
                            </div>

                            {/* Navigation Arrows */}
                            <button style={{ ...styles.navBtn, left: '30px' }} onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            <button style={{ ...styles.navBtn, right: '30px' }} onClick={(e) => { e.stopPropagation(); handleNext(); }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
                            <button style={styles.closeBtn} onClick={() => setSelectedId(null)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Styles for CSS Variables & Scrollbar */}
            <style>{`
                body {
                    background-color: var(--bg-color);
                    color: var(--text-primary);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    transition: background-color 0.3s ease, color 0.3s ease;
                    margin: 0;
                }
                ::-webkit-scrollbar { width: 0px; background: transparent; }
                
                /* Responsive Columns */
                @media (max-width: 1200px) { .grid-container { column-count: 2 !important; } }
                @media (max-width: 600px) { .grid-container { column-count: 1 !important; } }
            `}</style>
        </div>
    );
};

const ExifItem = ({ label, value }) => {
    if (!value || value.toString().startsWith('Unknown')) return null;
    return (
        <div style={styles.exifItem}>
            <span style={styles.exifLabel}>{label}</span>
            <span style={styles.exifValue}>{value}</span>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1800px',
        margin: '0 auto',
        padding: '0 2rem 2rem 2rem',
        minHeight: '100vh',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2rem 0 3rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--bg-color)', // Opaque background for sticky header
        transition: 'background-color 0.3s ease',
    },
    nav: {
        display: 'flex',
        gap: '0.5rem',
        background: 'var(--btn-bg)',
        padding: '0.3rem',
        borderRadius: '999px',
        backdropFilter: 'blur(20px)',
    },
    filterButton: {
        background: 'transparent',
        border: 'none',
        borderRadius: '999px',
        padding: '0.5rem 1.2rem',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'all 0.2s ease',
    },
    activeFilterButton: {
        background: 'var(--btn-bg-active)',
        color: 'var(--btn-text-active)',
        borderRadius: '999px',
        padding: '0.5rem 1.2rem',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '0.9rem',
        fontWeight: '500',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    themeBtn: {
        background: 'var(--btn-bg)',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    grid: {
        columnCount: 3,
        columnGap: '2rem',
        className: 'grid-container', // Used for media queries in style tag
    },
    item: {
        breakInside: 'avoid',
        marginBottom: '2rem',
        cursor: 'pointer',
        borderRadius: '12px', // Apple-like smooth corners
        overflow: 'hidden',
    },
    imageWrapper: {
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--btn-bg)', // Placeholder color
    },
    image: {
        width: '100%',
        height: 'auto',
        display: 'block',
        transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.05)', // Subtle darkening on hover
        opacity: 0,
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
    },
    lightbox: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'var(--lightbox-bg)',
        backdropFilter: 'blur(20px)', // Strong blur for background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
    },
    lightboxContent: {
        position: 'relative',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    lightboxImage: {
        maxWidth: '100%',
        maxHeight: '70vh',
        objectFit: 'contain',
        borderRadius: '8px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    metadata: {
        marginTop: '2rem',
        textAlign: 'center',
        color: 'var(--text-primary)',
        background: 'var(--glass-bg)',
        padding: '1.5rem 3rem',
        borderRadius: '24px',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        maxWidth: '80%',
    },
    metadataTitle: {
        fontSize: '1.2rem',
        marginBottom: '1rem',
        fontWeight: '600',
        letterSpacing: '-0.01em',
    },
    exifGrid: {
        display: 'flex',
        gap: '2.5rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    exifItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.2rem',
    },
    exifLabel: {
        fontSize: '0.65rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: '600',
    },
    exifValue: {
        fontSize: '0.9rem',
        color: 'var(--text-primary)',
        fontWeight: '400',
    },
    navBtn: {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        padding: '1rem',
        borderRadius: '50%',
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    closeBtn: {
        position: 'absolute',
        top: '-10px',
        right: '10px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        padding: '0.8rem',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }
};

export default Home;
