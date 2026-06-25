import {
  formatNumber,
  formatCurrency,
  formatPercent,
  slugify,
  truncate,
  timeAgo,
  getHealthColor,
  getHealthLabel,
  getSupporterLevel,
} from "@/lib/utils";

describe("formatNumber", () => {
  it("formats millions with 1 decimal", () => {
    expect(formatNumber(1_000_000)).toBe("1.0M");
    expect(formatNumber(2_500_000)).toBe("2.5M");
  });

  it("formats thousands with 1 decimal", () => {
    expect(formatNumber(1_500)).toBe("1.5k");
    expect(formatNumber(10_000)).toBe("10.0k");
  });

  it("returns raw string for numbers below 1000", () => {
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
  });
});

describe("formatCurrency", () => {
  it("formats USDC amounts with 2 decimal places", () => {
    expect(formatCurrency(10, "USDC")).toBe("10.00 USDC");
    expect(formatCurrency("25.5", "USDC")).toBe("25.50 USDC");
  });

  it("uses USDC as default currency", () => {
    expect(formatCurrency(100)).toBe("100.00 USDC");
  });

  it("works with XLM currency label", () => {
    expect(formatCurrency(50, "XLM")).toBe("50.00 XLM");
  });
});

describe("formatPercent", () => {
  it("calculates percentage correctly", () => {
    expect(formatPercent(50, 100)).toBe(50);
    expect(formatPercent(1, 3)).toBe(33);
  });

  it("caps at 100 when value exceeds total", () => {
    expect(formatPercent(150, 100)).toBe(100);
  });

  it("returns 0 when total is 0", () => {
    expect(formatPercent(10, 0)).toBe(0);
  });
});

describe("slugify", () => {
  it("converts text to lowercase hyphenated slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("React.js Library")).toBe("reactjs-library");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("--test--")).toBe("test");
  });

  it("handles already clean slugs", () => {
    expect(slugify("my-project")).toBe("my-project");
  });
});

describe("truncate", () => {
  it("returns original string when within limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates with ellipsis when over limit", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
  });

  it("returns exact string when at the limit boundary", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });
});

describe("timeAgo", () => {
  it("returns 'just now' for very recent dates", () => {
    const now = new Date();
    expect(timeAgo(now)).toBe("just now");
  });

  it("returns minutes for recent past", () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(timeAgo(fiveMinsAgo)).toBe("5m ago");
  });

  it("returns hours for same-day past", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(timeAgo(twoHoursAgo)).toBe("2h ago");
  });

  it("returns days for recent past", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(timeAgo(threeDaysAgo)).toBe("3d ago");
  });
});

describe("getHealthColor", () => {
  it("returns green for high health scores", () => {
    expect(getHealthColor(90)).toBe("#22C55E");
    expect(getHealthColor(80)).toBe("#22C55E");
  });

  it("returns blue for good scores", () => {
    expect(getHealthColor(70)).toBe("#38BDF8");
    expect(getHealthColor(60)).toBe("#38BDF8");
  });

  it("returns amber for fair scores", () => {
    expect(getHealthColor(50)).toBe("#F59E0B");
  });

  it("returns red for poor scores", () => {
    expect(getHealthColor(30)).toBe("#EF4444");
  });

  it("returns gray for inactive projects", () => {
    expect(getHealthColor(10)).toBe("#6B7280");
    expect(getHealthColor(0)).toBe("#6B7280");
  });
});

describe("getHealthLabel", () => {
  it("returns correct label for each tier", () => {
    expect(getHealthLabel(90)).toBe("Excellent");
    expect(getHealthLabel(65)).toBe("Good");
    expect(getHealthLabel(45)).toBe("Fair");
    expect(getHealthLabel(25)).toBe("Poor");
    expect(getHealthLabel(5)).toBe("Inactive");
  });
});

describe("getSupporterLevel", () => {
  it("returns Explorer for new supporters", () => {
    const result = getSupporterLevel(0);
    expect(result.level).toBe("Explorer");
    expect(result.next).toBe("Backer");
  });

  it("returns Backer at 100 USDC", () => {
    const result = getSupporterLevel(100);
    expect(result.level).toBe("Backer");
    expect(result.next).toBe("Champion");
  });

  it("returns Legend at 1000+ USDC with no next level", () => {
    const result = getSupporterLevel(1000);
    expect(result.level).toBe("Legend");
    expect(result.next).toBeNull();
    expect(result.progress).toBe(100);
  });
});
