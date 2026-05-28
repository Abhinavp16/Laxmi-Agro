import AppKit
import Foundation
import PDFKit

guard CommandLine.arguments.count >= 3 else {
  fputs("Usage: swift renderPdfPages.swift <pdf-path> <output-dir>\n", stderr)
  exit(1)
}

let pdfPath = CommandLine.arguments[1]
let outputDir = CommandLine.arguments[2]
let scale: CGFloat = 2.0

let pdfUrl = URL(fileURLWithPath: pdfPath)
let outputUrl = URL(fileURLWithPath: outputDir, isDirectory: true)

guard let document = PDFDocument(url: pdfUrl) else {
  fputs("Failed to open PDF at \(pdfPath)\n", stderr)
  exit(1)
}

try FileManager.default.createDirectory(at: outputUrl, withIntermediateDirectories: true)

for pageIndex in 0..<document.pageCount {
  guard let page = document.page(at: pageIndex) else { continue }

  let pageNumber = pageIndex + 1
  let bounds = page.bounds(for: .mediaBox)
  let width = max(Int(bounds.width * scale), 1)
  let height = max(Int(bounds.height * scale), 1)

  guard let context = CGContext(
    data: nil,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  ) else {
    fputs("Failed to create drawing context for page \(pageNumber)\n", stderr)
    exit(1)
  }

  context.setFillColor(NSColor.white.cgColor)
  context.fill(CGRect(x: 0, y: 0, width: width, height: height))
  context.translateBy(x: 0, y: CGFloat(height))
  context.scaleBy(x: scale, y: -scale)
  page.draw(with: .mediaBox, to: context)

  guard let cgImage = context.makeImage() else {
    fputs("Failed to render page \(pageNumber)\n", stderr)
    exit(1)
  }

  let rep = NSBitmapImageRep(cgImage: cgImage)
  guard let pngData = rep.representation(using: .png, properties: [:]) else {
    fputs("Failed to encode page \(pageNumber) as PNG\n", stderr)
    exit(1)
  }

  let fileUrl = outputUrl.appendingPathComponent(String(format: "page-%d.png", pageNumber))
  try pngData.write(to: fileUrl)
}

print("Rendered \(document.pageCount) pages to \(outputDir)")
