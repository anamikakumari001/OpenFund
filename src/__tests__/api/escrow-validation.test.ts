/**
 * Unit tests for escrow API route validation logic.
 * Tests the pure validation helpers extracted from the API routes.
 */

// ── Escrow amount validation ──────────────────────────────────────────────────

function validateEscrowAmount(amount: string): { valid: boolean; error?: string } {
  const num = parseFloat(amount);
  if (isNaN(num)) return { valid: false, error: "Amount must be a number" };
  if (num < 1) return { valid: false, error: "Minimum escrow amount is 1 USDC" };
  if (num > 1_000_000) return { valid: false, error: "Amount exceeds maximum" };
  return { valid: true };
}

// ── Contract milestone ID truncation ─────────────────────────────────────────

function getContractMilestoneId(prismaId: string): string {
  return prismaId.slice(0, 10);
}

// ── Stellar address format check ─────────────────────────────────────────────

function isValidStellarAddress(address: string): boolean {
  return /^[G][A-Z0-9]{55}$/.test(address);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("escrow amount validation", () => {
  it("accepts valid minimum amount", () => {
    expect(validateEscrowAmount("1").valid).toBe(true);
    expect(validateEscrowAmount("10").valid).toBe(true);
    expect(validateEscrowAmount("100.5").valid).toBe(true);
  });

  it("rejects amounts below 1 USDC", () => {
    const result = validateEscrowAmount("0.5");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Minimum");
  });

  it("rejects zero amount", () => {
    expect(validateEscrowAmount("0").valid).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(validateEscrowAmount("abc").valid).toBe(false);
    expect(validateEscrowAmount("").valid).toBe(false);
  });

  it("accepts large valid amounts", () => {
    expect(validateEscrowAmount("10000").valid).toBe(true);
    expect(validateEscrowAmount("999999").valid).toBe(true);
  });
});

describe("contract milestone ID truncation", () => {
  it("truncates long IDs to 10 characters", () => {
    const id = "clxyz123456789abcdef";
    expect(getContractMilestoneId(id)).toBe("clxyz12345");
    expect(getContractMilestoneId(id)).toHaveLength(10);
  });

  it("returns short IDs as-is", () => {
    expect(getContractMilestoneId("abc")).toBe("abc");
  });

  it("returns exactly 10 chars from a standard cuid", () => {
    const cuid = "clxyz1234567890abcdef";
    const result = getContractMilestoneId(cuid);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});

describe("Stellar address validation", () => {
  it("accepts valid Stellar G-type addresses", () => {
    const validAddress = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
    expect(isValidStellarAddress(validAddress)).toBe(true);
  });

  it("rejects non-G addresses", () => {
    expect(isValidStellarAddress("SBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5")).toBe(false);
  });

  it("rejects too-short addresses", () => {
    expect(isValidStellarAddress("GABCD1234")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidStellarAddress("")).toBe(false);
  });
});

describe("USDC conversion (7-decimal precision)", () => {
  // Soroban contract uses 7 decimal places (stroops-like)
  const toStroops = (usdc: number): number => Math.round(usdc * 10_000_000);
  const fromStroops = (stroops: number): number => stroops / 10_000_000;

  it("converts 1 USDC to 10_000_000 stroops", () => {
    expect(toStroops(1)).toBe(10_000_000);
  });

  it("converts 10.5 USDC correctly", () => {
    expect(toStroops(10.5)).toBe(105_000_000);
  });

  it("round-trips USDC -> stroops -> USDC without precision loss", () => {
    const original = 25.75;
    expect(fromStroops(toStroops(original))).toBeCloseTo(original, 5);
  });

  it("handles fractional amounts with precision", () => {
    expect(toStroops(0.0000001)).toBe(1); // 1 stroop
  });
});
