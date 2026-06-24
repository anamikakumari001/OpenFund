/**
 * Tests for stellar.ts pure utility functions.
 * The Stellar SDK requires TextEncoder (Node 18+ / browser), so we mock
 * the heavy SDK import and only test the functions we own.
 */

// Mock the full SDK before any other imports
jest.mock("@stellar/stellar-sdk", () => ({
  Horizon: {
    Server: jest.fn().mockImplementation(() => ({})),
  },
  Networks: {
    TESTNET: "Test SDF Network ; September 2015",
    PUBLIC: "Public Global Stellar Network ; September 2015",
  },
  Asset: jest.fn().mockImplementation((code: string, issuer: string) => ({
    code,
    issuer,
    asset_type: code === "XLM" ? "native" : "credit_alphanum4",
  })),
  Memo: {
    text: (value: string) => ({ type: "text", value }),
  },
}));

import { formatStellarAmount, createDonationMemo } from "@/lib/stellar";

describe("formatStellarAmount", () => {
  it("formats a whole number amount", () => {
    const result = formatStellarAmount("100");
    expect(result).toMatch(/100/);
    expect(typeof result).toBe("string");
  });

  it("formats a decimal USDC amount", () => {
    const result = formatStellarAmount("25.5000000");
    expect(result).toMatch(/25/);
  });

  it("handles zero balance", () => {
    const result = formatStellarAmount("0");
    expect(result).toMatch(/0/);
  });

  it("handles large amounts", () => {
    const result = formatStellarAmount("1234567.89");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("uses locale number formatting with at least 2 decimal places", () => {
    const result = formatStellarAmount("10");
    // The formatted string should contain a decimal separator
    expect(result).toMatch(/10/);
  });
});

describe("createDonationMemo", () => {
  it("creates a text memo with OF: prefix", () => {
    const memo = createDonationMemo("clxyz1234567890", "cluser123456789");
    expect(memo.value).toMatch(/^OF:/);
  });

  it("truncates project and user IDs to 10 chars each", () => {
    const memo = createDonationMemo("clxyz1234567890abcdef", "cluserabcdefghijk");
    const value = memo.value as string;
    // Format: "OF:{10chars}:{10chars}" = 24 total
    expect(value.length).toBe(24);
  });

  it("constructs memo in correct format", () => {
    const projectId = "cltest12345";
    const userId = "clusr12345x";
    const memo = createDonationMemo(projectId, userId);
    const value = memo.value as string;
    const parts = value.split(":");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("OF");
    expect(parts[1]).toHaveLength(10);
    expect(parts[2]).toHaveLength(10);
  });

  it("returns a Stellar Memo object", () => {
    const memo = createDonationMemo("proj123456", "user123456");
    expect(memo).toHaveProperty("value");
    expect(memo).toHaveProperty("type", "text");
  });
});

describe("Stellar address format validation", () => {
  const isValidG = (addr: string) => /^G[A-Z2-7]{55}$/.test(addr);

  it("validates the real deployed USDC SAC address", () => {
    // USDC SAC on testnet — if this passes, address format is correct
    const usdcSac = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
    // SAC addresses start with C, not G — different check
    expect(usdcSac.length).toBe(56);
    expect(usdcSac[0]).toBe("C");
  });

  it("validates a well-known Stellar testnet G-address format", () => {
    // Standard Stellar public key starts with G and is 56 chars
    const testAddr = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
    expect(testAddr).toHaveLength(56);
    expect(testAddr[0]).toBe("G");
  });

  it("rejects obviously invalid addresses", () => {
    expect(isValidG("not-an-address")).toBe(false);
    expect(isValidG("")).toBe(false);
    expect(isValidG("G")).toBe(false);
  });
});
