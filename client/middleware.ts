import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Public paths that don't need auth
  const publicPaths = ['/', '/login', '/register', '/select-role', '/verify-email', '/forgot-password', '/auth/callback'];
  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith('/api/auth')
  );

  // Allow API routes, static assets, and images with extensions
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') || // Allows files like logo.png, video.mp4 etc
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Unauthenticated user trying to access protected route
  if (!token && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user
  if (token) {
    const role = token.role as string;
    const onboardingComplete = token.onboardingComplete as boolean;

    // Define correct onboarding paths based on role
    const onboardingPath = role === 'coach' ? '/coach-onboarding' : '/member-onboarding';
    const dashboardPath = role === 'coach' ? '/coach/dashboard' : '/dashboard'; // default dashboard

    // If role is undefined, force to select role unless we are already there
    if (!role && pathname !== '/select-role') {
        return NextResponse.redirect(new URL('/select-role', request.url));
    }

    // Redirect to role-specific dashboard if accessing root
    if (pathname === '/') {
      if (!role) {
         return NextResponse.redirect(new URL('/select-role', request.url));
      }
      if (!onboardingComplete) {
        return NextResponse.redirect(new URL(onboardingPath, request.url));
      }
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Redirect logged-in users away from auth pages (login, register), but allow select-role if they have no role
    if (isPublic && pathname !== '/' && pathname !== '/select-role' && pathname !== '/auth/callback') {
      if (!role) {
         return NextResponse.redirect(new URL('/select-role', request.url));
      }
      if (!onboardingComplete) {
        return NextResponse.redirect(new URL(onboardingPath, request.url));
      }
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Redirect if onboarding incomplete (except when already on onboarding page)
    if (!onboardingComplete && pathname !== onboardingPath && pathname !== '/select-role' && !isPublic) {
      return NextResponse.redirect(new URL(onboardingPath, request.url));
    }

    // Role-based path protection
    if (onboardingComplete && role) {
        // Members cannot access coach-only areas
        // Specifically check for /coach (dashboard) or paths starting with /coach/
        if (role === 'member' && (pathname === '/coach' || pathname.startsWith('/coach/'))) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // Coaches cannot access member-only areas
        if (role === 'coach' && pathname.startsWith('/member/')) {
            return NextResponse.redirect(new URL('/coach/dashboard', request.url));
        }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
