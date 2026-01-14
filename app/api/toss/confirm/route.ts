// app/api/toss/confirm/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) return jsonError("Missing TOSS_SECRET_KEY in env.", 500);

    const body = await req.json();
    const paymentKey = String(body?.paymentKey || "");
    const orderId = String(body?.orderId || "");
    const amount = Number(body?.amount || 0);

    if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
      return jsonError("Invalid params: paymentKey, orderId, amount are required.");
    }

    // Basic Auth: base64(secretKey + ":")
    const basic = Buffer.from(`${secretKey}:`).toString("base64");

    // v1 confirm endpoint is used in many Toss docs/guides
    const resp = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      // data 안에 code/message가 들어오는 케이스가 많음
      return NextResponse.json({ ok: false, error: data }, { status: resp.status });
    }

    return NextResponse.json({ ok: true, payment: data });
  } catch (e: any) {
    return jsonError(e?.message || "Toss confirm failed.", 500);
  }
}
