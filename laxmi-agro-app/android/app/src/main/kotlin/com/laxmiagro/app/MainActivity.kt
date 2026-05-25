package com.laxmiagro.app

import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity : FlutterActivity() {
    companion object {
        private const val CHANNEL = "laxmi_agro/whatsapp_share"
        private const val WHATSAPP_PACKAGE = "com.whatsapp"
        private const val PDF_MIME = "application/pdf"
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            CHANNEL,
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                "shareDocumentToWhatsApp" -> {
                    val filePath = call.argument<String>("filePath")
                    val phoneNumber = call.argument<String>("phoneNumber")
                    val caption = call.argument<String>("caption")

                    if (filePath.isNullOrBlank()) {
                        result.error("INVALID_ARGUMENT", "filePath is required", null)
                        return@setMethodCallHandler
                    }

                    if (phoneNumber.isNullOrBlank()) {
                        result.error("INVALID_ARGUMENT", "phoneNumber is required", null)
                        return@setMethodCallHandler
                    }

                    shareDocumentToWhatsApp(filePath, phoneNumber, caption, result)
                }

                else -> result.notImplemented()
            }
        }
    }

    private fun shareDocumentToWhatsApp(
        filePath: String,
        phoneNumber: String,
        caption: String?,
        result: MethodChannel.Result,
    ) {
        val file = File(filePath)
        if (!file.exists()) {
            result.error("FILE_MISSING", "The exported order receipt was not found", null)
            return
        }

        val uri: Uri = FileProvider.getUriForFile(
            this,
            "${applicationContext.packageName}.fileprovider",
            file,
        )
        val sanitizedPhone = sanitizePhoneForWhatsApp(phoneNumber)
        val jid = "$sanitizedPhone@s.whatsapp.net"

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = PDF_MIME
            `package` = WHATSAPP_PACKAGE
            putExtra(Intent.EXTRA_STREAM, uri)
            if (!caption.isNullOrBlank()) {
                putExtra(Intent.EXTRA_TEXT, caption)
                putExtra("android.intent.extra.TEXT", caption)
                putExtra("text", caption)
                putExtra(Intent.EXTRA_SUBJECT, caption)
            }
            putExtra("jid", jid)
            putStringArrayListExtra("jids", arrayListOf(jid))
            putExtra("mime_type", PDF_MIME)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            clipData = ClipData.newUri(contentResolver, file.name, uri)
        }

        val canResolve = intent.resolveActivity(packageManager) != null
        if (!canResolve) {
            result.error(
                "WHATSAPP_NOT_INSTALLED",
                "WhatsApp is not installed or cannot handle document sharing",
                null,
            )
            return
        }

        try {
            startActivity(intent)
            result.success(true)
        } catch (error: ActivityNotFoundException) {
            result.error(
                "WHATSAPP_NOT_INSTALLED",
                "WhatsApp is not installed or cannot handle document sharing",
                error.localizedMessage,
            )
        } catch (error: Exception) {
            result.error(
                "WHATSAPP_LAUNCH_FAILED",
                "Could not launch WhatsApp document share",
                error.localizedMessage,
            )
        }
    }

    private fun sanitizePhoneForWhatsApp(value: String): String {
        val digits = value.filter { it.isDigit() }
        return when {
            digits.length == 10 -> "91$digits"
            digits.length == 12 && digits.startsWith("91") -> digits
            else -> digits
        }
    }
}
