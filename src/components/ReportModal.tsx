import { useState } from 'react';
import type { ReportReason } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Modal } from './Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'abuse', label: 'Abuse' },
  { value: 'hate_speech', label: 'Hate Speech' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'other', label: 'Other' },
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment';
  targetId: string;
}

export function ReportModal({ isOpen, onClose, targetType, targetId }: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason>('spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!user) return;
    setError('');
    setSubmitting(true);
    const insert: Record<string, unknown> = {
      reporter_id: user.id,
      reason,
      description,
    };
    if (targetType === 'post') insert.post_id = targetId;
    else insert.comment_id = targetId;

    const { error: insertError } = await supabase.from('reports').insert(insert);
    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSubmitted(true);
  };

  const handleClose = () => {
    setReason('spam');
    setDescription('');
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Report Content" size="sm">
      {submitted ? (
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-success" />
          </div>
          <p className="text-white font-medium">Report Submitted</p>
          <p className="text-sm text-gray-400">We'll review this content and take appropriate action.</p>
          <button onClick={handleClose} className="px-4 py-2 bg-primary hover:bg-primary-200 rounded-lg text-white text-sm font-medium transition-colors">
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Why are you reporting this {targetType}?</p>
          <div className="space-y-2">
            {REASONS.map(r => (
              <label key={r.value} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm text-gray-300">{r.label}</span>
              </label>
            ))}
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Additional details (optional)"
            className="w-full bg-surface-50 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 border border-white/5 focus:border-primary focus:outline-none resize-none h-20"
          />
          {error && (
            <p className="text-xs text-danger-50">{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-2.5 bg-danger hover:bg-danger-100 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Report
          </button>
        </div>
      )}
    </Modal>
  );
}
