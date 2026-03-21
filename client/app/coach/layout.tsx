'use client';

import CoachSidebar from '@/components/layout/CoachSidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { motion } from 'framer-motion';

function CoachLayoutInner({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="min-h-screen bg-[#0A0A0F]">
            <CoachSidebar />

            <motion.div
                animate={{ marginLeft: isCollapsed ? 80 : 256 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="hidden lg:flex flex-col min-h-screen"
            >
                <TopBar />
                <main className="flex-1 px-4 md:px-6 py-6 pb-24 lg:pb-6">
                    {children}
                </main>
            </motion.div>

            {/* Mobile View */}
            <div className="lg:hidden flex flex-col min-h-screen">
                <TopBar />
                <main className="flex-1 px-4 md:px-6 py-6 pb-24">
                    {children}
                </main>
            </div>

        </div>
    );
}


export default function CoachLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <CoachLayoutInner>{children}</CoachLayoutInner>
        </SidebarProvider>
    );
}
