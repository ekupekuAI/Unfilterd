import { motion } from 'framer-motion';

const panels = [
  { eyebrow: 'ENTRY', title: 'PRIVATE SPACE', copy: 'A calm opening into the feed.' },
  { eyebrow: 'UNFILTERD', title: 'Speak freely.', copy: 'Stay anonymous.', highlight: true },
  { eyebrow: 'FEED', title: 'Thoughts become stories', copy: 'One unfiltered thought at a time.' },
];

export function ReelIntro({ phase }: { phase: string }) {
  const visible = phase !== 'dark' && phase !== 'skip';

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 pointer-events-none"
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        y: phase === 'feed' ? -32 : 0,
        scale: phase === 'feed' ? 0.985 : 1,
      }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
    >
      <div className="w-full max-w-[460px] space-y-3 sm:space-y-4">
        {panels.map((panel, index) => {
          const active = index === 1;
          return (
            <motion.div
              key={panel.title}
              className={`relative overflow-hidden rounded-[2rem] border backdrop-blur-xl ${
                panel.highlight
                  ? 'border-white/14 bg-white/8 shadow-[0_24px_72px_rgba(139,92,246,0.16)]'
                  : 'border-white/8 bg-white/5'
              }`}
              style={{ minHeight: index === 1 ? 238 : 150 }}
              initial={false}
              animate={{
                opacity: phase === 'glow'
                  ? (panel.highlight ? 1 : 0.72)
                  : phase === 'logo'
                    ? (panel.highlight ? 1 : 0.58)
                    : phase === 'pulse'
                      ? (panel.highlight ? 1 : 0.48)
                      : phase === 'dissolve'
                        ? (panel.highlight ? 0.84 : 0.3)
                        : phase === 'feed' || phase === 'ready'
                          ? 0
                          : 0,
                scale: panel.highlight ? 1 : phase === 'logo' ? 0.985 : phase === 'pulse' ? 0.975 : phase === 'dissolve' ? 0.9 : 1,
                y: phase === 'feed'
                  ? (index === 1 ? -38 : index === 0 ? -22 : 24)
                  : phase === 'dissolve'
                    ? (index === 1 ? -14 : index === 0 ? -6 : 10)
                    : phase === 'pulse'
                      ? (index === 1 ? -4 : 0)
                      : 0,
              }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.06 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
              <div className={`absolute inset-0 ${panel.highlight ? 'bg-[radial-gradient(circle_at_50%_28%,rgba(139,92,246,0.28),transparent_42%),radial-gradient(circle_at_50%_74%,rgba(6,182,212,0.2),transparent_36%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_55%)]'}`} />
              <div className="relative z-10 h-full px-6 py-5 sm:px-7 sm:py-6 flex flex-col justify-between">
                <p className="text-[10px] tracking-[0.42em] uppercase text-white/40">{panel.eyebrow}</p>
                <div>
                  <h2 className={`leading-[0.94] ${panel.highlight ? 'text-[clamp(2.6rem,7vw,4.25rem)] font-semibold tracking-[0.06em] text-white' : 'text-[clamp(1.7rem,4.5vw,2.8rem)] font-medium tracking-[0.05em] text-white/90'}`}>
                    {panel.title}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-white/55 tracking-[0.22em] uppercase">{panel.copy}</p>
                </div>
              </div>
              {active && (
                <motion.div
                  className="absolute inset-y-0 left-0 w-1/2 bg-white/10 blur-2xl"
                  animate={{ x: ['-65%', '130%'] }}
                  transition={{ duration: 1.65, ease: 'easeInOut', repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
