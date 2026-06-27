import { motion } from 'framer-motion';

const particles = Array.from({ length: 18 }, (_, index) => index);

export function ParticleSystem({ phase }: { phase: string }) {
  return (
    <div className="absolute inset-0">
      {particles.map(index => {
        const left = 14 + ((index * 37) % 72);
        const top = 18 + ((index * 23) % 58);
        const size = 1.5 + (index % 4) * 0.9;
        return (
          <motion.span
            key={index}
            className="absolute rounded-full will-change-transform"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: index % 2 === 0 ? 'rgba(139,92,246,0.9)' : 'rgba(6,182,212,0.85)',
              boxShadow: '0 0 10px rgba(255,255,255,0.25), 0 0 18px rgba(139,92,246,0.22)',
            }}
            animate={{
              opacity: phase === 'dark' ? 0 : phase === 'atmosphere' ? 0.28 : phase === 'logo' || phase === 'pulse' ? 0.6 : phase === 'dissolve' ? 0.85 : 0.18,
              y: phase === 'dissolve' || phase === 'feed' ? [0, -12, -28] : [0, -4, 0],
              x: phase === 'dissolve' || phase === 'feed' ? [0, (index % 2 === 0 ? 1 : -1) * 10, (index % 3) * 3] : [0, 0, 0],
              scale: phase === 'pulse' ? [1, 1.18, 1] : phase === 'dissolve' ? 0.7 : 1,
            }}
            transition={{
              duration: phase === 'dissolve' || phase === 'feed' ? 2.4 : 4.8,
              ease: 'easeInOut',
              repeat: phase === 'dissolve' || phase === 'feed' ? 0 : Infinity,
              repeatType: 'mirror',
            }}
          />
        );
      })}
    </div>
  );
}
