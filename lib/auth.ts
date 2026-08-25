// lib/auth.ts — JWT Authentication helpers
// VULN #10: Sensitive Data Exposure (A02) — JWT secret lemah ("secret123")
// VULN #6: CSRF (A01) — Cookie session SameSite=None

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// VULN #10: JWT secret lemah, hardcoded fallback
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

export interface UserPayload {
  id: number;
  username: string;
  role: string;
  full_name: string;
}

// Create JWT token
export function createToken(payload: UserPayload): string {
  // VULN #10: Secret lemah + no expiration yang reasonable
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// Verify JWT token
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

// Get session from cookies
export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Set session cookie
// VULN #6: SameSite=None, Secure=false — memungkinkan CSRF
export function getSessionCookieOptions() {
  return {
    name: 'session_token',
    httpOnly: true,
    // VULN #6: CSRF — Tidak ada validasi token CSRF (SameSite Lax default, tapi tetap rentan)
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  };
}
