export async function POST() {
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
