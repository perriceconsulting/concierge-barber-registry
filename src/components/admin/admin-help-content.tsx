/**
 * Admin Help drawer content. Rendered inside <HelpDrawer /> from the admin
 * sidebar. Single source of truth for admin concept documentation —
 * verification, suspension, Founding Member, paywall, tiers, etc.
 *
 * Each section has an `id="help-section-<name>"` so inline `?` icons next
 * to ambiguous controls can deep-link via `<HelpDrawer initialSection="...">`.
 */
export function AdminHelpContent() {
  return (
    <>
      <section id="help-section-verification">
        <h3 className="font-serif text-lg font-semibold text-primary mb-2">
          Verification flow
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Every barber goes through a four-status lifecycle:
        </p>
        <ul className="mt-3 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">pending</strong> — default for new
            profiles. Waiting for admin to review the uploaded license. The barber
            is hidden from public search.
          </li>
          <li>
            <strong className="text-foreground">approved</strong> — the barber is
            live in the directory with a verified badge. A 30-day trial of the
            Verified Member subscription is auto-created on Stripe (skipped for
            Founding Members).
          </li>
          <li>
            <strong className="text-foreground">rejected</strong> — license could
            not be verified. The barber is notified by email and can resubmit
            after correcting the issue.
          </li>
          <li>
            <strong className="text-foreground">suspended</strong> — admin
            intervened on an already-approved barber. Profile is hidden, Stripe
            subscription is canceled with proration, and they may file an appeal
            if the suspension reason is appealable.
          </li>
          <li>
            <strong className="text-foreground">expired</strong> — license
            expiration date has passed (auto-flipped by the daily cron). Admin
            must re-verify the renewal.
          </li>
        </ul>
      </section>

      <section id="help-section-suspend-vs-reject">
        <h3 className="font-serif text-lg font-semibold text-primary mb-2">
          Suspend vs. reject
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Reject</strong> is for the initial
          verification step — the license check failed and they were never live.
          No subscription exists yet. The barber gets an email with the reason and
          can fix and resubmit.
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Suspend</strong> is for an already
          approved, paying barber where something has gone wrong (fraud, abuse,
          license revocation, etc.). It hides them from public view, cancels their
          Stripe subscription with a prorated refund, and triggers the appeals
          flow if the reason is appealable.
        </p>
        <p className="mt-3 text-muted-foreground italic">
          Rule of thumb: never approved → reject. Was approved, now problematic →
          suspend.
        </p>
      </section>

      <section id="help-section-founding">
        <h3 className="font-serif text-lg font-semibold text-primary mb-2">
          Founding Member
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          An admin-only flag reserved for the first 10 elite barbers. It is a
          billing classification, not a verification status — granting it does
          <em> not</em> approve the barber.
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">Granting Founding Member:</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
          <li>waives the one-time setup fee (admin can approve without payment)</li>
          <li>
            waives the recurring Verified Member subscription forever
            (<code className="text-xs bg-muted px-1 rounded">subscriptionWaivedUntil = 2099-12-31</code>)
          </li>
          <li>displays a gold "Founding Member" badge on the barber's row</li>
        </ul>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Hard cap of <strong className="text-foreground">10 active seats</strong>{' '}
          — the API rejects further grants until one is revoked. Revoking
          re-enables the setup-fee gate and the recurring sub will resume on the
          next billing cycle.
        </p>
      </section>

      <section id="help-section-setup-fee">
        <h3 className="font-serif text-lg font-semibold text-primary mb-2">
          Verification setup fee
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          A one-time application fee charged via Stripe Checkout before the barber
          can submit for verification:
        </p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
          <li>
            <strong className="text-foreground">$49 intro</strong> — first 10
            barbers to pay, regardless of Founding Member status. Server resolves
            the price automatically based on a paid-count check.
          </li>
          <li>
            <strong className="text-foreground">$99 standard</strong> — applies
            once the 10 intro slots have been used.
          </li>
          <li>
            Founding Members are <em>exempt</em> from the setup fee (admin can
            approve them without payment).
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          When the Stripe webhook receives{' '}
          <code className="text-xs bg-muted px-1 rounded">checkout.session.completed</code>{' '}
          for the setup-fee session, the handler writes{' '}
          <code className="text-xs bg-muted px-1 rounded">setupFeePaidAt</code> to
          the BarberProfile row. The admin Approve button then accepts the
          barber. Without setup fee paid <em>and</em> not Founding Member, Approve
          throws <code className="text-xs bg-muted px-1 rounded">SETUP_FEE_UNPAID</code>.
        </p>
      </section>

      <section id="help-section-tiers">
        <h3 className="font-serif text-lg font-semibold text-primary mb-2">
          Subscription tiers
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          v2 ships with a <strong className="text-foreground">single flat
          "Verified Member" subscription</strong> that activates after the 30-day
          post-approval trial. The legacy <code className="text-xs bg-muted px-1 rounded">starter</code>,
          {' '}<code className="text-xs bg-muted px-1 rounded">professional</code>, and{' '}
          <code className="text-xs bg-muted px-1 rounded">elite</code> tiers
          remain in the enum so existing subscribers keep their plans until the v2
          cutover decision is finalized. New approvals always go to{' '}
          <code className="text-xs bg-muted px-1 rounded">verified</code>.
        </p>
      </section>

      <section id="help-section-hide-show">
        <h3 className="font-serif text-lg font-semibold text-primary mb-2">
          Hide / Show
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Toggles{' '}
          <code className="text-xs bg-muted px-1 rounded">isHidden</code> on an
          approved barber. They stay verified and continue to be billed, but are
          removed from public search results. Use for temporary takedowns
          (vacation, dispute under investigation, etc.) where suspension is too
          heavy a hammer.
        </p>
      </section>

      <section id="help-section-roles">
        <h3 className="font-serif text-lg font-semibold text-primary mb-2">
          User roles
        </h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">client</strong> — default. Can browse,
            contact barbers, leave reviews, and manage their Grooming Passport.
          </li>
          <li>
            <strong className="text-foreground">barber</strong> — manages a single
            BarberProfile, services, portfolio, and subscription.
          </li>
          <li>
            <strong className="text-foreground">admin</strong> — full access to
            this admin panel and the View-as switcher (impersonate barber/client
            surfaces without changing your real role).
          </li>
          <li>
            <strong className="text-foreground">hnwi</strong> (coming in v2 W7) —
            invitation-only access to the Black Label tier and gated executive
            surfaces.
          </li>
        </ul>
      </section>

      <section id="help-section-audit">
        <h3 className="font-serif text-lg font-semibold text-primary mb-2">
          Audit log
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          Every admin action (approve, reject, suspend, grant/revoke Founding,
          etc.) writes a row to the audit log with actor, target, timestamp, IP,
          and contextual details. Browse the full log under{' '}
          <strong className="text-foreground">Audit Log</strong> in the sidebar.
          Use for incident review and compliance.
        </p>
      </section>

      <section id="help-section-shortcuts">
        <h3 className="font-serif text-lg font-semibold text-primary mb-2">
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
