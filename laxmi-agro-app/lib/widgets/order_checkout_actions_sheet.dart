import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/services/api_client.dart';
import '../core/services/order_export_service.dart';
import '../core/services/whatsapp_checkout_service.dart';
import '../core/theme/app_theme.dart';

class OrderCheckoutActionsSheet {
  static Future<void> handleSuccessfulCheckout({
    required BuildContext context,
    required ApiClient apiClient,
    required dynamic responseData,
  }) async {
    if (kIsWeb) {
      if (!context.mounted) return;
      await showFailure(
        context: context,
        apiClient: apiClient,
        responseData: responseData,
        failureMessage:
            'Your order was saved. You can send the order details by WhatsApp or try sharing the receipt again.',
      );
      return;
    }

    final exportResult = await OrderExportService.downloadOrderReceipt(
      apiClient: apiClient,
      responseData: responseData,
    );
    if (!context.mounted) return;

    final orderFile = exportResult.file;
    if (orderFile == null) {
      await showFailure(
        context: context,
        apiClient: apiClient,
        responseData: responseData,
        failureMessage:
            exportResult.errorMessage ??
            'We saved your order, but could not prepare the PDF receipt.',
      );
      return;
    }

    final shareResult = await OrderExportService.shareOrderReceipt(
      orderFile,
      sharePositionOrigin: _sharePositionOrigin(context),
    );
    if (!context.mounted) return;

    if (shareResult.shareSheetOpened) {
      _showShareSheetOpenedMessage(context);
      return;
    }

    await showFailure(
      context: context,
      apiClient: apiClient,
      responseData: responseData,
      receiptFile: orderFile,
      failureMessage:
          shareResult.errorMessage ??
          'We saved your order, but could not open the receipt sharing options.',
    );
  }

  static Rect? _sharePositionOrigin(BuildContext context) {
    final renderBox = context.findRenderObject() as RenderBox?;
    if (renderBox == null || !renderBox.hasSize) return null;
    return renderBox.localToGlobal(Offset.zero) & renderBox.size;
  }

  static void _showShareSheetOpenedMessage(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Choose WhatsApp or another app to send your receipt.',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
        ),
        backgroundColor: const Color(0xFF16A34A),
      ),
    );
  }

  static Future<void> showFailure({
    required BuildContext context,
    required ApiClient apiClient,
    required dynamic responseData,
    required String failureMessage,
    File? receiptFile,
  }) async {
    final orderNumber = OrderExportService.extractOrderNumber(responseData);
    final receiptCaption = OrderExportService.extractCaption(responseData);
    final message = WhatsAppCheckoutService.extractMessage(responseData);
    final orderMessage = [
      if (orderNumber != null && orderNumber.isNotEmpty) 'Order $orderNumber',
      if (message.isNotEmpty) message else receiptCaption,
    ].join('\n\n');

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        Future<void> shareReceipt() async {
          File? file = receiptFile;
          if (file == null || !file.existsSync()) {
            final exportResult = await OrderExportService.downloadOrderReceipt(
              apiClient: apiClient,
              responseData: responseData,
            );
            if (!sheetContext.mounted) return;
            file = exportResult.file;
            if (file == null) {
              ScaffoldMessenger.of(sheetContext).showSnackBar(
                SnackBar(
                  content: Text(
                    exportResult.errorMessage ??
                        'Unable to prepare the PDF receipt right now.',
                  ),
                  backgroundColor: AppColors.error,
                ),
              );
              return;
            }
          }

          final shareResult = await OrderExportService.shareOrderReceipt(
            file,
            sharePositionOrigin: _sharePositionOrigin(sheetContext),
          );
          if (!sheetContext.mounted) return;
          if (shareResult.shareSheetOpened) {
            Navigator.of(sheetContext).pop();
            _showShareSheetOpenedMessage(context);
            return;
          }

          ScaffoldMessenger.of(sheetContext).showSnackBar(
            SnackBar(
              content: Text(
                shareResult.errorMessage ??
                    'Unable to open receipt sharing options.',
              ),
              backgroundColor: AppColors.error,
            ),
          );
        }

        Future<void> sendWhatsAppMessage() async {
          final opened = await WhatsAppCheckoutService.openFromResponse(
            responseData,
          );
          if (!sheetContext.mounted) return;
          if (opened) {
            Navigator.of(sheetContext).pop();
            return;
          }

          ScaffoldMessenger.of(sheetContext).showSnackBar(
            const SnackBar(
              content: Text(
                'Could not open WhatsApp. You can copy the order details instead.',
              ),
              backgroundColor: AppColors.error,
            ),
          );
        }

        Future<void> copyOrderDetails() async {
          await Clipboard.setData(ClipboardData(text: orderMessage));
          if (!sheetContext.mounted) return;
          ScaffoldMessenger.of(sheetContext).showSnackBar(
            const SnackBar(content: Text('Order details copied.')),
          );
        }

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 28,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 42,
                        height: 5,
                        decoration: BoxDecoration(
                          color: const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF135BEC), Color(0xFF0F9D58)],
                            ),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(
                            Icons.description_rounded,
                            color: Colors.white,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Order saved successfully',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                orderNumber == null || orderNumber.isEmpty
                                    ? 'Choose another way to send or save your receipt.'
                                    : 'Order $orderNumber is saved. Choose another way to send or save your receipt.',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFFED7AA)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.info_outline_rounded,
                            color: Color(0xFFEA580C),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              failureMessage,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF334155),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: shareReceipt,
                        icon: const Icon(Icons.ios_share_rounded),
                        label: Text(
                          'Share Receipt',
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: sendWhatsAppMessage,
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          side: const BorderSide(color: Color(0xFF25D366)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        icon: const Icon(Icons.chat_bubble_outline_rounded),
                        label: Text(
                          'Send WhatsApp Message',
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: TextButton.icon(
                        onPressed: copyOrderDetails,
                        icon: const Icon(Icons.copy_outlined),
                        label: Text(
                          'Copy Order Details',
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
