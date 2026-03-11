'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { IMemberProfile, ICoachProfile } from '@/types';
import { useGlobalStore } from '@/store/useGlobalStore';
interface UserContextType {
    memberProfile: IMemberProfile | null;
    coachProfile: ICoachProfile | null;
    isLoading: boolean;
    refetchProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [memberProfile, setMemberProfile] = useState<IMemberProfile | null>(null);
    const [coachProfile, setCoachProfile] = useState<ICoachProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const setUser = useGlobalStore(state => state.setUser);

    const fetchProfile = async () => {
        if (!session?.user) return;
        setIsLoading(true);
        try {
            const role = session.user.role;
            if (!role) return; // Do not fetch profile if role is not yet selected
            const res = await fetch(`/api/profile/${role}`);

            if (!res.ok) {
                console.warn(`Profile fetch returned status: ${res.status}`);
                return;
            }

            const json = await res.json();
            if (json?.success) {
                if (role === 'member') {
                    setMemberProfile(json.data);
                    setUser(json.data);
                }
                else setCoachProfile(json.data);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    return (
        <UserContext.Provider value={{ memberProfile, coachProfile, isLoading, refetchProfile: fetchProfile }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUserContext must be used inside UserProvider');
    return ctx;
}
