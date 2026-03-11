"use client";

import { useEffect, useRef } from 'react';
import { useGlobalStore } from '@/store/useGlobalStore';

export function useRemindersRunner() {
    const { reminders } = useGlobalStore();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Request notification permission if not already granted/denied
        if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }
        }
    }, []);

    useEffect(() => {
        // Check every minute
        intervalRef.current = setInterval(() => {
            const now = new Date();
            const currentHours = String(now.getHours()).padStart(2, '0');
            const currentMinutes = String(now.getMinutes()).padStart(2, '0');
            const currentTimeStr = `${currentHours}:${currentMinutes}`;
            
            // NOTE: We only want to trigger the notification once per minute
            // to avoid spamming if the interval runs multiple times within the same minute.
            // Using a basic approach here since setInterval is ~60s
            reminders.forEach(reminder => {
                if (reminder.time === currentTimeStr) {
                    // Send Notification
                    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                        new Notification("NutriSnap Reminder", {
                            body: reminder.message,
                            icon: "/icon.png" // Replace with actual logo path if needed
                        });
                    }
                }
            });

        }, 60000); // 1 minute

        // Run immediately on mount as well to check the current minute
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;
        
        reminders.forEach(reminder => {
            if (reminder.time === currentTimeStr) {
                // Send Notification
                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                    // Assuming we might have missed the exact minute
                }
            }
        });

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [reminders]);
}
