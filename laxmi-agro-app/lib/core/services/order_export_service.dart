import 'dart:io';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import 'api_client.dart';

class OrderExportDownloadResult {
  final File? file;
  final String? errorMessage;
  final String? debugReason;

  const OrderExportDownloadResult({
    this.file,
    this.errorMessage,
    this.debugReason,
  });

  bool get hasFile => file != null;
}

enum OrderReceiptShareStatus { shareSheetOpened, fileMissing, shareUnavailable }

class OrderReceiptShareResult {
  final OrderReceiptShareStatus status;
  final String? errorMessage;
  final String? debugReason;

  const OrderReceiptShareResult({
    required this.status,
    this.errorMessage,
    this.debugReason,
  });

  bool get shareSheetOpened =>
      status == OrderReceiptShareStatus.shareSheetOpened;
}

class OrderExportService {
  static const String _defaultWhatsAppNumber = '9179110159';

  static String? extractOrderId(dynamic responseData) {
    if (responseData is! Map) return null;
    final data = responseData['data'];
    if (data is! Map) return null;
    final raw = data['orderId']?.toString().trim();
    return (raw == null || raw.isEmpty) ? null : raw;
  }

  static String? extractOrderNumber(dynamic responseData) {
    if (responseData is! Map) return null;
    final data = responseData['data'];
    if (data is! Map) return null;
    final raw = data['orderNumber']?.toString().trim();
    return (raw == null || raw.isEmpty) ? null : raw;
  }

  static String? extractExportPath(dynamic responseData) {
    if (responseData is! Map) return null;
    final data = responseData['data'];
    if (data is! Map) return null;
    final raw = data['exportPath']?.toString().trim();
    return (raw == null || raw.isEmpty) ? null : raw;
  }

  static String? extractWhatsAppNumber(dynamic responseData) {
    if (responseData is! Map) return null;
    final data = responseData['data'];
    if (data is! Map) return null;
    final raw =
        data['whatsappNumber']?.toString().trim() ?? _defaultWhatsAppNumber;
    if (raw.isEmpty) return null;
    final digits = raw.replaceAll(RegExp(r'[^\d]'), '');
    if (digits.isEmpty) return null;
    if (digits.length == 10) return '91$digits';
    return digits;
  }

  static String extractCaption(dynamic responseData) {
    if (responseData is! Map) {
      return 'Hi, I am customer. Please find my order receipt attached.';
    }
    final data = responseData['data'];
    if (data is! Map) {
      return 'Hi, I am customer. Please find my order receipt attached.';
    }
    final caption = data['whatsappMessage']?.toString().trim();
    if (caption != null && caption.isNotEmpty) return caption;
    return 'Hi, I am customer. Please find my order receipt attached.';
  }

  static Future<OrderExportDownloadResult> downloadOrderReceipt({
    required ApiClient apiClient,
    required dynamic responseData,
  }) async {
    try {
      final orderId = extractOrderId(responseData);
      final exportPath =
          extractExportPath(responseData) ??
          (orderId != null ? '/orders/$orderId/export?format=pdf' : null);

      if (orderId == null || exportPath == null) {
        return const OrderExportDownloadResult(
          errorMessage: 'Order receipt is not available for this checkout yet.',
          debugReason: 'Missing orderId or exportPath in checkout response',
        );
      }

      final orderNumber = extractOrderNumber(responseData) ?? orderId;
      final response = await apiClient.getBytes(exportPath);
      final bytes = response.data;
      if (bytes == null || bytes.isEmpty) {
        return const OrderExportDownloadResult(
          errorMessage: 'Order receipt was generated but came back empty.',
          debugReason: 'Export endpoint returned zero bytes',
        );
      }

      final tempDir = await getTemporaryDirectory();
      final safeOrderNumber = orderNumber
          .replaceAll(RegExp(r'[<>:"/\\|?*\x00-\x1F]'), '-')
          .replaceAll(RegExp(r'\s+'), '-')
          .replaceAll(RegExp(r'-+'), '-')
          .replaceAll(RegExp(r'^-|-$'), '');
      final file = File('${tempDir.path}/order-$safeOrderNumber.pdf');
      await file.writeAsBytes(bytes, flush: true);

      return OrderExportDownloadResult(file: file);
    } catch (error) {
      debugPrint('[OrderExport] downloadOrderReceipt failed: $error');
      return OrderExportDownloadResult(
        errorMessage: 'We could not generate the order receipt right now.',
        debugReason: error.toString(),
      );
    }
  }

  static Future<OrderReceiptShareResult> shareOrderReceipt(
    File file, {
    Rect? sharePositionOrigin,
  }) async {
    if (!file.existsSync()) {
      return const OrderReceiptShareResult(
        status: OrderReceiptShareStatus.fileMissing,
        errorMessage: 'The exported order receipt is missing on this device.',
        debugReason: 'Local order receipt file not found',
      );
    }

    try {
      final result = await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path, mimeType: 'application/pdf')],
          sharePositionOrigin: sharePositionOrigin,
        ),
      );

      if (result.status == ShareResultStatus.unavailable) {
        return const OrderReceiptShareResult(
          status: OrderReceiptShareStatus.shareUnavailable,
          errorMessage:
              'Receipt sharing is not available on this device. You can still send the order details by WhatsApp.',
          debugReason: 'System share sheet unavailable',
        );
      }

      return const OrderReceiptShareResult(
        status: OrderReceiptShareStatus.shareSheetOpened,
      );
    } catch (error) {
      debugPrint('[OrderExport] shareOrderReceipt failed: $error');
      return OrderReceiptShareResult(
        status: OrderReceiptShareStatus.shareUnavailable,
        errorMessage:
            'We saved your order, but could not open the receipt sharing options.',
        debugReason: error.toString(),
      );
    }
  }
}
