import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../core/providers/auth_provider.dart';
import '../../core/theme/app_fonts.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen>
    with TickerProviderStateMixin {
  // Controllers
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _nameController = TextEditingController();
  final _businessNameController = TextEditingController();

  // State
  bool _isLogin = true;
  bool _isWholesaler = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _agreedToOxonCallsAndMessages = false;
  bool _showPolicyDetails = false;
  File? _documentFile;

  // Animation Controllers
  late AnimationController _slideController;
  late AnimationController _fadeController;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  // Colors
  static const _primaryGreen = Color(0xFF2D6A4F);
  static const _primaryBlue = Color(0xFF1D4ED8);
  static const _backgroundLight = Color(0xFFF8FAF9);
  static const _textDark = Color(0xFF1A1A1A);
  static const _textMuted = Color(0xFF6B7280);
  static const _borderColor = Color(0xFFE5E7EB);

  Color get _primaryColor => _isWholesaler ? _primaryBlue : _primaryGreen;

  @override
  void initState() {
    super.initState();
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0.05, 0), end: Offset.zero).animate(
          CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic),
        );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _fadeController, curve: Curves.easeIn));

    _slideController.forward();
    _fadeController.forward();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _nameController.dispose();
    _businessNameController.dispose();
    _slideController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  void _toggleAuthMode() async {
    await _fadeController.reverse();
    setState(() {
      _isLogin = !_isLogin;
      if (!_isLogin) {
        _isWholesaler = false;
      }
      _clearFields();
    });
    _slideController.reset();
    _slideController.forward();
    _fadeController.forward();
  }

  void _toggleRole(bool isWholesaler) {
    if (_isWholesaler == isWholesaler) return;

    setState(() {
      _isWholesaler = isWholesaler;
      _documentFile = null;
    });
  }

  void _clearFields() {
    _phoneController.clear();
    _passwordController.clear();
    _confirmPasswordController.clear();
    _nameController.clear();
    _businessNameController.clear();
    _agreedToOxonCallsAndMessages = false;
    _showPolicyDetails = false;
    _documentFile = null;
  }

  Future<void> _pickDocument() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _documentFile = File(image.path);
      });
    }
  }

  Future<void> _handleSubmit() async {
    final phone = _phoneController.text.trim();
    final password = _passwordController.text;

    if (phone.isEmpty || phone.length < 10) {
      _showError('Please enter a valid phone number');
      return;
    }
    if (password.isEmpty || password.length < 6) {
      _showError('Password must be at least 6 characters');
      return;
    }

    if (_isLogin) {
      final success = await ref
          .read(authProvider.notifier)
          .loginWithPhone(
            phone: phone,
            password: password,
            expectedRole: _isWholesaler ? 'wholesaler' : 'buyer',
          );
      if (success && mounted) {
        context.go('/home');
      }
    } else {
      final name = _nameController.text.trim();
      if (name.isEmpty) {
        _showError('Please enter your name');
        return;
      }
      if (_confirmPasswordController.text != password) {
        _showError('Passwords do not match');
        return;
      }
      if (!_agreedToOxonCallsAndMessages) {
        _showError('Please accept Terms & Conditions and Privacy Policy');
        return;
      }

      final success = await ref
          .read(authProvider.notifier)
          .registerWithPhone(
            name: name,
            phone: phone,
            password: password,
            isWholesaler: _isWholesaler,
            businessName: _isWholesaler
                ? _businessNameController.text.trim()
                : null,
          );
      if (success && mounted) {
        context.go('/home');
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: AppFonts.bodyMedium(color: Colors.white)),
        backgroundColor: const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: _backgroundLight,
        body: SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 40),

                      // Logo
                      _buildLogo(),
                      const SizedBox(height: 32),

                      // Title
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 300),
                        child: Text(
                          _isLogin ? 'Welcome Back' : 'Create Account',
                          key: ValueKey(_isLogin),
                          style: AppFonts.h1(color: _textDark),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _isLogin
                            ? 'Sign in to continue to OXON'
                            : 'Join OXON today',
                        style: AppFonts.bodyMedium(color: _textMuted),
                      ),
                      const SizedBox(height: 32),

                      // Role Toggle
                      if (_isLogin) ...[
                        _buildRoleToggle(),
                        const SizedBox(height: 28),
                      ],

                      // Error Message
                      if (authState.error != null) ...[
                        _buildErrorBanner(authState.error!),
                        const SizedBox(height: 20),
                      ],

                      // Form Fields
                      _buildForm(),
                      const SizedBox(height: 28),

                      if (!_isLogin) ...[
                        _buildOxonConsentCheckbox(),
                        const SizedBox(height: 20),
                      ],

                      // Submit Button
                      _buildSubmitButton(authState.isLoading),
                      const SizedBox(height: 24),

                      // Toggle Auth Mode
                      _buildAuthToggle(),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Center(
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: _primaryColor.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Image.asset('assets/images/oxon logo.jpeg', fit: BoxFit.cover),
        ),
      ),
    );
  }

  Widget _buildRoleToggle() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(child: _buildRoleButton('Customer', false)),
          Expanded(child: _buildRoleButton('Wholesaler', true)),
        ],
      ),
    );
  }

  Widget _buildRoleButton(String label, bool isWholesaler) {
    final isSelected = _isWholesaler == isWholesaler;

    return GestureDetector(
      onTap: () => _toggleRole(isWholesaler),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? _primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: Text(
            label,
            style: AppFonts.labelLarge(
              color: isSelected ? Colors.white : _textMuted,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildErrorBanner(String error) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFCA5A5)),
      ),
      child: Row(
        children: [
          const HugeIcon(
            icon: HugeIcons.strokeRoundedAlertCircle,
            color: Color(0xFFDC2626),
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              error,
              style: AppFonts.bodySmall(color: const Color(0xFFDC2626)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return AnimatedSize(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Name field (signup only)
          if (!_isLogin) ...[
            _buildTextField(
              controller: _nameController,
              label: 'Full Name',
              hint: 'Enter your name',
              icon: HugeIcons.strokeRoundedUser,
              textCapitalization: TextCapitalization.words,
            ),
            const SizedBox(height: 16),
          ],

          // Phone field
          _buildTextField(
            controller: _phoneController,
            label: 'Phone Number',
            hint: '10-digit mobile number',
            icon: HugeIcons.strokeRoundedCall,
            keyboardType: TextInputType.phone,
            prefix: '+91 ',
            maxLength: 10,
          ),
          const SizedBox(height: 16),

          // Password field
          _buildTextField(
            controller: _passwordController,
            label: 'Password',
            hint: 'Enter your password',
            icon: HugeIcons.strokeRoundedLockPassword,
            isPassword: true,
            obscureText: _obscurePassword,
            onToggleObscure: () =>
                setState(() => _obscurePassword = !_obscurePassword),
          ),

          // Confirm password (signup only)
          if (!_isLogin) ...[
            const SizedBox(height: 16),
            _buildTextField(
              controller: _confirmPasswordController,
              label: 'Confirm Password',
              hint: 'Re-enter your password',
              icon: HugeIcons.strokeRoundedLockPassword,
              isPassword: true,
              obscureText: _obscureConfirmPassword,
              onToggleObscure: () => setState(
                () => _obscureConfirmPassword = !_obscureConfirmPassword,
              ),
            ),
          ],

          // Wholesaler fields
          if (!_isLogin && _isWholesaler) ...[
            const SizedBox(height: 16),
            _buildTextField(
              controller: _businessNameController,
              label: 'Business Name',
              hint: 'Your shop or company name',
              icon: HugeIcons.strokeRoundedStore01,
              required: false,
            ),
            const SizedBox(height: 16),
            _buildDocumentPicker(),
          ],

          // Forgot password (login only)
          if (_isLogin) ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Forgot Password?',
                  style: AppFonts.bodySmall(
                    color: _primaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onToggleObscure,
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
    String? prefix,
    int? maxLength,
    bool required = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: AppFonts.labelMedium(color: _textDark)),
            if (!required) ...[
              const SizedBox(width: 6),
              Text('(Optional)', style: AppFonts.caption(color: _textMuted)),
            ],
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _borderColor),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: TextField(
            controller: controller,
            obscureText: obscureText,
            keyboardType: keyboardType,
            textCapitalization: textCapitalization,
            maxLength: maxLength,
            style: AppFonts.bodyLarge(color: _textDark),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: AppFonts.bodyMedium(color: const Color(0xFFADB5BD)),
              prefixIcon: HugeIcon(icon: icon, color: _textMuted, size: 22),
              prefixText: prefix,
              prefixStyle: AppFonts.bodyLarge(color: _textDark),
              suffixIcon: isPassword
                  ? IconButton(
                      icon: HugeIcon(
                        icon: obscureText
                            ? HugeIcons.strokeRoundedViewOff
                            : HugeIcons.strokeRoundedView,
                        color: _textMuted,
                        size: 22,
                      ),
                      onPressed: onToggleObscure,
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
              counterText: '',
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDocumentPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Business Document',
              style: AppFonts.labelMedium(color: _textDark),
            ),
            const SizedBox(width: 6),
            Text('(Optional)', style: AppFonts.caption(color: _textMuted)),
          ],
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickDocument,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: _documentFile != null
                  ? _primaryColor.withOpacity(0.05)
                  : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _documentFile != null ? _primaryColor : _borderColor,
                width: _documentFile != null ? 1.5 : 1,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _documentFile != null
                        ? _primaryColor.withOpacity(0.1)
                        : const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: HugeIcon(
                    icon: _documentFile != null
                        ? HugeIcons.strokeRoundedCheckmarkCircle01
                        : HugeIcons.strokeRoundedFileUpload,
                    color: _documentFile != null ? _primaryColor : _textMuted,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _documentFile != null
                            ? 'Document Selected'
                            : 'Upload Document',
                        style: AppFonts.bodyMedium(
                          color: _textDark,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _documentFile != null
                            ? _documentFile!.path.split('/').last
                            : 'GST certificate, trade license, etc.',
                        style: AppFonts.caption(color: _textMuted),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                if (_documentFile != null)
                  IconButton(
                    icon: const HugeIcon(
                      icon: HugeIcons.strokeRoundedCancel01,
                      color: Colors.grey,
                      size: 20,
                    ),
                    onPressed: () => setState(() => _documentFile = null),
                    color: _textMuted,
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton(bool isLoading) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: isLoading ? null : _handleSubmit,
        style: ElevatedButton.styleFrom(
          backgroundColor: _primaryColor,
          foregroundColor: Colors.white,
          disabledBackgroundColor: _primaryColor.withOpacity(0.6),
          elevation: 0,
          shadowColor: _primaryColor.withOpacity(0.3),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: Colors.white,
                ),
              )
            : Text(
                _isLogin ? 'Sign In' : 'Create Account',
                style: AppFonts.button(color: Colors.white),
              ),
      ),
    );
  }

  Widget _buildOxonConsentCheckbox() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Checkbox(
                value: _agreedToOxonCallsAndMessages,
                onChanged: (value) => setState(
                  () => _agreedToOxonCallsAndMessages = value ?? false,
                ),
                activeColor: _primaryColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(6),
                ),
                side: const BorderSide(color: Color(0xFFC7C7CC), width: 1.5),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(
                    'By continuing, you agree to our Terms & Conditions and Privacy Policy.',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppFonts.bodyMedium(
                      color: _textMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              IconButton(
                onPressed: () =>
                    setState(() => _showPolicyDetails = !_showPolicyDetails),
                icon: Icon(
                  _showPolicyDetails
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  color: _textMuted,
                ),
              ),
            ],
          ),
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 220),
            crossFadeState: _showPolicyDetails
                ? CrossFadeState.showFirst
                : CrossFadeState.showSecond,
            firstChild: Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '- We collect basic details like name, phone, email, and app usage data.',
                    style: AppFonts.bodySmall(color: _textMuted),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '- We use this data to process orders, provide support, and improve services.',
                    style: AppFonts.bodySmall(color: _textMuted),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '- We share data only with logistics, payment, service partners, or legal authorities.',
                    style: AppFonts.bodySmall(color: _textMuted),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '- You can request access, correction, or deletion of your data where permitted.',
                    style: AppFonts.bodySmall(color: _textMuted),
                  ),
                ],
              ),
            ),
            secondChild: const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _buildAuthToggle() {
    return Center(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            _isLogin ? "Don't have an account? " : 'Already have an account? ',
            style: AppFonts.bodyMedium(color: _textMuted),
          ),
          GestureDetector(
            onTap: _toggleAuthMode,
            child: Text(
              _isLogin ? 'Sign Up' : 'Sign In',
              style: AppFonts.bodyMedium(
                color: _primaryColor,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
