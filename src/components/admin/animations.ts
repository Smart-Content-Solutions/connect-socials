import { motion } from 'framer-motion';

// Animation configuration - centralized for easy "reduce motion" toggle
export const animationConfig = {
  enabled: true,
  
  // Durations
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  
  // Background blob animation
  blobDuration: 25,
  blobScale: { min: 0.9, max: 1.1 },
  
  // Page transitions
  pageTransition: {
    duration: 0.35,
    ease: [0.25, 0.1, 0.25, 1] as const,
  },
  
  // Card animations
  cardStagger: 0.06,
  cardHover: {
    y: -3,
    scale: 1.01,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
  
  // Table row animations
  rowStagger: 0.04,
  
  // Sidebar
  sidebarItemHover: {
    x: 3,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
  
  // CTA pulse
  ctaPulse: {
    duration: 3,
    repeat: Infinity,
  },
};

// Reduce motion helper (can be connected to user preference later)
export const shouldAnimate = () => animationConfig.enabled;

// Common animation variants
export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: animationConfig.slow, ease: animationConfig.pageTransition.ease }
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: animationConfig.normal }
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: animationConfig.cardStagger,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: animationConfig.normal, ease: 'easeOut' }
  },
};

export const tableRowVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * animationConfig.rowStagger,
      duration: animationConfig.normal,
      ease: 'easeOut',
    },
  }),
};