/**
 * Founding-seat audit.
 *
 * The intro-vs-standard setup fee is decided by counting rows, not by anything
 * in Stripe (see CLAUDE.md — "Amounts do not all live in Stripe"). That makes
 * the seat count a number nobody can see without asking the database, which is
 * a poor property for something that decides what the next applicant is charged
 * and whether they get a free year.
 *
 * This is the reconciler for that: it prints what `claimSetupFeeSeat` would
 * currently compute, and flags the two ways the count goes wrong in practice —
 * leftover Playwright fixtures (which set setupFeePaidAt) and stale
 * reservations from abandoned checkouts.
 *
 *   npm run audit:seats
 */
import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';
import { VETTING_FEE_PRICING } from '../src/lib/copy/v2';
import { SEAT_RESERVATION_MINUTES } from '../src/lib/subscription';

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

/** Matches the fixture prefix in e2e/helpers/test-users.ts. */
const TEST_EMAIL_PREFIX = 'pw-test_';

async function main() {
  const cutoff = new Date(Date.now() - SEAT_RESERVATION_MINUTES * 60_000);

  const total = await prisma.barberProfile.count();

  const paid = await prisma.barberProfile.findMany({
    where: { setupFeePaidAt: { not: null } },
    select: {
      setupFeePaidAt: true,
      setupFeeAmountCents: true,
      foundingMember: true,
      user: { select: { email: true } },
    },
    orderBy: { setupFeePaidAt: 'asc' },
  });

  const held = await prisma.barberProfile.findMany({
    where: { setupFeeReservedAt: { gt: cutoff }, setupFeePaidAt: null },
    select: { setupFeeReservedAt: true, user: { select: { email: true } } },
  });

  const foundingFlagged = await prisma.barberProfile.count({
    where: { foundingMember: true },
  });

  const testLeftovers = paid.filter((p) => p.user.email.startsWith(TEST_EMAIL_PREFIX));
  const taken = paid.length + held.length;
  const remaining = Math.max(0, VETTING_FEE_PRICING.intro_limit - taken);

  console.log(`\nbarber profiles          : ${total}`);
  console.log(`seats paid               : ${paid.length}`);
  console.log(`seats held (unpaid, <${SEAT_RESERVATION_MINUTES}m) : ${held.length}`);
  console.log(`foundingMember flagged   : ${foundingFlagged}`);
  console.log(
    `\nintro seats remaining    : ${remaining} of ${VETTING_FEE_PRICING.intro_limit}`,
  );
  console.log(
    `next applicant pays      : $${remaining > 0 ? VETTING_FEE_PRICING.intro : VETTING_FEE_PRICING.standard}` +
      `${remaining > 0 ? '  + a free first year' : ''}`,
  );

  if (paid.length) {
    console.log('\npaid seats:');
    for (const p of paid) {
      const flag = p.user.email.startsWith(TEST_EMAIL_PREFIX) ? '   <-- TEST FIXTURE' : '';
      console.log(
        `  ${p.setupFeePaidAt?.toISOString().slice(0, 10)}  ` +
          `$${((p.setupFeeAmountCents ?? 0) / 100).toFixed(2).padStart(6)}  ` +
          `founding=${String(p.foundingMember).padEnd(5)}  ${p.user.email}${flag}`,
      );
    }
  }

  if (held.length) {
    console.log('\nheld seats (checkout started, not completed):');
    for (const h of held) {
      console.log(`  ${h.setupFeeReservedAt?.toISOString()}  ${h.user.email}`);
    }
  }

  // A leftover fixture silently charges the next real applicant $99 instead of
  // $49 and denies them a free year. Loud on purpose, and non-zero so this can
  // gate a release.
  if (testLeftovers.length) {
    console.error(
      `\nFAIL  ${testLeftovers.length} Playwright fixture(s) are holding paid founding seats.` +
        `\n      They are consuming real inventory. Run the e2e cleanup, or delete users` +
        `\n      matching ${TEST_EMAIL_PREFIX}*@cbr.test.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log('\nOK  no test fixtures are consuming founding seats.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
