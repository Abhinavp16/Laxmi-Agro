import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../models/user_model.dart';
import '../services/storage_service.dart';
import '../services/api_client.dart';

// Auth State
class AuthState {
  final UserModel? user;
  final bool isLoading;
  final bool isAuthenticated;
  final String? error;

  AuthState({
    this.user,
    this.isLoading = false,
    this.isAuthenticated = false,
    this.error,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    bool? isAuthenticated,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: error,
    );
  }
}

// Auth Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;

  AuthNotifier(this._apiClient) : super(AuthState()) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);

    try {
      final token = await StorageService.getAccessToken();
      final userData = await StorageService.getUserData();

      debugPrint(
        '[Auth] Token: ${token != null ? 'exists' : 'null'}, UserData: ${userData != null ? 'exists' : 'null'}',
      );

      if (token != null && userData != null) {
        final user = UserModel.fromJson(userData);
        state = state.copyWith(
          user: user,
          isAuthenticated: true,
          isLoading: false,
        );
        // Sync with server in background to get latest role/info
        fetchCurrentUser();
      } else {
        state = state.copyWith(isLoading: false, isAuthenticated: false);
      }
    } catch (e) {
      debugPrint('[Auth] _checkAuthStatus error: $e');
      state = state.copyWith(isLoading: false, isAuthenticated: false);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final user = UserModel.fromJson(data['user']);

        await StorageService.saveTokens(
          data['accessToken'],
          data['refreshToken'],
        );
        await StorageService.saveUserData(data['user']);

        state = state.copyWith(
          user: user,
          isAuthenticated: true,
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.data['message'] ?? 'Login failed',
        );
        return false;
      }
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] ?? 'Network error. Please try again.';
      state = state.copyWith(isLoading: false, error: message);
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'An unexpected error occurred',
      );
      return false;
    }
  }

  Future<bool> loginWithPhone({
    required String phone,
    required String password,
    required String expectedRole,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.post(
        '/auth/login-phone',
        data: {
          'phone': phone,
          'password': password,
          'expectedRole': expectedRole,
        },
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final user = UserModel.fromJson(data['user']);

        await StorageService.saveTokens(
          data['accessToken'],
          data['refreshToken'],
        );
        await StorageService.saveUserData(data['user']);

        state = state.copyWith(
          user: user,
          isAuthenticated: true,
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.data['message'] ?? 'Login failed',
        );
        return false;
      }
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] ?? 'Network error. Please try again.';
      state = state.copyWith(isLoading: false, error: message);
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'An unexpected error occurred',
      );
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.post(
        '/auth/register',
        data: {
          'name': name,
          'email': email,
          'password': password,
          'phone': phone,
        },
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final user = UserModel.fromJson(data['user']);

        await StorageService.saveTokens(
          data['accessToken'],
          data['refreshToken'],
        );
        await StorageService.saveUserData(data['user']);

        state = state.copyWith(
          user: user,
          isAuthenticated: true,
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.data['message'] ?? 'Registration failed',
        );
        return false;
      }
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] ?? 'Network error. Please try again.';
      state = state.copyWith(isLoading: false, error: message);
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'An unexpected error occurred',
      );
      return false;
    }
  }

  Future<bool> registerWithPhone({
    required String name,
    required String phone,
    required String password,
    required bool isWholesaler,
    String? businessName,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final endpoint = isWholesaler
          ? '/auth/register-phone/wholesaler'
          : '/auth/register-phone';
      final response = await _apiClient.post(
        endpoint,
        data: {
          'name': name,
          'phone': phone,
          'password': password,
          if (isWholesaler && businessName != null)
            'businessName': businessName,
        },
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final user = UserModel.fromJson(data['user']);

        await StorageService.saveTokens(
          data['accessToken'],
          data['refreshToken'],
        );
        await StorageService.saveUserData(data['user']);

        state = state.copyWith(
          user: user,
          isAuthenticated: true,
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.data['message'] ?? 'Registration failed',
        );
        return false;
      }
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] ?? 'Network error. Please try again.';
      state = state.copyWith(isLoading: false, error: message);
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'An unexpected error occurred',
      );
      return false;
    }
  }

  Future<bool> updateProfile({
    String? name,
    String? avatar,
    String? phone,
    String? address,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final data = <String, dynamic>{};
      if (name != null) data['name'] = name;
      if (avatar != null) data['avatar'] = avatar;
      if (phone != null) data['phone'] = phone;
      if (address != null) data['address'] = address;

      final response = await _apiClient.put(
        '/auth/profile',
        data: data,
      );

      if (response.data['success'] == true) {
        final user = UserModel.fromJson(response.data['data']);
        state = state.copyWith(user: user, isLoading: false);
        await StorageService.saveUserData(response.data['data']);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.data['message'] ?? 'Update failed',
        );
        return false;
      }
    } on DioException catch (e) {
      final message = e.response?.data?['message'] ?? 'Network error';
      state = state.copyWith(isLoading: false, error: message);
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'An unexpected error occurred',
      );
      return false;
    }
  }

  Future<String?> uploadProfileAvatar(String filePath) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final formData = FormData.fromMap({
        'avatar': await MultipartFile.fromFile(filePath),
      });
      final response = await _apiClient.post(
        '/auth/profile/avatar',
        data: formData,
      );

      if (response.data['success'] == true) {
        final userData = response.data['data']['user'];
        final user = UserModel.fromJson(userData);
        state = state.copyWith(user: user, isLoading: false);
        await StorageService.saveUserData(userData);
        return response.data['data']['avatarUrl']?.toString();
      }

      state = state.copyWith(
        isLoading: false,
        error: response.data['message'] ?? 'Avatar upload failed',
      );
      return null;
    } on DioException catch (e) {
      final message = e.response?.data?['message'] ?? 'Avatar upload failed';
      state = state.copyWith(isLoading: false, error: message);
      return null;
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'An unexpected error occurred',
      );
      return null;
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await StorageService.getRefreshToken();
      if (refreshToken != null) {
        await _apiClient.post(
          '/auth/logout',
          data: {'refreshToken': refreshToken},
        );
      }
    } catch (_) {}

    await StorageService.clearAll();
    state = AuthState();
  }

  void updateUser(UserModel user) {
    state = state.copyWith(user: user);
    StorageService.saveUserData(user.toJson());
  }

  Future<void> fetchCurrentUser() async {
    try {
      final response = await _apiClient.get('/auth/me');
      if (response.data['success'] == true) {
        final user = UserModel.fromJson(response.data['data']['user'] ?? response.data['data']);
        state = state.copyWith(user: user);
        await StorageService.saveUserData(response.data['data']['user'] ?? response.data['data']);
      }
    } catch (e) {
      debugPrint('[Auth] fetchCurrentUser error: \$e');
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Providers
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthNotifier(apiClient);
});
