// Animation variants for Framer Motion
export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

export const slideUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export const slideDown = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
};

export const slideLeft = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
};

export const slideRight = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
};

export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

// Transition presets
export const transitions = {
    fast: { duration: 0.15, ease: 'easeOut' },
    normal: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
    slow: { duration: 0.3, ease: 'easeInOut' },
    spring: { type: 'spring', stiffness: 300, damping: 30 },
};

// Page transition variants
export const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: transitions.normal,
};

export default {
    fadeIn,
    slideUp,
    slideDown,
    slideLeft,
    slideRight,
    scaleIn,
    staggerContainer,
    staggerItem,
    transitions,
    pageTransition,
};
