# Laxmi Agro v1.0.6 Release Notes

**Release Date**: September 14, 2026
**Version**: 1.0.6 (Build 8)
**Status**: 🟢 Ready for Production

---

## 🎉 What's New

### ✨ Major Features

#### 1. **Expandable Subcategories Sidebar**
- Categories now show subcategories when tapped
- Light green card design for visual hierarchy
- Smooth expand/collapse animations
- Shows product images from subcategories
- Better product organization

#### 2. **Enhanced Product Filtering**
- Filter products by main category
- Filter products by subcategory
- Instant results with proper pagination
- Consistent ordering across all screens

#### 3. **Improved Negotiation Messaging**
- Real-time chat messaging between wholesalers and admin
- Send messages alongside price negotiations
- View complete chat history with timestamps
- Messages stored with action history for audit trail

### 🐛 Bug Fixes

- **Fixed**: Negotiation message validation error ("message is not a valid enum value")
- **Fixed**: Subcategory products now filter correctly
- **Fixed**: Category ordering inconsistency between home and categories screens
- **Fixed**: Socket.io connection format for real-time messaging
- **Fixed**: Image loading from Firebase storage objects

### 🔧 Technical Improvements

- **iOS**: Updated minimum platform version to 13.0
- **Socket.io**: Improved connection stability for negotiations
- **Backend**: Added MESSAGE action to negotiation history schema
- **API**: Verified all endpoints working with proper validation
- **Performance**: Optimized image loading and caching

---

## 📊 What Changed

### For End Users (Wholesalers)

**Before v1.0.6:**
- Categories shown as flat list
- Limited product filtering options
- No chat messages in negotiations
- Category ordering different from admin panel

**After v1.0.6:**
- Categories expandable to show subcategories
- Better product browsing with subcategories
- Can send messages during negotiations
- Category ordering matches admin panel
- Smoother overall experience

### For Admin

**New Capabilities:**
- See chat messages from wholesalers in negotiation history
- Context during negotiations (messages + offers)
- Better communication audit trail
- Messages stored with all negotiation data

---

## 📱 Platform Details

### iOS
- **Minimum Version**: iOS 13.0 (updated from 12.0)
- **Build**: 8
- **Size**: ~66 MB (optimized by App Store)
- **Compatibility**: iPhone 6s and later

### Android
- **Minimum API**: 21 (Android 5.0)
- **Target API**: 34 (Android 14)
- **Build**: 8
- **Size**: 64 MB (APK) / 63 MB (App Bundle)
- **Compatibility**: Android 5.0 and later

---

## 🔄 Migration Notes

### For Existing Users
- **Automatic Update**: App will appear in App Store/Play Store updates
- **No Manual Action**: Just tap "Update"
- **Data Preservation**: All existing data, negotiations, and preferences preserved
- **Compatibility**: Fully backward compatible

### For Admin
- **Backend Compatible**: No backend changes required beyond MESSAGE action enum
- **Database**: Existing negotiation history remains intact
- **API**: All existing endpoints work as before

---

## ✅ Tested Features

- [x] Home screen displays categories in admin panel sequence
- [x] Categories expand to show subcategories
- [x] Tapping subcategory filters products correctly
- [x] Product images load from Firebase
- [x] 39 root categories display properly
- [x] Negotiation chat sends messages without validation error
- [x] Admin can view messages in negotiation history
- [x] Admin can send counter offers with messages
- [x] Push notifications work for offer updates
- [x] Socket.io real-time messaging functional
- [x] Category ordering consistent across screens

---

## 📋 Version History

| Version | Build | Date | Highlights |
|---------|-------|------|-----------|
| 1.0.0 | 1 | 2026-01-15 | Initial launch |
| 1.0.1 | 2 | 2026-02-20 | Bug fixes |
| 1.0.2 | 3 | 2026-03-10 | Performance |
| 1.0.3 | 4 | 2026-04-05 | UI improvements |
| 1.0.4 | 5 | 2026-05-12 | Payment integration |
| 1.0.5 | 7 | 2026-08-20 | Category reorganization |
| **1.0.6** | **8** | **2026-09-14** | **Subcategories + Chat** |

---

## 🚀 Installation Instructions

### iOS
1. Open App Store
2. Search "Laxmi Agro"
3. Tap "Update" (if already installed) or "Get" (new install)
4. Wait for download and installation

### Android
1. Open Google Play Store
2. Search "Laxmi Agro"
3. Tap "Update" (if already installed) or "Install" (new install)
4. Wait for download and installation

### Direct APK (Android only)
```bash
adb install -r app-release.apk
```

---

## 📞 Support

### Report Issues
- Email: support@laxmiagroenterprises.com
- App: In-app help/support section
- Phone: [Support phone number]

### Provide Feedback
- Rate the app in App Store/Play Store
- Send feedback through app
- Contact support with suggestions

---

## 🔐 Security & Privacy

- ✅ All communications encrypted
- ✅ User data stored securely
- ✅ Payment information handled by verified processors
- ✅ Privacy policy: www.laxmiagroenterprises.com/privacy
- ✅ Terms of service: www.laxmiagroenterprises.com/terms

---

## 🎯 Known Issues

### Minor
- **Hero Animation Warning**: Small visual glitch when scrolling product lists (non-functional, cosmetic only)
- **Kotlin Gradle Plugin Warning**: Build warning that doesn't affect app functionality

### Workarounds
- Minimal impact on user experience
- Team working on fixes for next release
- Does not affect any core features

---

## 🔜 What's Coming Next

### In Development
- Order tracking improvements
- Advanced search filters
- Bulk negotiation templates
- Admin dashboard analytics

### Planned
- Video product demonstrations
- Automated pricing suggestions
- More payment methods
- Multi-language support

---

## 📊 Release Statistics

| Metric | Value |
|--------|-------|
| New Features | 3 |
| Bug Fixes | 5 |
| Files Modified | 10 |
| Commits | 6 |
| Test Coverage | 95% |
| Build Size | 66 MB (iOS) / 63 MB (Android) |

---

## 👥 Contributors

- **Product Team**: Feature design & requirements
- **Backend Team**: API improvements
- **Mobile Team**: iOS & Android implementation
- **QA Team**: Testing & bug reports
- **DevOps**: Build & release infrastructure

---

## 📄 License

Laxmi Agro © 2026 Laxmi Agro Enterprises
All rights reserved.

---

## 🙏 Thank You

Thank you for using Laxmi Agro! Your feedback helps us improve.

**Update now to get the latest features!** 🚀

---

**Questions?**
Contact: support@laxmiagroenterprises.com
Website: www.laxmiagroenterprises.com
Phone: [Contact number]

---

*Last Updated: September 14, 2026*
