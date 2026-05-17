'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { secureFetch } from '@/lib/csrf-client';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export function RequestAccessForm() {
  const [state, setState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      fullName: String(formData.get('fullName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      city: String(formData.get('city') ?? '').trim(),
      source: String(formData.get('source') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim(),
    };

    if (!payload.fullName || !payload.email) {
      setState('error');
      setErrorMessage('Name and email are required.');
      return;
    }

    try {
      const res = await secureFetch('/api/black-label/request-access', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message ?? 'Submission failed. Please try again.');
      }

      setState('success');
      form.reset();
    } catch (err) {
      setState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (state === 'success') {
    return (
      <div className="text-center py-6">
        <div className="font-serif text-2xl font-bold text-primary mb-3">
          Request Received
        </div>
        <p className="text-muted-foreground">
          A team member will be in touch within 48 hours via the email you provided.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
          Full Name <span className="text-cbr-gold">*</span>
        </label>
        <Input id="fullName" name="fullName" required autoComplete="name" />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          Email <span className="text-cbr-gold">*</span>
        </label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
          Primary City
        </label>
        <Input id="city" name="city" autoComplete="address-level2" />
      </div>

      <div>
        <label htmlFor="source" className="block text-sm font-medium text-foreground mb-2">
          How did you hear about Black Label?
        </label>
        <Input id="source" name="source" placeholder="Referral / search / press / other" />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">
          Notes <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Anything we should know about your situation, schedule, or specific needs."
        />
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}

      <div>
        <Button type="submit" size="lg" className="w-full" disabled={state === 'submitting'}>
          {state === 'submitting' ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </form>
  );
}
