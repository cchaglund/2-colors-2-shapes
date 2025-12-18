import { useState } from 'react';

interface OnboardingModalProps {
  onComplete: (nickname: string) => Promise<{ success: boolean; error?: string }>;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validateNickname = (value: string): string | null => {
    if (value.length < 1) return 'Nickname is required';
    if (value.length > 15) return 'Nickname must be 15 characters or less';
    if (!/^[a-zA-Z0-9]+$/.test(value)) return 'Only letters and numbers allowed';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await onComplete(nickname);
    if (!result.success) {
      setError(result.error || 'Something went wrong');
    }
    setSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    if (error) {
      setError(validateNickname(value));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          Welcome!
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Choose a nickname to display in the gallery. This will be visible to other users.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
            >
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={handleChange}
              placeholder="Enter your nickname"
              maxLength={15}
              autoFocus
              className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-red-500">{error || ''}</span>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {nickname.length}/15
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !nickname}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
