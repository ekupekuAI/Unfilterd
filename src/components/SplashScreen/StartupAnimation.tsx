import { motion, AnimatePresence } from 'framer-motion';
import { AuraBackground } from './AuraBackground';
import { ParticleSystem } from './ParticleSystem';
import { LogoReveal } from './LogoReveal';
import { FeedTransition } from './FeedTransition';
import { ReelIntro } from './ReelIntro';

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
          <motion.div
            className="absolute inset-0"
            animate={{
              opacity: phase === 'dark' ? 0 : 1,
              backgroundPositionY: phase === 'feed' || phase === 'ready' ? '50%' : '0%',
            }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              backgroundImage:
                'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent 30%), radial-gradient(circle at 50% 20%, rgba(139,92,246,0.12), transparent 28%), radial-gradient(circle at 50% 78%, rgba(6,182,212,0.08), transparent 26%)',
            }}
          />
          <AuraBackground phase={phase} />
          <ParticleSystem phase={phase} />
          <ReelIntro phase={phase} />
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
