export async function createExpense(payload: { title: string; amount: number; payer: string; splitType: string }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
  const res = await fetch(`${apiUrl}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error("Failed to create expense");
  }
  return res.json();
}
