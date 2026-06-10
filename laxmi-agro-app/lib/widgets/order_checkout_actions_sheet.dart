import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/services/api_client.dart';
import '../core/services/order_export_service.dart';
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
            'Chrome cannot attach the PDF receipt directly to WhatsApp. Please use the Android app for receipt sharing.',
      );
      return;
    }

    final exportResult = await OrderExportService.downloadOrderReceipt(
      apiClient: apiClient,
      responseData: responseData,
    );

    if (!context.mounted) return;

    final orderFile = exportResult.file;
    final phoneNumber = OrderExportService.extractWhatsAppNumber(responseData);
    final caption = OrderExportService.extractCaption(responseData);

    if (orderFile != null && phoneNumber != null) {
      final shareResult = await OrderExportService.shareOrderReceiptToWhatsApp(
        orderFile,
        phoneNumber: phoneNumber,
        caption: caption,
      );

      if (!context.mounted) return;
      if (shareResult.launched) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'WhatsApp opened with your receipt attached.',
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
            ),
            backgroundColor: const Color(0xFF16A34A),
          ),
        );
        return;
      }

      await showFailure(
        context: context,
        apiClient: apiClient,
        responseData: responseData,
        failureMessage:
            shareResult.errorMessage ??
            'We saved your order, but could not open WhatsApp with the receipt attached.',
      );
      return;
    }

    await showFailure(
      context: context,
      apiClient: apiClient,
      responseData: responseData,
      failureMessage:
          exportResult.errorMessage ??
          'We saved your order, but could not prepare the PDF receipt.',
    );
  }

  static Future<void> showFailure({
    required BuildContext context,
    required ApiClient apiClient,
    required dynamic responseData,
    required String failureMessage,
  }) async {
    final orderNumber = OrderExportService.extractOrderNumber(responseData);

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        Future<void> retryReceiptShare() async {
          final exportResult = await OrderExportService.downloadOrderReceipt(
            apiClient: apiClient,
            responseData: responseData,
          );
          if (!sheetContext.mounted) return;

          final orderFile = exportResult.file;
          final phoneNumber = OrderExportService.extractWhatsAppNumber(
            responseData,
          );
          final caption = OrderExportService.extractCaption(responseData);

          if (orderFile != null && phoneNumber != null) {
            final shareResult =
                await OrderExportService.shareOrderReceiptToWhatsApp(
                  orderFile,
                  phoneNumber: phoneNumber,
                  caption: caption,
                );
            if (!sheetContext.mounted) return;
            if (shareResult.launched) {
              Navigator.of(sheetContext).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'WhatsApp opened with your receipt attached.',
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  backgroundColor: const Color(0xFF16A34A),
                ),
              );
              return;
            }

            ScaffoldMessenger.of(sheetContext).showSnackBar(
              SnackBar(
                content: Text(
                  shareResult.errorMessage ??
                      'Unable to share the PDF receipt to WhatsApp.',
                ),
                backgroundColor: AppColors.error,
              ),
            );
            return;
          }

          ScaffoldMessenger.of(sheetContext).showSnackBar(
            SnackBar(
              content: Text(
                exportResult.errorMessage?.isNotEmpty == true
                    ? exportResult.errorMessage!
                    : 'Unable to prepare the PDF receipt for WhatsApp.',
              ),
              backgroundColor: AppColors.error,
            ),
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
                                    ? 'The order was saved, but sending the receipt to WhatsApp needs help.'
                                    : 'Order $orderNumber was saved, but sending the receipt to WhatsApp needs help.',
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
                          Icon(
                            Icons.info_outline_rounded,
                            color: const Color(0xFFEA580C),
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
                      child: OutlinedButton.icon(
                        onPressed: retryReceiptShare,
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        icon: const Icon(Icons.description_outlined),
                        label: Text(
                          'Retry Receipt Share',
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
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
