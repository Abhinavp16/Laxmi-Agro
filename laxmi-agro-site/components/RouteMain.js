'use client';

import { usePathname } from 'next/navigation';

export default function RouteMain({ children }) {
    const pathname = usePathname();

    return (
        <main className={pathname === '/' ? 'pt-28 md:pt-24' : 'pt-0'}>
            {children}
        </main>
    );
}
