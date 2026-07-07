import { NextResponse, type NextRequest } from "next/server";

import { searchRealRecords } from "@/features/core-modules/real-data";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const response = await searchRealRecords(query);

  return NextResponse.json(response);
}
