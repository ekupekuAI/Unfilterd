import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HeartHandshake, Phone, Wind, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { LangStyle } from '../../lib/vibe';
import { getCheckInCopy, HELPLINES } from './checkInCopy';

type Answer = 'joking' | 'overwhelmed' | 'not_okay';
interface CheckIn {
  id: string;
  risk: 'possible' | 'high';
  dismiss_count: number;
  lang_style: LangStyle;
}

/** Fired by the composer after a flagged post is published. */
export const CHECKIN_EVENT = 'unfilterd:checkin';

/**
 * Private check-in for the author of a flagged post. Answers never change the post;
 * they only choose which support the person sees. Two dismissals close it for good.
 */
export function CheckInHost() {
  const { user } = useAuth();
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('vibe_checkins')
      .select('id, risk, dismiss_count, lang_style')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .lt('dismiss_count', 2)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setAnswer(null);
    setCheckIn((data as CheckIn | null) ?? null);
  }, [user]);

  useEffect(() => {
    void load();
    const onVisible = () => { if (document.visibilityState === 'visible') void load(); };
    window.addEventListener(CHECKIN_EVENT, load);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(CHECKIN_EVENT, load);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  // keyboard and screen-reader users: focus moves in, Tab stays inside, focus returns on close
  const openId = checkIn?.id;
  useEffect(() => {
    if (!openId) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    headingRef.current?.focus();
    return () => returnFocusRef.current?.focus?.();
  }, [openId]);

  if (!checkIn) return null;
  const copy = getCheckInCopy(checkIn.lang_style);
  const showHelp = checkIn.risk === 'high' || answer === 'not_okay';

  const respond = async (choice: Answer) => {
    setAnswer(choice);
    await supabase.from('vibe_checkins')
      .update({ status: choice, answered_at: new Date().toISOString() })
      .eq('id', checkIn.id);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      void dismiss();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const dismiss = async () => {
    const next = checkIn.dismiss_count + 1;
    const answered = answer !== null;
    setCheckIn(null);
    if (!answered) {
      await supabase.from('vibe_checkins')
        .update({ dismiss_count: next, ...(next >= 2 ? { status: 'dismissed' } : {}) })
        .eq('id', checkIn.id);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={checkIn.id}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 px-4 pb-6 sm:pb-0"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        role="dialog" aria-modal="true" aria-labelledby="checkin-title"
        onKeyDown={onKeyDown}
      >
        <motion.div
          ref={panelRef}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-[#1A1530] to-[#0E0B1C] p-6 shadow-2xl"
          initial={reduceMotion ? false : { y: 40, scale: 0.97 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-secondary">
              <HeartHandshake className="w-5 h-5" />
              <h2 id="checkin-title" ref={headingRef} tabIndex={-1} className="font-display text-xl text-white outline-none">
                {checkIn.risk === 'high' ? copy.highTitle : copy.title}
              </h2>
            </div>
            <button onClick={dismiss} aria-label={copy.close} className="p-1 rounded-lg text-gray-400 hover:bg-white/5">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">{copy.privateNote}</p>

          {checkIn.risk === 'possible' && answer === null && (
            <>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-200">{copy.prompt}</p>
              <div className="mt-5 grid gap-2">
                {(['joking', 'overwhelmed', 'not_okay'] as const).map(choice => (
                  <button key={choice} onClick={() => respond(choice)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors">
                    {copy.options[choice]}
                  </button>
                ))}
              </div>
              <button onClick={dismiss} className="mt-3 w-full text-center text-xs text-gray-500 hover:text-gray-300">{copy.dismiss}</button>
            </>
          )}

          {answer && answer !== 'not_okay' && (
            <>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-200">{copy.responses[answer]}</p>
              <Link to="/breathe" onClick={() => setCheckIn(null)}
                className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-white">
                <Wind className="w-4 h-4" /> {copy.breathe}
              </Link>
            </>
          )}

          {showHelp && (
            <>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-200">
                {checkIn.risk === 'high' ? copy.highBody : copy.responses.not_okay}
              </p>
              <div className="mt-4 grid gap-2">
                {HELPLINES.map(line => (
                  <a key={line.tel} href={`tel:${line.tel}`}
                    className="flex items-center gap-3 rounded-2xl bg-secondary/15 px-4 py-3 text-white hover:bg-secondary/25 transition-colors">
                    <Phone className="w-4 h-4 text-secondary shrink-0" />
                    <span className="text-sm"><b className="font-medium">{line.name}</b> <span className="text-gray-300">· {line.detail}</span></span>
                  </a>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-400">{copy.trustedPerson}</p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
