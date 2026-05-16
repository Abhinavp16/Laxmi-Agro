const brandItems = [
    {
        id: 'oxon',
        type: 'image',
        src: '/images/oxon.jpeg',
        alt: 'OXON',
    },
    {
        id: 'ecotech',
        type: 'image',
        src: '/images/ecotech.jpeg',
        alt: 'Ecotech',
    },
    {
        id: 'kargill',
        type: 'image',
        src: '/images/kargill.jpeg',
        alt: 'Kargill',
    },
    {
        id: 'agriplus',
        type: 'icon',
        label: 'AgriPlus',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
        ),
    },
    {
        id: 'vflow',
        type: 'icon',
        label: 'V-Flow',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.77 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6" />
            </svg>
        ),
    },
    {
        id: 'heavyduty',
        type: 'icon',
        label: 'HeavyDuty',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        ),
    },
];

function BrandItem({ item }) {
    if (item.type === 'image') {
        return (
            <div className="flex items-center justify-center h-10 md:h-12 w-auto shrink-0">
                <img src={item.src} alt={item.alt} className="h-full object-contain" />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 shrink-0">
            {item.icon}
            <span className="text-xl font-bold text-gray-700">{item.label}</span>
        </div>
    );
}

export default function BrandStrip() {
    const mobileItems = brandItems.concat(brandItems);

    return (
        <>
            <div className="brand-marquee md:hidden overflow-hidden py-4">
                <div className="brand-marquee-track flex w-max items-center gap-6">
                    {mobileItems.map((item, index) => (
                        <div key={`${item.id}-${index}`} aria-hidden={index >= brandItems.length}>
                            <BrandItem item={item} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="hidden md:flex items-center justify-center gap-10 lg:gap-16 py-4">
                {brandItems.map((item) => (
                    <BrandItem key={item.id} item={item} />
                ))}
            </div>
        </>
    );
}
