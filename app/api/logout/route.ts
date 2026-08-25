// app/api/logout/route.ts — Logout

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logout berhasil' });
  response.cookies.delete('session_token');
  return response;
}
