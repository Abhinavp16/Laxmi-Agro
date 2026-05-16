import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:dio/dio.dart' as dio;
import '../config/api_config.dart';
import 'storage_service.dart';

class TransliterationService {
  static final Map<String, String> _cache = {};

  /// Returns Devanagari transliteration, e.g. "brush cutter" -> "ब्रश कटर"
  static Future<String> transliterateToHindi(String text) async {
    if (text.isEmpty) return text;
    if (_cache.containsKey(text)) return _cache[text]!;

    final uri = Uri.parse(
      'https://inputtools.google.com/request?text=${Uri.encodeQueryComponent(text)}&itc=hi-t-i0-und&num=1',
    );

    try {
      final res = await http.get(uri);
      if (res.statusCode != 200) return text;

      final data = jsonDecode(res.body);
      // Response format: ["SUCCESS",[["text",["result1","result2"],...]]]
      if (data is List && data.isNotEmpty && data[0] == "SUCCESS") {
        final result = data[1][0][1][0];
        if (result is String) {
          _cache[text] = result;
          return result;
        }
      }
    } catch (e) {
      print('Transliteration error: $e');
    }
    return text;
  }

  /// Syncs the transliterated name back to the database
  static Future<void> syncHindiName(String productId, String nameHindi) async {
    final dioClient = dio.Dio(dio.BaseOptions(baseUrl: ApiConfig.baseUrl));

    try {
      final token = await StorageService.getAccessToken();
      await dioClient.patch(
        '/products/$productId/hindi-name',
        data: {'nameHindi': nameHindi},
        options: token != null
            ? dio.Options(headers: {'Authorization': 'Bearer $token'})
            : null,
      );
    } catch (e) {
      print('Sync Hindi name error: $e');
    }
  }
}
