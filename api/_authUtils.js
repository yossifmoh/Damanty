import crypto from 'node:crypto';

const COOKIE_NAME = 'damanty_session';

function getSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.DATABASE_URL ||
    'damanty-dev-fallback-secret-change-in-prod'
  );
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(String(password), salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export function createSessionToken(user) {
  const payload = {
    userId: user.id,
    name: user.name,
    phone: user.phone || '',
    email: user.email,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', getSecret())
    .update(encoded)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload?.userId || (payload.exp && payload.exp < Date.now())) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req) {
  const cookieHeader = req.headers?.cookie || '';
  const pairs = cookieHeader.split(';').map((c) => c.trim());
  for (const pair of pairs) {
    if (pair.startsWith(`${COOKIE_NAME}=`)) {
      const token = decodeURIComponent(pair.slice(COOKIE_NAME.length + 1));
      return verifySessionToken(token);
    }
  }
  return null;
}

export function buildSessionCookie(token) {
  const maxAge = 60 * 60 * 24 * 30;
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${
    isProd ? '; Secure' : ''
  }`;
}

export function buildClearSessionCookie() {
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
    isProd ? '; Secure' : ''
  }`;
}
