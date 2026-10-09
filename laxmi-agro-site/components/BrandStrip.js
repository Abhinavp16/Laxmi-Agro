import Icon from '@/components/Icon';
import { Layers01Icon, Leaf01Icon, Wrench01Icon } from '@hugeicons/core-free-icons';

const brandItems = [
    {
        id: 'laxmi-agro',
        type: 'image',
        src: '/favicon-rounded.png',
        alt: 'Laxmi Agro',
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
            <Icon icon={Layers01Icon} size={32} strokeWidth={2} className="text-brand-primary" />
        ),
    },
    {
        id: 'vflow',
        type: 'icon',
        label: 'V-Flow',
        icon: (
            <Icon icon={Leaf01Icon} size={32} strokeWidth={2} className="text-brand-primary" />
        ),
    },
    {
        id: 'heavyduty',
        type: 'icon',
        label: 'HeavyDuty',
        icon: (
            <Icon icon={Wrench01Icon} size={32} strokeWidth={2} className="text-brand-primary" />
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
