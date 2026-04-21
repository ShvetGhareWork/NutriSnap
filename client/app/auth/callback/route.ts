import { NextRequest, NextResponse } from 'next/server';
import { getGoogleFitTokens } from '@/lib/googleFit';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

    if (error) {
    console.error('Google OAuth Error:', error);
    return NextResponse.redirect(new URL('/fitness?error=access_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/fitness?error=no_code', request.url));
  }

  try {
    const tokens = await getGoogleFitTokens(code);
    
    // Set cookies securely
    const cookieStore = await cookies();
    
    cookieStore.set('gf_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
      path: '/',
    });

    if (tokens.refresh_token) {
      cookieStore.set('gf_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60, // 1 year
        path: '/',
      });
    }

    return NextResponse.redirect(new URL('/fitness?success=true', request.url));
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.redirect(new URL('/fitness?error=token_exchange_failed', request.url));
  }
}
