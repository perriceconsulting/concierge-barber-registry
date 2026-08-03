/**
 * Barber dashboard Help drawer content. Rendered inside <HelpDrawer /> from
 * the dashboard sidebar. Single source of truth for barber-facing concept
 * documentation — verification flow, setup fee, license submission, trial
 * billing, suspensions, etc.
 *
 * Each section has an `id="help-section-<name>"` so inline `?` icons next
 * to ambiguous controls can deep-link via `<HelpDrawer initialSection="...">`.
 */
export function BarberHelpContent() {
  return (
    <>
      <section id="help-section-getting-started">
        <h3 className="font-serif text-lg font-semibold text-heading mb-2">
          Getting started
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Three steps to go live in the directory:
        </p>
        <ol className="mt-3 space-y-2 text-muted-foreground list-decimal list-inside">
          <li>
            Fill out your <strong className="text-foreground">Profile</strong> —
            name, location, services, license info. Save to unlock the rest.
          </li>
          <li>
            Pay the <strong className="text-foreground">verification setup fee</strong>{' '}
            and upload a clear photo or PDF of your professional barber license.
          </li>
          <li>
            Click <strong className="text-foreground">Submit for Review</strong>.
            Our team verifies within 24–48 hours and you get an email when
            you're approved.
          </li>
        </ol>
      </section>

      <section id="help-section-setup-fee">
        <h3 className="font-serif text-lg font-semibold text-heading mb-2">
          The setup fee
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          A one-time application fee that covers manual license verification,
          background check, and your digital credential. Paying it is the gate
          before you can submit for review.
        </p>
        <ul className="mt-3 space-y-1 list-disc list-inside text-muted-foreground">
          <li>
            <strong className="text-foreground">$49 intro</strong> — first 10
            barbers to pay. Limited slots; price shown at checkout.
          </li>
          <li>
            <strong className="text-foreground">$99 standard</strong> — once intro
            slots are full.
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground leading-relaxed italic">
          Already paid? Your dashboard shows a green "✓ Paid" card with the
          amount and date. Founding Members are exempt — see below.
        </p>
      </section>

      <section id="help-section-trial">
        <h3 className="font-serif text-lg font-semibold text-heading mb-2">
          The 30-day trial
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          When an admin approves your verification, you automatically get a
          30-day free trial of the <strong className="text-foreground">Verified
          Member</strong> subscription — full access to Passport, referral
          network, and your verified badge. Your card on file is{' '}
          <em>not</em> charged during the trial.
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          On day 25, you'll get an email reminding you the trial is ending. On
          day 30, the recurring subscription begins automatically — no action
          needed unless you want to cancel. You can manage or cancel anytime
          from <strong className="text-foreground">Subscription</strong>.
        </p>
      </section>

      <section id="help-section-founding">
        <h3 className="font-serif text-lg font-semibold text-heading mb-2">
          Founding Member
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          A status reserved for the first 10 barbers we hand-select. If an admin
          flags you as a Founding Member, you'll see a gold badge on your
          profile and:
        </p>
        <ul className="mt-3 space-y-1 list-disc list-inside text-muted-foreground">
          <li>your verification setup fee is waived</li>
          <li>your recurring Verified Member subscription is waived — forever</li>
          <li>you keep the Founding Member badge as a permanent recognition</li>
        </ul>
        <p className="mt-3 text-muted-foreground italic">
          Founding Member status is admin-granted, not requestable. If you've
          been invited as one, you'll know.
        </p>
      </section>

      <section id="help-section-license-doc">
        <h3 className="font-serif text-lg font-semibold text-heading mb-2">
          License document
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          A clear photo or PDF of your professional barber license, max 5MB.
          Used for verification only — never shown publicly. After your license
          is approved, you can't replace it without contacting an admin (this
          prevents accidental swaps after verification).
        </p>
      </section>

      <section id="help-section-status">
        <h3 className="font-serif text-lg font-semibold text-heading mb-2">
          Profile status
        </h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">pending</strong> — default. Either
            you haven't submitted yet, or you have and we're reviewing.
          </li>
          <li>
            <strong className="text-foreground">approved</strong> — you're live
            in the directory with a verified badge. Clients can find and contact you.
          </li>
          <li>
            <strong className="text-foreground">rejected</strong> — your license
            couldn't be verified. Check the email we sent for the reason; fix
            and resubmit.
          </li>
          <li>
            <strong className="text-foreground">suspended</strong> — admin
            removed you for a policy reason. You can file an appeal from the
            Appeal page in your sidebar (if your suspension is appealable).
          </li>
          <li>
            <strong className="text-foreground">expired</strong> — your license
            expiration date has passed. Update your license info and re-submit
            for verification.
          </li>
        </ul>
      </section>

      <section id="help-section-hide-vacation">
        <h3 className="font-serif text-lg font-semibold text-heading mb-2">
          Hide vs. vacation
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Vacation mode</strong> (in
          Settings) tells clients you're temporarily unavailable but keeps your
          profile listed with a vacation indicator. Use for short breaks.
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Hidden</strong> is a stronger
          state controlled by an admin — your profile is fully removed from
          search results. Usually applied during a dispute or under-investigation
          period.
        </p>
      </section>

      <section id="help-section-shortcuts">
        <h3 className="font-serif text-lg font-semibold text-heading mb-2">
          Keyboard
        </h3>
        <ul className="space-y-1 text-muted-foreground">
          <li>
            <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded border border-border">
              ?
            </kbd>{' '}
            — open / close this drawer
          </li>
          <li>
            <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded border border-border">
              Esc
            </kbd>{' '}
            — close this drawer
          </li>
        </ul>
      </section>
    </>
  );
}
