class UserModel {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final String? avatar;
  final String? address;
  final bool phoneVerified;
  final bool isActive;
  final BusinessInfo? businessInfo;
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    this.avatar,
    this.address,
    this.phoneVerified = false,
    this.isActive = true,
    this.businessInfo,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      role: json['role'] ?? 'buyer',
      avatar: json['avatar'],
      address: json['address'],
      phoneVerified: json['phoneVerified'] ?? false,
      isActive: json['isActive'] ?? true,
      businessInfo: json['businessInfo'] != null
          ? BusinessInfo.fromJson(json['businessInfo'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role,
      'avatar': avatar,
      'address': address,
      'phoneVerified': phoneVerified,
      'isActive': isActive,
      'businessInfo': businessInfo?.toJson(),
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  bool get isWholesaler => role == 'wholesaler';
  bool get isAdmin => role == 'admin';
  bool get isBuyer => role == 'buyer';
}

class BusinessInfo {
  final String? businessName;
  final String? gstNumber;
  final bool verified;
  final String? status;

  BusinessInfo({
    this.businessName,
    this.gstNumber,
    this.verified = false,
    this.status,
  });

  factory BusinessInfo.fromJson(Map<String, dynamic> json) {
    return BusinessInfo(
      businessName: json['businessName'],
      gstNumber: json['gstNumber'],
      verified: json['verified'] ?? false,
      status: json['status'] ?? 'none',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'businessName': businessName,
      'gstNumber': gstNumber,
      'verified': verified,
      'status': status,
    };
  }
}
