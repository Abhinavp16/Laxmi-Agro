import 'package:url_launcher/url_launcher.dart';

class WhatsAppCheckoutService {
  static String? extractUrl(dynamic responseData) {
    if (responseData is! Map) return null;
    final data = responseData['data'];
    if (data is! Map) return null;
    final url = data['whatsappUrl']?.toString().trim();
    return (url == null || url.isEmpty) ? null : url;
  }

  static String extractMessage(dynamic responseData) {
    if (responseData is! Map) return '';
    final data = responseData['data'];
    if (data is! Map) return '';
    return data['message']?.toString() ??
        data['whatsappMessage']?.toString() ??
        responseData['message']?.toString() ??
        '';
  }

  static Future<bool> openFromResponse(dynamic responseData) async {
    final url = extractUrl(responseData);
    if (url == null) return false;

    final uri = Uri.tryParse(url);
    if (uri == null) return false;

    return launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
