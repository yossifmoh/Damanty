import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connStr) {
    return res.status(200).json({
      ok: false,
      configured: false,
      geminiConfigured: Boolean((process.env.GEMINI_API_KEY || '').trim()),
      message: 'DATABASE_URL not configured',
    });
  }

  try {
    const start = Date.now();
    const sql = neon(connStr);
    const rows = await sql`SELECT NOW() AS server_time, current_database() AS db_name`;
    const latencyMs = Date.now() - start;
    return res.status(200).json({
      ok: true,
      configured: true,
      geminiConfigured: Boolean((process.env.GEMINI_API_KEY || '').trim()),
      provider: 'Neon Serverless Postgres',
      database: rows[0]?.db_name || 'neondb',
      serverTime: rows[0]?.server_time,
      latencyMs,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      configured: true,
      error: error.message || 'Database connection failed',
    });
  }
}
