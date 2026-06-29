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
      animate={{ opacity: visible ? 1 : 0, y: phase === 'feed' ? -18 : 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className="w-full max-w-[430px] space-y-4">
        {panels.map((panel, index) => {
          const active = index === 1;
          return (
            <motion.div
              key={panel.title}
              className={`relative overflow-hidden rounded-[2rem] border backdrop-blur-xl ${
                panel.highlight
                  ? 'border-white/14 bg-white/8 shadow-[0_20px_60px_rgba(139,92,246,0.12)]'
                  : 'border-white/8 bg-white/5'
              }`}
              style={{ minHeight: index === 1 ? 206 : 144 }}
              initial={false}
              animate={{
                opacity: phase === 'glow'
                  ? (panel.highlight ? 1 : 0.72)
                  : phase === 'logo'
                    ? (panel.highlight ? 1 : 0.58)
                    : phase === 'pulse'
                      ? (panel.highlight ? 1 : 0.48)
                      : phase === 'dissolve'
                        ? (panel.highlight ? 0.82 : 0.36)
                        : phase === 'feed' || phase === 'ready'
                          ? 0.05
                          : 0,
                scale: panel.highlight ? 1 : phase === 'logo' ? 0.985 : phase === 'pulse' ? 0.98 : phase === 'dissolve' ? 0.92 : 1,
                y: phase === 'feed' ? (index === 1 ? -28 : index === 0 ? -18 : 18) : phase === 'dissolve' ? (index === 1 ? -10 : 0) : 0,
              }}
              transition={{ duration: 0.85, ease: 'easeOut', delay: index * 0.05 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
              <div className={`absolute inset-0 ${panel.highlight ? 'bg-[radial-gradient(circle_at_50%_35%,rgba(139,92,246,0.26),transparent_44%),radial-gradient(circle_at_50%_68%,rgba(6,182,212,0.18),transparent_34%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_55%)]'}`} />
              <div className="relative z-10 h-full px-6 py-5 flex flex-col justify-between">
                <p className="text-[10px] tracking-[0.38em] uppercase text-white/40">{panel.eyebrow}</p>
                <div>
                  <h2 className={`leading-none ${panel.highlight ? 'text-[clamp(2.2rem,6vw,3.6rem)] font-semibold tracking-[0.08em] text-white' : 'text-[clamp(1.5rem,4vw,2.6rem)] font-medium tracking-[0.06em] text-white/90'}`}>
                    {panel.title}
                  </h2>
                  <p className="mt-2 text-sm text-white/55 tracking-[0.18em] uppercase">{panel.copy}</p>
                </div>
              </div>
              {active && (
                <motion.div
                  className="absolute inset-y-0 left-0 w-1/2 bg-white/10 blur-2xl"
                  animate={{ x: ['-60%', '120%'] }}
                  transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
