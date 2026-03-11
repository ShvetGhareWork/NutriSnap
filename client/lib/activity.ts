export const logActivity = async (userId: string, type: string, content: string, metadata: any = {}) => {
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/activity/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, type, content, metadata }),
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};
