class PublicBusinessConfig {
  const PublicBusinessConfig._();

  static const String websiteOrigin = 'https://www.laxmiagroenterprises.com';
  static const String whatsappNumber = '919179110159';
  static const String whatsappDisplayNumber = '+91 91791 10159';

  static String productUrl(String? slug) {
    final normalizedSlug = slug?.trim() ?? '';
    return normalizedSlug.isEmpty
        ? '$websiteOrigin/products'
        : '$websiteOrigin/products/${Uri.encodeComponent(normalizedSlug)}';
  }
}
