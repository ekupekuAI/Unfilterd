import { motion, AnimatePresence } from 'framer-motion';
import { AuraBackground } from './AuraBackground';
import { ParticleSystem } from './ParticleSystem';
import { LogoReveal } from './LogoReveal';
import { FeedTransition } from './FeedTransition';

export function StartupAnimation({ active, phase }: { active: boolean; phase: string }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden bg-[#05060A]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          aria-hidden="true"
        >
          <AuraBackground phase={phase} />
          <ParticleSystem phase={phase} />
          <LogoReveal phase={phase} />
          <FeedTransition phase={phase} />
          <motion.div
            className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05060A] to-transparent"
            animate={{ opacity: phase === 'feed' || phase === 'ready' ? 0.55 : 0.25 }}
            transition={{ duration: 0.7 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
