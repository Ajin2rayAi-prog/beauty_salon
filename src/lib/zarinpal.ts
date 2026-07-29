const MERCHANT = process.env.ZARINPAL_MERCHANT_ID ?? "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
const SANDBOX = process.env.ZARINPAL_SANDBOX !== "false";
const BASE = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment"
  : "https://payment.zarinpal.com/pg/v4/payment";
const START_PAY = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/StartPay"
  : "https://payment.zarinpal.com/pg/StartPay";

export async function requestPayment(amount: number, description: string, callbackUrl: string) {
  const res = await fetch(`${BASE}/request.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchant_id: MERCHANT, amount, description, callback_url: callbackUrl }),
  });
  const data = await res.json();
  if (data.data?.code === 100) {
    return { authority: data.data.authority as string, paymentUrl: `${START_PAY}/${data.data.authority}` };
  }
  throw new Error(data.errors?.message ?? "ZarinPal request failed");
}

export async function verifyPayment(authority: string, amount: number) {
  const res = await fetch(`${BASE}/verify.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchant_id: MERCHANT, authority, amount }),
  });
  const data = await res.json();
  if (data.data?.code === 100 || data.data?.code === 101) {
    return { refId: String(data.data.ref_id) };
  }
  throw new Error(data.errors?.message ?? "ZarinPal verify failed");
}
