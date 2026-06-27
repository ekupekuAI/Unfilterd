import { motion } from 'framer-motion';

export function FeedTransition({ phase }: { phase: string }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={false}
      animate={{ opacity: phase === 'feed' || phase === 'ready' ? 1 : 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <motion.div
        className="absolute bottom-24 left-1/2 w-[min(92vw,720px)] -translate-x-1/2 space-y-3"
        initial={false}
        animate={{ opacity: phase === 'feed' || phase === 'ready' ? 1 : 0, y: phase === 'feed' || phase === 'ready' ? 0 : 24 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {['Post card', 'Avatar', 'Nav icon'].map((label, index) => (
          <motion.div
            key={label}
            className="h-16 rounded-2xl border border-white/8 bg-white/5 backdrop-blur-md"
            initial={false}
            animate={{ opacity: phase === 'feed' || phase === 'ready' ? 0.16 + index * 0.1 : 0, scale: phase === 'feed' || phase === 'ready' ? 1 : 0.96 }}
            transition={{ duration: 0.7, delay: index * 0.08, ease: 'easeOut' }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
