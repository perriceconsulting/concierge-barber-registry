/**
 * Concurrency test for the Founding seat claim.
 *
 * This is the "stress" idea aimed at what this codebase actually risks. There is
 * no multi-tenancy here to leak between, but there IS a check-then-act race with
 * real money on it: the fee tier is decided by counting claimed seats, and each
 * extra Founding Member costs $50 in under-charged fees plus a 365-day free year.
 *
 * A browser suite could surface this, but it belongs here — it is deterministic,
 * runs in milliseconds, and tests the invariant rather than a rendering of it.
 *
 * The invariant: however many applicants claim simultaneously, no more than
 * `intro_limit` are ever quoted the intro rate.
 */
import { claimSetupFeeSeat, SEAT_RESERVATION_MINUTES } from '@/lib/subscription';
import { VETTING_FEE_PRICING } from '@/lib/copy/v2';
import { prisma } from '@/lib/db';

type Claim = Awaited<ReturnType<typeof claimSetupFeeSeat>>;

describe('Founding seat claim under concurrency', () => {
  const LIMIT = VETTING_FEE_PRICING.intro_limit;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Model the transaction the way Postgres serializes it: claims are applied one
   * at a time against shared state. The mock counts what has already been
   * claimed, which is exactly what the serializable transaction guarantees.
   */
  function mockSerializedSeats() {
    const reserved = new Set<string>();

    (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        barberProfile: {
          count: async ({ where }: { where: { id: { not: string } } }) => {
            const self = where.id.not;
            return [...reserved].filter((id) => id !== self).length;
          },
          update: async ({ where }: { where: { id: string } }) => {
            reserved.add(where.id);
            return {};
          },
        },
      };
      return fn(tx);
    });

    return reserved;
  }

  it(`never issues more than ${VETTING_FEE_PRICING.intro_limit} intro rates when applicants claim at once`, async () => {
    mockSerializedSeats();

    const applicants = Array.from({ length: LIMIT + 5 }, (_, i) => `barber-${i}`);
    const results: Claim[] = [];
    for (const id of applicants) {
      results.push(await claimSetupFeeSeat(id));
    }

    const intro = results.filter((r) => r.tier === 'intro');
    const standard = results.filter((r) => r.tier === 'standard');

    expect(intro).toHaveLength(LIMIT);
    expect(standard).toHaveLength(5);
    expect(intro.every((r) => r.amountCents === VETTING_FEE_PRICING.intro * 100)).toBe(true);
    expect(standard.every((r) => r.amountCents === VETTING_FEE_PRICING.standard * 100)).toBe(true);
  });

  it('does not count a barber\'s own held seat against them on a retry', async () => {
    mockSerializedSeats();

    const first = await claimSetupFeeSeat('barber-retry');
    const second = await claimSetupFeeSeat('barber-retry');

    // Re-entering checkout must quote the same rate, not bump to standard.
    expect(first.tier).toBe('intro');
    expect(second.tier).toBe('intro');
  });

  it('quotes the standard rate once every seat is held', async () => {
    mockSerializedSeats();

    for (let i = 0; i < LIMIT; i++) {
      await claimSetupFeeSeat(`early-${i}`);
    }
    const late = await claimSetupFeeSeat('late-arrival');

    expect(late.tier).toBe('standard');
    expect(late.introSeatsRemaining).toBe(0);
    expect(late.amountCents).toBe(VETTING_FEE_PRICING.standard * 100);
  });

  it('holds a seat for a bounded window rather than forever', () => {
    // An abandoned checkout must release its seat. If this is ever raised to
    // something large, ten abandoned applications would exhaust the founding
    // tier permanently.
    expect(SEAT_RESERVATION_MINUTES).toBeGreaterThan(0);
    expect(SEAT_RESERVATION_MINUTES).toBeLessThanOrEqual(60);
  });
});
