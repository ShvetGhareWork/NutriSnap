import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== 'coach') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const res = await fetch(`${BACKEND_URL}/api/programs/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, coachId: session.user.id })
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Assign program error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
