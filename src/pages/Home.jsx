import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const PAGE_SIZE = 35; // Increased batch size for smoother scrolling

const Home = () => {
    const [allPhotos, setAllPhotos] = useState([]); // Store ALL photos
    const [filteredPhotos, setFilteredPhotos] = useState([]); // Store photos after category filter
    const [displayPhotos, setDisplayPhotos] = useState([]); // Store photos currently visible (paginated)
    const [selectedId, setSelectedId] = useState(null);
    const [filter, setFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isCompact, setIsCompact] = useState(false);

    // Observer for infinite scroll
    const observer = useRef();
    const lastPhotoElementRef = useCallback(node => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        }, { rootMargin: '500px' }); // Preload before reaching bottom
        if (node) observer.current.observe(node);
    }, [hasMore]);

    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // 1. Load Initial Data
    useEffect(() => {
        fetch('/photos.json')
            .then(res => res.json())
            .then(data => {
                setAllPhotos(data);
                // Initial shuffle and filter
                const shuffled = shuffleArray(data);
                setFilteredPhotos(shuffled);
                setDisplayPhotos(shuffled.slice(0, PAGE_SIZE));
                setHasMore(shuffled.length > PAGE_SIZE);
            })
            .catch(err => console.error("Failed to load photos:", err));

        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,600;1,600&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        return () => document.head.removeChild(link);
    }, []);

    // 2. Handle Theme
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.style.setProperty('--bg-color', '#000000');
            root.style.setProperty('--text-primary', '#f5f5f7');
            root.style.setProperty('--text-secondary', '#86868b');
            root.style.setProperty('--btn-bg', 'rgba(255,255,255,0.1)');
            root.style.setProperty('--btn-bg-active', '#fff');
            root.style.setProperty('--btn-text-active', '#000');
            root.style.setProperty('--lightbox-bg', 'rgba(0,0,0,0.95)');
            root.style.setProperty('--glass-bg', 'rgba(20,20,20,0.7)');
            root.style.setProperty('--glass-border', 'rgba(255,255,255,0.1)');
            root.style.setProperty('--header-bg', 'rgba(0,0,0,0.85)');
            root.style.setProperty('--header-border', 'rgba(255,255,255,0.15)');
        } else {
            root.style.setProperty('--bg-color', '#ffffff');
            root.style.setProperty('--text-primary', '#1d1d1f');
            root.style.setProperty('--text-secondary', '#86868b');
            root.style.setProperty('--btn-bg', 'rgba(0,0,0,0.05)');
            root.style.setProperty('--btn-bg-active', '#1d1d1f');
            root.style.setProperty('--btn-text-active', '#fff');
            root.style.setProperty('--lightbox-bg', 'rgba(255,255,255,0.98)');
            root.style.setProperty('--glass-bg', 'rgba(255,255,255,0.8)');
            root.style.setProperty('--glass-border', 'rgba(0,0,0,0.05)');
            root.style.setProperty('--header-bg', 'rgba(255,255,255,0.85)');
            root.style.setProperty('--header-border', 'rgba(0,0,0,0.05)');
        }
    }, [theme]);

    // 3. Handle Filter Change (Reset Page)
    useEffect(() => {
        if (allPhotos.length === 0) return;

        let filtered = filter === 'All' ? allPhotos : allPhotos.filter(p => p.category === filter);
        const shuffled = shuffleArray(filtered);

        setFilteredPhotos(shuffled);
        setPage(1); // Reset to page 1
        setDisplayPhotos(shuffled.slice(0, PAGE_SIZE));
        setHasMore(shuffled.length > PAGE_SIZE);

        // Scroll to top when filter changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [filter, allPhotos]);

    // 4. Handle Pagination (Append Data)
    useEffect(() => {
        if (page === 1) return; // Initial load handled by Filter effect

        const nextBatch = filteredPhotos.slice(0, page * PAGE_SIZE);
        setDisplayPhotos(nextBatch);
        setHasMore(filteredPhotos.length > nextBatch.length);
    }, [page, filteredPhotos]);

    const handleNext = useCallback(() => {
        if (selectedId === null) return;
        const currentIndex = filteredPhotos.findIndex(p => p.id === selectedId); // Use filteredPhotos for navigation context
        const nextIndex = (currentIndex + 1) % filteredPhotos.length;
        setSelectedId(filteredPhotos[nextIndex].id);
    }, [selectedId, filteredPhotos]);

    const handlePrev = useCallback(() => {
        if (selectedId === null) return;
        const currentIndex = filteredPhotos.findIndex(p => p.id === selectedId);
        const prevIndex = (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
        setSelectedId(filteredPhotos[prevIndex].id);
    }, [selectedId, filteredPhotos]);

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

    const categories = ['All', ...new Set(allPhotos.map(p => p.category))];
    const selectedPhoto = allPhotos.find(p => p.id === selectedId);

    return (
        <div className="container" style={styles.container}>
            {/* Header */}
            <header className="header" style={styles.header}>
                <div className="logo-spacer" style={{ width: '40px' }}></div>

                <nav className="nav-scroll" style={styles.nav}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            style={filter === cat ? styles.activeFilterButton : styles.filterButton}
                            className="filter-btn"
                        >
                            {cat}
                        </button>
                    ))}
                </nav>

                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={() => setIsCompact(!isCompact)} style={styles.iconBtn} aria-label="Toggle View">
                        {isCompact ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /></svg>
                        )}
                    </button>

                    <button onClick={toggleTheme} style={styles.iconBtn} aria-label="Toggle Theme">
                        {theme === 'light' ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Grid */}
            <motion.div className="grid-container" style={styles.grid} layout>
                <AnimatePresence mode='popLayout'>
                    {displayPhotos.map((photo, index) => {
                        // Attach ref to the last element to trigger infinite scroll
                        if (displayPhotos.length === index + 1) {
                            return (
                                <motion.div
                                    ref={lastPhotoElementRef}
                                    key={photo.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4 }}
                                    style={styles.item}
                                    onClick={() => setSelectedId(photo.id)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div style={styles.imageWrapper}>
                                        <img
                                            src={photo.thumbnail || photo.src}
                                            alt={photo.title}
                                            style={styles.image}
                                            loading="lazy"
                                        />
                                        <div style={styles.overlay}></div>
                                    </div>
                                </motion.div>
                            );
                        } else {
                            return (
                                <motion.div
                                    key={photo.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4 }}
                                    style={styles.item}
                                    onClick={() => setSelectedId(photo.id)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div style={styles.imageWrapper}>
                                        <img
                                            src={photo.thumbnail || photo.src}
                                            alt={photo.title}
                                            style={styles.image}
                                            loading="lazy"
                                        />
                                        <div style={styles.overlay}></div>
                                    </div>
                                </motion.div>
                            );
                        }
                    })}
                </AnimatePresence>
            </motion.div>

            {/* Loading Indicator */}
            {hasMore && (
                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading more...</span>
                </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {selectedId && selectedPhoto && (
                    <motion.div
                        style={styles.lightbox}
                        onClick={() => setSelectedId(null)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="lightbox-content"
                            style={styles.lightboxContent}
                            onClick={(e) => e.stopPropagation()}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            <img
                                src={selectedPhoto.src}
                                alt={selectedPhoto.title}
                                className="lightbox-image"
                                style={styles.lightboxImage}
                            />

                            <div className="metadata-panel" style={styles.metadata}>
                                <div style={styles.exifGrid}>
                                    <span style={styles.metadataTitle}>{selectedPhoto.title}</span>
                                    {selectedPhoto.exif && (
                                        <>
                                            <span style={styles.separator}>|</span>
                                            <ExifItem value={selectedPhoto.exif.camera} />
                                            <ExifItem value={selectedPhoto.exif.lens} />
                                            <ExifItem value={selectedPhoto.exif.iso ? `ISO ${selectedPhoto.exif.iso}` : ''} />
                                            <ExifItem value={selectedPhoto.exif.aperture} />
                                            <ExifItem value={selectedPhoto.exif.shutter ? `${selectedPhoto.exif.shutter}s` : ''} />
                                        </>
                                    )}
                                </div>
                            </div>

                            <button className="nav-btn nav-left" style={{ ...styles.navBtn, left: '30px' }} onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            <button className="nav-btn nav-right" style={{ ...styles.navBtn, right: '30px' }} onClick={(e) => { e.stopPropagation(); handleNext(); }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
                            <button className="close-btn" style={styles.closeBtn} onClick={() => setSelectedId(null)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Responsive Styles */}
            <style>{`
                body {
                    background-color: var(--bg-color);
                    color: var(--text-primary);
                    font-family: 'Inter', sans-serif;
                    transition: background-color 0.3s ease, color 0.3s ease;
                    margin: 0;
                    -webkit-tap-highlight-color: transparent;
                }
                ::-webkit-scrollbar { width: 0px; background: transparent; }

                /* Desktop Defaults */
                /* Desktop Defaults */
                .grid-container { 
                    column-count: ${isCompact ? 7 : 3}; 
                    column-gap: ${isCompact ? '0.5rem' : '2rem'}; 
                }
                .nav-scroll { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }

                /* Mobile Optimization */
                @media (max-width: 1024px) { .grid-container { column-count: 2; } }
                
                @media (max-width: 768px) {
                    .container { padding: 0 1rem 1rem 1rem !important; }
                    
                    /* Header Mobile */
                    .header { 
                        margin: 0 -1rem 1rem -1rem !important; 
                        padding: 0.8rem 1rem !important;
                    }
                    .logo-spacer { display: none; }
                    
                    /* Scrollable Nav */
                    .nav-scroll {
                        flex-wrap: nowrap !important;
                        overflow-x: auto;
                        justify-content: flex-start !important;
                        padding-right: 2rem;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                        mask-image: linear-gradient(to right, black 85%, transparent 100%);
                    }
                    .nav-scroll::-webkit-scrollbar { display: none; }
                    .filter-btn { white-space: nowrap; flex-shrink: 0; }

                    /* Grid Mobile */
                    /* Grid Mobile */
                    .grid-container { 
                        column-count: ${isCompact ? 5 : 2} !important; 
                        column-gap: ${isCompact ? '0.2rem' : '0.5rem'} !important;
                    }
                    
                    /* Lightbox Mobile */
                    .lightbox-content {
                        width: 100% !important;
                        height: 100% !important;
                        max-height: 100vh !important;
                        justify-content: center;
                    }
                    .lightbox-image {
                        max-height: 55vh !important;
                        width: 100% !important;
                        object-fit: contain !important;
                    }
                    .metadata-panel {
                        padding: 1rem !important;
                        width: 90% !important;
                        margin-top: 1rem !important;
                    .metadata-panel {
                        padding: 0.8rem 1.2rem !important;
                        width: auto !important;
                        max-width: 90% !important;
                        margin-top: 1rem !important;
                        /* Removed dark background override to match PC style */
                    }
                    .metadata-panel h2 { font-size: 1rem !important; margin-bottom: 0 !important; }
                    
                    /* Nav Buttons Mobile */
                    .nav-btn {
                        width: 44px !important;
                        height: 44px !important;
                        background: rgba(0,0,0,0.3) !important;
                        backdrop-filter: blur(5px);
                        border: none !important;
                        color: white !important;
                        top: auto !important;
                        bottom: 20px !important;
                        transform: none !important;
                    }
                    .nav-left { left: 20px !important; }
                    .nav-right { right: 20px !important; }
                    
                    .close-btn {
                        top: 15px !important;
                        right: 15px !important;
                        background: rgba(0,0,0,0.3) !important;
                        color: white !important;
                        width: 40px;
                        height: 40px;
                    }
                }
            `}</style>
        </div>
    );
};

const ExifItem = ({ value }) => {
    if (!value || value.toString().startsWith('Unknown')) return null;
    return (
        <span style={styles.exifValue}>{value}</span>
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
        margin: '0 -2rem 2rem -2rem',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--header-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--header-border)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
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
    iconBtn: {
        background: 'var(--btn-bg)',
        border: '1px solid var(--header-border)', // Add texture
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
        // columnCount handled by CSS class
    },
    item: {
        breakInside: 'avoid',
        marginBottom: '2rem',
        cursor: 'pointer',
        borderRadius: '12px',
        overflow: 'hidden',
    },
    imageWrapper: {
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--btn-bg)',
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
        background: 'rgba(0,0,0,0.05)',
        opacity: 0,
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
    },
    lightbox: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'var(--lightbox-bg)',
        backdropFilter: 'blur(20px)',
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
        marginTop: '1.5rem', // Push below image
        color: 'var(--text-primary)',
        background: 'var(--glass-bg)',
        padding: '0.6rem 1.2rem',
        borderRadius: '999px',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        maxWidth: '90%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        zIndex: 10,
        // Removed absolute positioning
    },
    metadataTitle: {
        fontSize: '1.1rem',
        fontWeight: '600',
        marginRight: '0.8rem',
        fontFamily: "'Playfair Display', serif", // Editorial touch
        fontStyle: 'italic',
    },
    separator: {
        margin: '0 0.5rem',
        opacity: 0.3,
    },
    exifGrid: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        fontSize: '0.85rem',
    },
    exifValue: {
        color: 'var(--text-secondary)',
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
