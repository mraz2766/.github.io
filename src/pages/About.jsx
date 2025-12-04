import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const About = () => {
    const [randomPhoto, setRandomPhoto] = useState(null);

    useEffect(() => {
        fetch('/photos.json')
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    const randomIndex = Math.floor(Math.random() * data.length);
                    setRandomPhoto(data[randomIndex]);
                }
            })
            .catch(e => console.error("Failed to load photo for About:", e));
    }, []);

    return (
        <div style={styles.container}>
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={styles.imageWrapper}
                className="about-image-wrapper"
            >
                {randomPhoto ? (
                    <motion.img
                        src={randomPhoto.src}
                        alt={randomPhoto.title || 'Gallery Image'}
                        style={styles.image}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1.0 }}
                        transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }} // Ken Burns effect
                    />
                ) : (
                    <div style={styles.placeholder} />
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                style={styles.contactWrapper}
            >
                <span style={styles.label}>Get in touch</span>
                <a href="mailto:huangl2766@gmail.com" style={styles.email} className="about-email">
                    huangl2766@gmail.com
                </a>
            </motion.div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '90vh', // Increased for better vertical centering
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '3rem',
    },
    imageWrapper: {
        width: '100%',
        maxWidth: '1200px',
        height: '65vh',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        backgroundColor: 'var(--btn-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'contain', // Ensure full image is visible
    },
    placeholder: {
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--btn-bg)',
    },
    contactWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.8rem',
    },
    label: {
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        color: 'var(--text-secondary)',
        fontWeight: '500',
        fontFamily: "'Playfair Display', serif", // Editorial touch
        fontStyle: 'italic',
    },
    email: {
        fontSize: '1.4rem',
        color: 'var(--text-primary)',
        textDecoration: 'none',
        fontWeight: '400',
        borderBottom: '1px solid transparent',
        transition: 'border-color 0.2s',
        fontFamily: "'Playfair Display', serif", // Editorial touch
    }
};

// Inject styles for hover and responsive adjustments
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .about-email:hover {
        border-bottom-color: var(--text-primary) !important;
    }
    @media (max-width: 768px) {
        .about-image-wrapper {
            height: 50vh !important;
            border-radius: 8px !important;
        }
    }
`;
document.head.appendChild(styleSheet);

export default About;
