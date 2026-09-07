# Laxmi Agro v1.0.2 Release

**Release Date:** September 5, 2026  
**Build:** v1.0.2+4  
**Commit:** 4f61f36

## Build Artifacts

### Android
- **APK:** `build/app/outputs/flutter-apk/app-release.apk`
- **Size:** 62 MB
- **API Configuration:** Connected to original backend (https://api.laxmiagroenterprises.com/api/v1)

### iOS
- **IPA:** `build/ios/ipa/Laxmi Agro.ipa`
- **Size:** 27 MB
- **Version:** 1.0.2 (Build 4)
- **Deployment Target:** iOS 13.0+
- **Signing:** Automatically signed with development team UW9NZM7BNP

## New Features

### ✨ View Customer App (Guest Mode Preview)
Wholesalers can now view the customer experience from their profile:

**Feature Highlights:**
- New "View Customer App" option in Wholesaler section of profile
- Real product data displayed (not mock data)
- Blue banner showing "Viewing as Customer"
- Purchase functionality disabled with explanatory popups:
  - Add to Cart blocked
  - Buy Now blocked
  - Checkout blocked
- Available for all wholesaler account types
- One-click exit to return to wholesaler account

**Technical Implementation:**
- New provider: `guest_mode_provider.dart`
- New screen: `guest_app_preview_screen.dart`
- Route: `/guest-app-preview`
- Guest mode checks in:
  - `marketplace_home_screen.dart` (_proceedToCheckout)
  - `product_detail_screen.dart` (Add to Cart, Buy Now, related products)

## Bug Fixes
- None in this release

## Backend Configuration
- **API Base URL:** https://api.laxmiagroenterprises.com/api/v1
- **Status:** Connected to original backend
- **Authentication:** JWT token-based
- **Timeouts:** 15 seconds (connect), 15 seconds (receive)

## Installation Instructions

### Android
1. Download the APK from build artifacts
2. Enable "Unknown sources" in device settings
3. Open and install the APK
4. Grant required permissions when prompted
5. Sign in with your wholesaler account

### iOS
1. Use Apple Transporter to upload IPA to App Store
2. Or use `xcrun altool --upload-app` with API key
3. Distribute via TestFlight or App Store release

## Testing Checklist
- [x] Feature compiles without errors
- [x] Guest mode enables/disables correctly
- [x] Purchase functions properly blocked
- [x] Explanatory popups display
- [x] Exit mechanism works
- [x] Real products load in guest mode
- [x] Backend connectivity verified

## Known Issues
- None

## Future Improvements
- Add guest mode tutorial/onboarding
- Add statistics on feature usage
- Expand guest mode to other wholesaler features

## Git Information
- **Main Branch:** Updated to v1.0.2
- **Tag:** v1.0.2 created
- **Commits:** 2
  - 00dfb51: feat: Add View Customer App feature
  - 4f61f36: chore: Bump version to 1.0.2+4

## Support
For issues or questions, contact: support@laxmiagroenterprises.com
