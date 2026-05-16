export const WHATSAPP_NUMBER = '917828832346';

export function buildWhatsAppMessage({ name, phone, productName, price = '', details = [] }) {
    const lines = [
        'Hello Veepee Impex,',
        `My Name: ${name}`,
        `My Number: ${phone}`,
        '',
        `I want to inquire about: ${productName}`,
    ];

    if (price) {
        lines.push(`Price shown: ${price}`);
    }

    if (details.length) {
        lines.push('', 'Product details:');
        details.forEach((detail) => lines.push(`- ${detail}`));
    }

    return lines.join('\n');
}

export function buildWhatsAppUrl(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildDealershipApplicationMessage({
    name,
    phone,
    shopName = '',
    state,
    city,
    businessDescription = '',
}) {
    const lines = [
        'Hello Veepee Impex,',
        'I want to apply for dealership.',
        '',
        `Full Name: ${name}`,
        `Phone: ${phone}`,
        `Shop Name: ${shopName || 'Not provided'}`,
        `State: ${state}`,
        `City: ${city}`,
        `Business Description: ${businessDescription || 'Not provided'}`,
    ];

    return lines.join('\n');
}

export function buildContactFormMessage({
    name,
    email = '',
    phone,
    category,
    message,
}) {
    const lines = [
        'Hello Veepee Impex,',
        'I want to contact your team.',
        '',
        `Full Name: ${name}`,
        `Email: ${email || 'Not provided'}`,
        `Phone: ${phone}`,
        `Category: ${category}`,
        '',
        'Message:',
        message,
    ];

    return lines.join('\n');
}
