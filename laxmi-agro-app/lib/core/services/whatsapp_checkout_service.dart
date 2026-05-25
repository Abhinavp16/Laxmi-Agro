import 'package:url_launcher/url_launcher.dart';

class WhatsAppCheckoutService {
  static String? extractNumber(dynamic responseData) {
    if (responseData is! Map) return null;
    final data = responseData['data'];
    if (data is! Map) return null;
    final raw = data['whatsappNumber']?.toString().trim() ?? '';
    if (raw.isEmpty) return null;
    final digits = raw.replaceAll(RegExp(r'[^\d]'), '');
    if (digits.isEmpty) return null;
    if (digits.length == 10) return '91$digits';
    return digits;
  }

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
    final message = extractMessage(responseData);
    final number = extractNumber(responseData);
    final url = extractUrl(responseData);

    final candidates = <Uri>[];

    if (number != null && number.isNotEmpty) {
      candidates.add(
        Uri.parse(
          'whatsapp://send?phone=$number&text=${Uri.encodeComponent(message)}',
        ),
      );
      candidates.add(
        Uri.parse(
          'https://wa.me/$number?text=${Uri.encodeComponent(message)}',
        ),
      );
    }

    if (url != null) {
      final uri = Uri.tryParse(url);
      if (uri != null) {
        candidates.add(uri);
      }
    }

    for (final candidate in candidates) {
      if (await launchUrl(candidate, mode: LaunchMode.externalApplication)) {
        return true;
      }
    }

    return false;
  }
}
