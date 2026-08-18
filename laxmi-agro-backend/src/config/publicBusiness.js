const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

const normalizeIndianWhatsAppNumber = (value = '') => {
  const digits = digitsOnly(value);
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const orderWhatsAppNumber = normalizeIndianWhatsAppNumber(
  process.env.PUBLIC_ORDER_WHATSAPP_NUMBER || '919179110159'
);

module.exports = {
  orderWhatsAppNumber,
};
