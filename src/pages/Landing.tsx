import { Link } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Sparkles, HeartHandshake, Filter, Wind, LifeBuoy, EyeOff, ShieldCheck, PenLine, MessagesSquare, ArrowRight } from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

const STEPS = [
  { icon: PenLine, title: 'Say it', body: 'Write what you can\'t say out loud. No name, no photo, no followers to impress.' },
  { icon: Sparkles, title: 'We read the vibe', body: 'AI picks up what you\'re feeling, like loneliness, exam stress or heartbreak, and tags it for you to adjust.' },
  { icon: MessagesSquare, title: 'Someone feels it too', body: 'If you want, we find a person going through the same thing. They say yes, and you both get a private chat.' },
];

const FEATURES = [
  { icon: HeartHandshake, title: 'Vibe Matcher', body: 'Paired by what you feel, not who you are. Both people choose to talk.' },
  { icon: Filter, title: 'Feed by feeling', body: 'Pick the vibes you relate to and see posts from people in the same place.' },
  { icon: EyeOff, title: 'Anonymous by design', body: 'Chats use a fresh nickname for every person. No profiles are shared.' },
  { icon: Wind, title: 'Breathe', body: 'A guided breathing orb for the moments when your chest gets tight.' },
  { icon: LifeBuoy, title: 'Help, one tap away', body: 'Real helplines and a grounding exercise, available even when signed out.' },
  { icon: ShieldCheck, title: 'Safety first', body: 'Crisis posts get help, never strangers. Leave or block anytime. Requests are rate-limited.' },
];

function FloatingCard({ tag, title, className, delay }: { tag: string; title: string; className: string; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`absolute w-60 card-soft rounded-2xl p-4 backdrop-blur-md ${className}`}
      initial={{ opacity: 0, y: 30 }}
      animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -10, 0] }}
      transition={reduce ? { delay } : { opacity: { delay, duration: 0.8 }, y: { delay, duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
    >
      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/20 text-primary-50">#{tag}</span>
      <p className="text-sm text-white mt-2 leading-snug">{title}</p>
    </motion.div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-ink text-white overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_500px_at_15%_-5%,rgba(157,124,255,0.22),transparent_60%),radial-gradient(700px_400px_at_100%_30%,rgba(255,164,140,0.12),transparent_60%)]" />

      <header className="relative z-10 max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <span className="font-display text-2xl text-aurora font-semibold">Unfilterd</span>
        <nav className="flex items-center gap-2">
          <Link to="/help" className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-400 hover:text-white">Get help now</Link>
          <Link to="/login" className="px-3 py-2 text-sm text-gray-300 hover:text-white">Sign in</Link>
          <Link to="/register" className="px-4 py-2 rounded-full bg-white text-ink text-sm font-semibold">Join free</Link>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-5 pt-12 sm:pt-20 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={{ show: { transition: { staggerChildren: 0.12 } } }} initial="hidden" animate="show">
            <motion.p variants={fadeUp} className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 text-primary-50">
              <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" /> Anonymous · AI-matched · Kind by design
            </motion.p>
            <motion.h1 variants={fadeUp} className="font-display text-5xl sm:text-7xl leading-[1.02] mt-6 tracking-tight">
              Say what you can't say <span className="text-aurora">anywhere else.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-gray-300 mt-6 max-w-xl">
              Unfilterd is a quiet place to let it out. We read the feeling behind your words, find someone going through the same thing, and open a private, anonymous conversation, if you both want it.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mt-8">
              <Link to="/register" className="group px-6 py-3.5 rounded-full bg-white text-ink font-semibold flex items-center gap-2 shadow-[0_15px_50px_-15px_rgba(157,124,255,0.8)]">
                Start writing <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/breathe" className="px-6 py-3.5 rounded-full border border-white/15 text-white hover:bg-white/5 flex items-center gap-2">
                <Wind className="w-4 h-4" /> Just breathe for a minute
              </Link>
            </motion.div>
          </motion.div>

          <div className="relative h-[420px] hidden sm:block" aria-hidden="true">
            <div className="absolute inset-0 m-auto w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(157,124,255,0.35),transparent_70%)] blur-2xl" />
            <FloatingCard tag="Loneliness" title="I eat alone every night in the hostel and pretend I'm fine." className="left-0 top-6" delay={0.3} />
            <FloatingCard tag="Loneliness" title="Everyone has their group. I just… don't." className="right-0 bottom-10" delay={0.6} />
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-full bg-secondary text-ink text-sm font-semibold flex items-center gap-2 shadow-[0_0_40px_rgba(255,164,140,0.6)]"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: [1, 1.06, 1] }}
              transition={{ opacity: { delay: 1.1 }, scale: { delay: 1.1, duration: 2.4, repeat: Infinity } }}
            >
              <HeartHandshake className="w-4 h-4" /> You both feel this
            </motion.div>
            <FloatingCard tag="Exam stress" title="Boards in 3 weeks and I can't focus at all." className="right-6 top-0 opacity-70 scale-90" delay={0.9} />
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 py-20">
          <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="font-display text-4xl sm:text-5xl text-center">
            How it works
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-5 mt-12">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="card-soft rounded-3xl p-6"
              >
                <span className="text-xs text-gray-500">0{i + 1}</span>
                <s.icon className="w-7 h-7 text-primary-50 mt-3" />
                <h3 className="font-display text-2xl mt-4">{s.title}</h3>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08 }}
                whileHover={{ y: -4 }}
                className="rounded-3xl p-6 border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-white" />
                </span>
                <h3 className="text-lg font-semibold mt-4">{f.title}</h3>
                <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-5 py-24 text-center">
          <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="font-display text-4xl sm:text-6xl leading-tight">
            Somebody out there is feeling <span className="text-aurora">exactly this</span> right now.
          </motion.h2>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <Link to="/register" className="inline-flex mt-10 px-8 py-4 rounded-full bg-white text-ink font-semibold items-center gap-2">
              Find them <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Unfilterd. Peer support, not a replacement for professional care.</span>
          <span className="flex gap-4">
            <Link to="/help" className="hover:text-white">Crisis help</Link>
            <Link to="/breathe" className="hover:text-white">Breathe</Link>
            <Link to="/login" className="hover:text-white">Sign in</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
