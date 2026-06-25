import { NextRequest, NextResponse } from "next/server";
import { getTreasuryBalance, getRecentTransactions } from "@/lib/stellar";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
  }

  const [balance, transactions] = await Promise.all([
    getTreasuryBalance(address),
    getRecentTransactions(address),
  ]);

  return NextResponse.json({ balance, transactions });
}
