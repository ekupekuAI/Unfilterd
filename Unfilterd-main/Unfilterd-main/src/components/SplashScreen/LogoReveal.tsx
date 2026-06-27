import { motion } from 'framer-motion';

export function LogoReveal({ phase }: { phase: string }) {
  const reveal = phase === 'logo' || phase === 'pulse' || phase === 'dissolve' || phase === 'feed';

  return (
    <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
      <motion.div
        className="relative"
        animate={{
          opacity: reveal ? 1 : 0,
          filter: phase === 'logo' ? 'blur(12px) saturate(1.1)' : phase === 'pulse' ? 'blur(2px)' : 'blur(0px)',
          scale: phase === 'logo' ? 0.98 : phase === 'pulse' ? 1.03 : phase === 'dissolve' ? 0.88 : 1,
          rotateZ: phase === 'logo' ? -0.2 : 0,
          y: phase === 'feed' ? -6 : 0,
        }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      >
        <h1 className="text-[clamp(2.75rem,8vw,6.8rem)] font-semibold tracking-[0.32em] text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.18)]">
          UNFILTERD
        </h1>
        <motion.div
          className="absolute inset-0 -z-10 rounded-full"
          animate={{
            opacity: phase === 'pulse' ? 0.65 : 0.3,
            scale: phase === 'pulse' ? 1.1 : phase === 'dissolve' ? 0.95 : 1,
          }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(6,182,212,0.12) 34%, transparent 68%)',
            filter: 'blur(24px)',
          }}
        />
      </motion.div>
      <motion.p
        className="mt-4 text-xs sm:text-sm tracking-[0.28em] uppercase text-white/55"
        animate={{ opacity: reveal ? 1 : 0, y: reveal ? 0 : 6 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
      >
        Speak Freely. Stay Anonymous.
      </motion.p>
    </div>
  );
}
