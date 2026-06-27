import { motion } from 'framer-motion';

export function AuraBackground({ phase }: { phase: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#05060A]" />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[40vmax] w-[40vmax] rounded-full blur-3xl opacity-0"
        animate={{
          opacity: phase === 'dark' ? 0 : phase === 'atmosphere' ? 0.16 : phase === 'glow' || phase === 'logo' || phase === 'pulse' ? 0.28 : 0.12,
          scale: phase === 'dark' ? 0.4 : phase === 'pulse' ? 1.15 : 1,
          x: '-50%',
          y: '-50%',
        }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.9) 0%, rgba(6,182,212,0.55) 32%, rgba(255,255,255,0.12) 56%, transparent 72%)' }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: phase === 'dark' ? 0 : 1 }}
        transition={{ duration: 0.8 }}
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(139,92,246,0.12), transparent 24%), radial-gradient(circle at 52% 48%, rgba(6,182,212,0.1), transparent 18%)',
        }}
      />
    </div>
  );
}
