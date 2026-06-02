'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { WHATSAPP_NUMBER } from '@/lib/inquiry';

const contactItems = [
    {
        label: 'Email',
        value: 'ashirvadmarketing62@gmail.com',
        href: 'mailto:ashirvadmarketing62@gmail.com',
        color: 'text-[#17351d]',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v16H4z" />
                <path d="m4 7 8 6 8-6" />
            </svg>
        ),
    },
    {
        label: 'WhatsApp',
        value: '+91 91791 10159',
        href: `https://wa.me/${WHATSAPP_NUMBER}`,
        color: 'text-[#128c47]',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2C6.52 2 2.04 6.48 2.04 12c0 1.77.46 3.43 1.26 4.88L2 22l5.27-1.28A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10S17.56 2 12.04 2Zm0 18.18c-1.53 0-3.03-.4-4.35-1.16l-.31-.18-3.13.76.84-3.05-.2-.32A8.11 8.11 0 1 1 12.04 20.18Zm4.45-6.08c-.24-.12-1.4-.69-1.62-.76-.22-.08-.38-.12-.54.12-.16.24-.62.76-.76.92-.14.16-.28.18-.52.06a6.63 6.63 0 0 1-1.95-1.2 7.32 7.32 0 0 1-1.35-1.68c-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.4-.57 1.6-1.12.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.46-.28Z" />
            </svg>
        ),
    },
];

const socialItems = [
    {
        label: 'Instagram',
        href: '/contact',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <path d="M17.5 6.5h.01" />
            </svg>
        ),
    },
    {
        label: 'Facebook',
        href: '/contact',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
        ),
    },
];

export default function ContactMorphButton() {
    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const containerRef = useRef(null);

    const closePanel = () => {
        setClosing(true);

        window.setTimeout(() => {
            setOpen(false);
            setClosing(false);
        }, 440);
    };

    useEffect(() => {
        if (!open || closing) return undefined;

        const handlePointerDown = (event) => {
            if (!containerRef.current?.contains(event.target)) {
                closePanel();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [open, closing]);

    return (
        <div ref={containerRef} className={`contact-morph relative z-40 h-14 w-[178px] ${open ? 'is-open' : ''}`}>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`group flex h-14 w-[178px] items-center justify-between rounded-full bg-white p-1 pl-6 text-[15px] font-medium text-[#172315] shadow-[0_16px_36px_rgba(0,0,0,0.18)] transition-all duration-300 ${open ? `pointer-events-none ${closing ? 'opacity-100' : 'scale-95 opacity-0 blur-sm'}` : 'opacity-100 hover:-translate-y-0.5'}`}
                aria-expanded={open}
                aria-label="Open contact options"
            >
                        Quick Contact
                <span className="ml-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#17351d]/20 bg-[#f7faf2] text-[#17351d] transition-colors group-hover:bg-[#17351d] group-hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M13 6l6 6-6 6" />
                    </svg>
                </span>
            </button>

            {open && (
                <div className={`contact-morph-panel absolute right-0 top-0 h-[332px] w-[384px] overflow-hidden rounded-[2rem] bg-white p-4 text-[#172315] shadow-[0_24px_70px_rgba(0,0,0,0.28)] ${closing ? 'is-closing' : ''}`}>
                    <div className="flex h-full flex-col">
                        <div className="flex items-start justify-between gap-4 rounded-[1.45rem] bg-[#f2f6ec] p-4">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#557044]">Reach Us</p>
                                <h3 className="mt-1 text-2xl font-medium tracking-[-0.02em] text-[#17351d]">Quick Contact</h3>
                            </div>
                            <button
                                type="button"
                                onClick={closePanel}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#17351d] shadow-sm transition-transform hover:scale-95"
                                aria-label="Close contact options"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mt-4 grid gap-2.5">
                            {contactItems.map((item) => (
                                <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="contact-morph-item flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left">
                                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ecf2e5] ${item.color}`}>{item.icon}</span>
                                    <span className="min-w-0">
                                        <span className="block text-xs font-bold uppercase tracking-[0.14em] text-[#6d7e60]">{item.label}</span>
                                        <span className="block truncate text-sm font-semibold text-[#17351d]">{item.value}</span>
                                    </span>
                                </a>
                            ))}
                        </div>

                        <div className="mt-auto flex items-center gap-2 pt-4">
                            {socialItems.map((item) => (
                                <Link key={item.label} href={item.href} className="contact-morph-item flex flex-1 items-center justify-center gap-2 rounded-full bg-[#17351d] px-3 py-3 text-xs font-bold text-white">
                                    {item.icon}
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
