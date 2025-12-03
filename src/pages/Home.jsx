import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import photosData from '../photos.json';

// Simple shuffle function
const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

// Fallback data if json is empty or fails
const defaultPhotos = [
    { 
        id: 1, 
        src: 'https://images.unsplash.com/photo-1493863641943-9b68992a_d07?auto=format&fit=crop&w=1600&q=80', 
        title: 'Sample: Urban Solitude', 
        width: 1600,
        height: 1067,
        category: 'General',
        exif: { camera: 'Fujifilm X-T4', lens: 'XF 35mm f/1.4', iso: '400', aperture: 'f/2.8', shutter: '1/125s' }
    }
];

const photos = (photosData && photosData.length > 0) ? photosData : defaultPhotos;
const RANDOM_PHOTO_COUNT = 9;

const ExifItem = ({ label, value }) => (
    <div>
        <span style={styles.exifLabel}>{label}</span>
        <span style={styles.exifValue}>{value || 'N/A'}</span>
    </div>
);

const Home = () => {
    const [selectedId, setSelectedId] = useState(null);
    const [activeCategory, setActiveCategory] = useState('Home');
    const [randomPhotos, setRandomPhotos] = useState([]);

    // Set initial random photos on component mount
    useEffect(() => {
        setRandomPhotos(shuffleArray(photos).slice(0, RANDOM_PHOTO_COUNT));
    }, []);

    const categories = useMemo(() => ['Home', 'All', ...new Set(photos.map(p => p.category))], []);
    
    const filteredPhotos = useMemo(() => {
        if (activeCategory === 'Home') {
            return randomPhotos;
        }
        if (activeCategory === 'All') {
            return shuffleArray(photos);
        }
        const categoryPhotos = photos.filter(p => p.category === activeCategory);
        return shuffleArray(categoryPhotos);
    }, [activeCategory, randomPhotos]);

    const handleNext = useCallback(() => {
        if (selectedId === null) return;
        const currentIndex = filteredPhotos.findIndex(p => p.id === selectedId);
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

    const selectedPhoto = photos.find(p => p.id === selectedId);

    return (
        <>
            <div style={styles.filterContainer}>
                {categories.map(category => (
                    <button
                        key={category}
                        style={{
                            ...styles.filterButton,
                            ...(activeCategory === category ? styles.activeFilterButton : {})
                        }}
                        onClick={() => setActiveCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <motion.div layout style={styles.grid}>
                <AnimatePresence>
                    {filteredPhotos.map((photo) => (
                        <motion.div
                            key={photo.id}
                            style={styles.item}
                            onClick={() => setSelectedId(photo.id)}
                            layoutId={`card-${photo.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <motion.div style={styles.imageWrapper}>
                                <motion.img 
                                    src={photo.src} 
                                    alt={photo.title} 
                                    style={styles.image}
                                />
                            </motion.div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {selectedId && selectedPhoto && (
                    <motion.div
                        style={styles.lightbox}
                        onClick={() => setSelectedId(null)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div style={styles.lightboxContentWrapper}>
                            <motion.div 
                                style={styles.lightboxContent}
                                onClick={(e) => e.stopPropagation()}
                                layoutId={`card-${selectedId}`}
                            >
                                <motion.img 
                                    src={selectedPhoto.src} 
                                    alt={selectedPhoto.title} 
                                    style={{
                                        ...styles.lightboxImage, 
                                        aspectRatio: `${selectedPhoto.width} / ${selectedPhoto.height}`
                                    }} 
                                />
                            </motion.div>
                            <motion.div style={styles.metadata} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <h2 style={styles.metadataTitle}>{selectedPhoto.title}</h2>
                                <div style={styles.exifGrid}>
                                    <ExifItem label="Camera" value={selectedPhoto.exif.camera} />
                                    <ExifItem label="Lens" value={selectedPhoto.exif.lens} />
                                    <ExifItem label="ISO" value={selectedPhoto.exif.iso} />
                                    <ExifItem label="Aperture" value={selectedPhoto.exif.aperture} />
                                    <ExifItem label="Shutter" value={selectedPhoto.exif.shutter} />
                                </div>
                            </motion.div>
                        </motion.div>
                        
                        <button style={{...styles.navBtn, left: 'var(--spacing-lg)'}} onClick={(e) => { e.stopPropagation(); handlePrev(); }}>‹</button>
                        <button style={{...styles.navBtn, right: 'var(--spacing-lg)'}} onClick={(e) => { e.stopPropagation(); handleNext(); }}>›</button>
                        <button style={styles.closeBtn} onClick={() => setSelectedId(null)}>×</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

// Updated styles for Masonry Layout and Filtering
const styles = {
    filterContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-lg)',
    },
    filterButton: {
        background: 'transparent',
        border: '1px solid var(--border-color)',
        borderRadius: '999px',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        fontFamily: 'var(--font-family)',
        fontSize: '0.9rem',
        cursor: 'pointer',
        color: 'var(--text-color-secondary)',
        transition: 'all 0.2s ease',
    },
    activeFilterButton: {
        color: 'var(--bg-color)',
        background: 'var(--text-color-primary)',
        borderColor: 'var(--text-color-primary)',
    },
    grid: {
        columnCount: 3,
        columnGap: 'var(--spacing-lg)',
    },
    item: {
        breakInside: 'avoid',
        marginBottom: 'var(--spacing-lg)',
        cursor: 'pointer',
    },
    imageWrapper: {
        overflow: 'hidden',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        width: '100%',
    },
    image: {
        width: '100%',
        height: 'auto',
        display: 'block',
    },
    lightbox: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        flexDirection: 'column',
        padding: 'var(--spacing-xl)',
    },
    lightboxContentWrapper: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lightboxContent: {
        position: 'relative',
        width: 'auto',
        height: 'auto',
        maxHeight: '80vh',
        maxWidth: '90vw',
    },
    lightboxImage: {
        display: 'block',
        width: 'auto',
        height: 'auto',
        maxHeight: '80vh',
        maxWidth: '90vw',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    metadata: {
        marginTop: 'var(--spacing-lg)',
        color: '#fff',
        textAlign: 'center',
        maxWidth: '600px',
    },
    metadataTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#fff',
    },
    exifGrid: {
        display: 'flex',
        justifyContent: 'center',
        gap: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-md)',
        color: 'var(--text-color-secondary)',
    },
    exifLabel: {
        fontSize: '0.8rem',
        color: '#888',
        textTransform: 'uppercase',
        display: 'block',
    },
    exifValue: {
        fontSize: '0.9rem',
        color: '#eee',
        display: 'block',
    },
    navBtn: {
        position: 'fixed',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.2)',
        border: 'none',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '2.5rem',
        fontWeight: '100',
        cursor: 'pointer',
        zIndex: 1001,
        transition: 'background 0.2s, color 0.2s',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: '5px',
    },
    closeBtn: {
        position: 'fixed',
        top: 'var(--spacing-lg)',
        right: 'var(--spacing-lg)',
        background: 'rgba(0,0,0,0.2)',
        border: 'none',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '1.5rem',
        cursor: 'pointer',
        zIndex: 1001,
        transition: 'background 0.2s, color 0.2s',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }
};

export default Home;