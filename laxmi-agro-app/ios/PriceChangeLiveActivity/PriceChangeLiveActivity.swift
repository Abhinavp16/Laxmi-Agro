import ActivityKit
import SwiftUI
import WidgetKit

@main
struct PriceChangeWidgets: WidgetBundle {
  var body: some Widget {
    if #available(iOS 16.1, *) {
      PriceChangeCountdownWidget()
    }
  }
}

struct LiveActivitiesAppAttributes: ActivityAttributes, Identifiable {
  public typealias LiveDeliveryData = ContentState

  public struct ContentState: Codable, Hashable {}

  var id = UUID()
}

private let sharedDefaults = UserDefaults(suiteName: "group.com.laxmiagro.app")!

@available(iOSApplicationExtension 16.1, *)
struct PriceChangeCountdownWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: LiveActivitiesAppAttributes.self) { context in
      PriceChangeLockScreenView(context: context)
        .activityBackgroundTint(Color(red: 0.08, green: 0.16, blue: 0.31))
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Label("Price", systemImage: "indianrupeesign.circle.fill")
            .font(.headline)
            .foregroundStyle(.green)
        }
        DynamicIslandExpandedRegion(.trailing) {
          countdownText(context)
            .font(.headline.monospacedDigit())
            .multilineTextAlignment(.trailing)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 6) {
            Text(readString("title", context) ?? "Price update scheduled")
              .font(.headline)
              .foregroundStyle(.white)
            Text(readString("body", context) ?? "Upcoming product prices will update soon.")
              .font(.subheadline)
              .foregroundStyle(.white.opacity(0.84))
              .lineLimit(2)
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        }
      } compactLeading: {
        Image(systemName: "indianrupeesign.circle.fill")
          .foregroundStyle(.green)
      } compactTrailing: {
        compactCountdownText(context)
      } minimal: {
        Image(systemName: "timer")
          .foregroundStyle(.green)
      }
    }
  }

  private func readString(_ key: String, _ context: ActivityViewContext<LiveActivitiesAppAttributes>) -> String? {
    sharedDefaults.string(forKey: context.attributes.prefixedKey(key))
  }

  private func readDate(_ key: String, _ context: ActivityViewContext<LiveActivitiesAppAttributes>) -> Date? {
    if let value = sharedDefaults.object(forKey: context.attributes.prefixedKey(key)) as? Date {
      return value
    }

    if let seconds = sharedDefaults.object(forKey: context.attributes.prefixedKey(key)) as? Double {
      return Date(timeIntervalSince1970: seconds / 1000)
    }

    if let text = sharedDefaults.string(forKey: context.attributes.prefixedKey(key)) {
      return ISO8601DateFormatter().date(from: text)
    }

    return nil
  }

  @ViewBuilder
  private func countdownText(_ context: ActivityViewContext<LiveActivitiesAppAttributes>) -> some View {
    if let effectiveAt = readDate("effectiveAt", context), effectiveAt > Date() {
      Text(timerInterval: Date()...effectiveAt, countsDown: true)
    } else {
      Text("Updating")
    }
  }

  @ViewBuilder
  private func compactCountdownText(_ context: ActivityViewContext<LiveActivitiesAppAttributes>) -> some View {
    if let effectiveAt = readDate("effectiveAt", context), effectiveAt > Date() {
      Text(timerInterval: Date()...effectiveAt, countsDown: true)
        .font(.caption2.monospacedDigit())
    } else {
      Text("Now")
        .font(.caption2.bold())
    }
  }
}

@available(iOSApplicationExtension 16.1, *)
private struct PriceChangeLockScreenView: View {
  let context: ActivityViewContext<LiveActivitiesAppAttributes>

  private var title: String {
    sharedDefaults.string(forKey: context.attributes.prefixedKey("title")) ??
      "Price update scheduled"
  }

  private var bodyText: String {
    sharedDefaults.string(forKey: context.attributes.prefixedKey("body")) ??
      "Upcoming product prices will update soon."
  }

  private var effectiveAt: Date? {
    if let value = sharedDefaults.object(forKey: context.attributes.prefixedKey("effectiveAt")) as? Date {
      return value
    }

    if let text = sharedDefaults.string(forKey: context.attributes.prefixedKey("effectiveAt")) {
      return ISO8601DateFormatter().date(from: text)
    }

    return nil
  }

  var body: some View {
    HStack(spacing: 14) {
      ZStack {
        Circle()
          .fill(Color.green.opacity(0.18))
          .frame(width: 54, height: 54)
        Image(systemName: "indianrupeesign.circle.fill")
          .font(.system(size: 28, weight: .semibold))
          .foregroundStyle(.green)
      }

      VStack(alignment: .leading, spacing: 6) {
        Text(title)
          .font(.headline)
          .foregroundStyle(.white)
          .lineLimit(1)

        Text(bodyText)
          .font(.subheadline)
          .foregroundStyle(.white.opacity(0.84))
          .lineLimit(2)

        if let effectiveAt, effectiveAt > Date() {
          HStack(spacing: 8) {
            Text("Time left")
              .font(.caption.weight(.semibold))
              .foregroundStyle(.white.opacity(0.72))
            Text(timerInterval: Date()...effectiveAt, countsDown: true)
              .font(.caption.monospacedDigit())
              .foregroundStyle(.green)
          }
        } else {
          Text("Applying now")
            .font(.caption.weight(.semibold))
            .foregroundStyle(.green)
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(.vertical, 6)
  }
}

extension LiveActivitiesAppAttributes {
  func prefixedKey(_ key: String) -> String {
    "\(id)_\(key)"
  }
}
