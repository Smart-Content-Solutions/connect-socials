import { motion } from 'framer-motion';
import { animationConfig } from '@/lib/animations';

interface AnimatedBlobProps {
  className?: string;
  color?: 'gold' | 'silver';
  delay?: number;
  size?: number;
}

export function AnimatedBlob({ 
  className = '', 
  color = 'gold',
  delay = 0,
  size = 500,
}: AnimatedBlobProps) {
  const baseColor = color === 'gold' 
    ? 'bg-primary/15' 
    : 'bg-foreground/8';

  return (
    <motion.div
      className={`absolute rounded-full blur-[150px] pointer-events-none will-change-transform ${baseColor} ${className}`}
      style={{ width: size, height: size }}
      initial={{ scale: 1, opacity: 0 }}
      animate={{
        scale: [
          animationConfig.blobScale.min,
          animationConfig.blobScale.max,
          animationConfig.blobScale.min,
        ],
        opacity: [0.15, 0.22, 0.15],
        x: [0, 25, -15, 0],
        y: [0, -15, 20, 0],
      }}
      transition={{
        duration: animationConfig.blobDuration,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large gold blob - top right */}
      <AnimatedBlob 
        className="-top-64 -right-64"
        color="gold"
        size={650}
        delay={0}
      />
      
      {/* Silver blob - bottom left */}
      <AnimatedBlob 
        className="bottom-[-100px] left-[15%]"
        color="silver"
        size={550}
        delay={5}
      />
      
      {/* Smaller gold blob - center right */}
      <AnimatedBlob 
        className="top-[40%] right-[20%]"
        color="gold"
        size={350}
        delay={10}
      />
      
      {/* Silver accent - top left */}
      <AnimatedBlob 
        className="top-[20%] -left-32"
        color="silver"
        size={400}
        delay={15}
      />
      
      {/* Subtle gold - bottom right */}
      <AnimatedBlob 
        className="bottom-[10%] right-[5%]"
        color="gold"
        size={280}
        delay={20}
      />
    </div>
  );
}