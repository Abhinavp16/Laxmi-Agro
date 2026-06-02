'use client';

import { usePathname } from 'next/navigation';

export default function RouteMain({ children }) {
    const pathname = usePathname();

    return (
        <main className="pt-0">
            <div key={pathname} className="route-transition">
                {children}
            </div>
        </main>
    );
}
