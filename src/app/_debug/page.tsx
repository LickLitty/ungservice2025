export default function Page() {
  return (
    <div style={{ padding: 20 }}>
      <h1>env check</h1>
      <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ?? '⛔️ MISSING'}</p>
      <p>KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ LOADED' : '⛔️ MISSING'}</p>
    </div>
  );
}


