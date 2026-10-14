import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, MessageCircle, Globe, Wind, Check } from 'lucide-react';

type Line = { name: string; detail: string; tel?: string; whatsapp?: string; url?: string };

const REGIONS: { region: string; lines: Line[] }[] = [
  {
    region: 'India',
    lines: [
      { name: 'Tele-MANAS', detail: 'Government mental health line · free · 24x7 · many languages', tel: '14416' },
      { name: 'Vandrevala Foundation', detail: 'Call or WhatsApp · 24x7', tel: '+919999666555', whatsapp: '919999666555' },
      { name: 'iCall (TISS)', detail: 'Trained counsellors · Mon to Sat, 10am to 8pm', tel: '+919152987821' },
      { name: 'Emergency', detail: 'Police, ambulance, fire', tel: '112' },
    ],
  },
  {
    region: 'Elsewhere',
    lines: [
      { name: '988 Lifeline', detail: 'US & Canada · call or text · 24x7', tel: '988' },
      { name: 'Samaritans', detail: 'UK & Ireland · free · 24x7', tel: '116123' },
      { name: 'Find A Helpline', detail: 'Free, confidential lines in 130+ countries', url: 'https://findahelpline.com' },
    ],
  },
];

const GROUNDING = [
  { count: 5, sense: 'things you can see' },
  { count: 4, sense: 'things you can feel or touch' },
  { count: 3, sense: 'things you can hear' },
  { count: 2, sense: 'things you can smell' },
  { count: 1, sense: 'thing you can taste' },
];

export function HelpPage() {
  const [step, setStep] = useState(0);
  const done = step >= GROUNDING.length;

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-28">
        <Link to="/" className="inline-flex p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-4xl text-white mt-4">You don't have to carry this alone.</h1>
          <p className="text-gray-400 mt-3">
            If you might hurt yourself or you're in danger, please call one of these now. They're real people, they're free, and they won't judge you.
          </p>
        </motion.div>

        <div className="mt-8 space-y-8">
          {REGIONS.map((group, gi) => (
            <section key={group.region}>
              <h2 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">{group.region}</h2>
              <div className="space-y-2.5">
                {group.lines.map((line, i) => (
                  <motion.div
                    key={line.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + gi * 0.15 + i * 0.05 }}
                    className="card-soft rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{line.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{line.detail}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {line.whatsapp && (
                        <a href={`https://wa.me/${line.whatsapp}`} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-mint/15 text-mint" aria-label={`WhatsApp ${line.name}`}>
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      {line.tel && (
                        <a href={`tel:${line.tel}`} className="px-3.5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium flex items-center gap-1.5" aria-label={`Call ${line.name}`}>
                          <Phone className="w-4 h-4" /> Call
                        </a>
                      )}
                      {line.url && (
                        <a href={line.url} target="_blank" rel="noreferrer" className="px-3.5 py-2.5 rounded-xl bg-white/10 text-white text-sm flex items-center gap-1.5">
                          <Globe className="w-4 h-4" /> Open
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10 card-soft rounded-3xl p-6">
          <h2 className="font-display text-2xl text-white">Ground yourself: 5-4-3-2-1</h2>
          <p className="text-sm text-gray-400 mt-1">When everything feels too loud, bring yourself back to this moment. Name each one, slowly.</p>
          <div className="mt-5 min-h-[96px] flex items-center">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-mint/20 text-mint flex items-center justify-center"><Check className="w-5 h-5" /></span>
                  <p className="text-white">You're here, right now. That took courage.</p>
                </motion.div>
              ) : (
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-4">
                  <span className="font-display text-6xl text-aurora">{GROUNDING[step].count}</span>
                  <p className="text-lg text-white">{GROUNDING[step].sense}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setStep(s => (done ? 0 : s + 1))}
              className="px-5 py-2.5 rounded-full bg-white text-ink text-sm font-semibold"
            >
              {done ? 'Start again' : step === GROUNDING.length - 1 ? 'Finish' : 'Next'}
            </button>
            <div className="flex gap-1.5" aria-hidden="true">
              {GROUNDING.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i < step || done ? 'w-5 bg-primary' : i === step ? 'w-5 bg-white/60' : 'w-1.5 bg-white/15'}`} />
              ))}
            </div>
          </div>
        </section>

        <Link to="/breathe" className="mt-4 card-soft rounded-2xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
          <span className="w-10 h-10 rounded-xl bg-primary/20 text-primary-50 flex items-center justify-center"><Wind className="w-5 h-5" /></span>
          <span className="flex-1">
            <span className="block text-white font-medium">Breathe with me</span>
            <span className="block text-xs text-gray-400">A guided 1 to 5 minute exercise to slow things down</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
