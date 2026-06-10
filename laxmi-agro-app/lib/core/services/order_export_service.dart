import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';

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

enum WhatsAppDocumentShareStatus {
  launched,
  fileMissing,
  whatsappNotInstalled,
  launchFailed,
}

class WhatsAppDocumentShareResult {
  final WhatsAppDocumentShareStatus status;
  final String? errorMessage;
  final String? debugReason;

  const WhatsAppDocumentShareResult({
    required this.status,
    this.errorMessage,
    this.debugReason,
  });

  bool get launched => status == WhatsAppDocumentShareStatus.launched;
}

class OrderExportService {
  static const String _defaultWhatsAppNumber = '9179110159';
  static const MethodChannel _shareChannel = MethodChannel(
    'laxmi_agro/whatsapp_share',
  );

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

  static Future<WhatsAppDocumentShareResult> shareOrderReceiptToWhatsApp(
    File file, {
    required String phoneNumber,
    String? caption,
  }) async {
    if (!file.existsSync()) {
      return const WhatsAppDocumentShareResult(
        status: WhatsAppDocumentShareStatus.fileMissing,
        errorMessage: 'The exported order receipt is missing on this device.',
        debugReason: 'Local order receipt file not found',
      );
    }

    if (phoneNumber.trim().isEmpty) {
      return const WhatsAppDocumentShareResult(
        status: WhatsAppDocumentShareStatus.launchFailed,
        errorMessage:
            'The WhatsApp order number is missing, so the receipt could not be sent directly.',
        debugReason: 'Missing WhatsApp target number',
      );
    }

    try {
      await _shareChannel.invokeMethod('shareDocumentToWhatsApp', {
        'filePath': file.path,
        'phoneNumber': phoneNumber,
        'caption':
            caption ??
            'Hi, I am customer. Please find my order receipt attached.',
      });
      return const WhatsAppDocumentShareResult(
        status: WhatsAppDocumentShareStatus.launched,
      );
    } on PlatformException catch (error) {
      debugPrint(
        '[OrderExport] shareOrderReceiptToWhatsApp failed: '
        '${error.code} ${error.message}',
      );
      if (error.code == 'WHATSAPP_NOT_INSTALLED') {
        return WhatsAppDocumentShareResult(
          status: WhatsAppDocumentShareStatus.whatsappNotInstalled,
          errorMessage:
              'WhatsApp is not installed on this device. You can still continue with the text-only WhatsApp checkout.',
          debugReason: error.message,
        );
      }
      if (error.code == 'FILE_MISSING') {
        return WhatsAppDocumentShareResult(
          status: WhatsAppDocumentShareStatus.fileMissing,
          errorMessage:
              'The exported order receipt is no longer available on this device.',
          debugReason: error.message,
        );
      }
      return WhatsAppDocumentShareResult(
        status: WhatsAppDocumentShareStatus.launchFailed,
        errorMessage:
            'We saved your order, but could not open WhatsApp with the receipt attached.',
        debugReason: '${error.code}: ${error.message}',
      );
    } catch (error) {
      debugPrint('[OrderExport] shareOrderReceiptToWhatsApp error: $error');
      return WhatsAppDocumentShareResult(
        status: WhatsAppDocumentShareStatus.launchFailed,
        errorMessage:
            'We saved your order, but could not open WhatsApp with the receipt attached.',
        debugReason: error.toString(),
      );
    }
  }
}
