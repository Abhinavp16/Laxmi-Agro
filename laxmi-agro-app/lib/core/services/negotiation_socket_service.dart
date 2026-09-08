import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';

typedef MessageCallback = void Function(Map<String, dynamic> data);
typedef TypingCallback = void Function(String userId, String username);
typedef ReadReceiptCallback = void Function(String messageId, String userId);
typedef UserStatusCallback = void Function(String userId, String userRole, bool isOnline);

class NegotiationSocketService {
  static final NegotiationSocketService _instance =
      NegotiationSocketService._internal();

  factory NegotiationSocketService() {
    return _instance;
  }

  NegotiationSocketService._internal();

  IO.Socket? _socket;
  bool _isConnected = false;
  String? _currentNegotiationId;

  // Callbacks
  MessageCallback? onMessageReceived;
  TypingCallback? onUserTyping;
  TypingCallback? onStopTyping;
  ReadReceiptCallback? onReadReceipt;
  UserStatusCallback? onUserStatus;
  VoidCallback? onConnect;
  VoidCallback? onDisconnect;

  bool get isConnected => _isConnected;

  /// Initialize and connect to Socket.io server
  void connect({
    required String serverUrl,
    required String negotiationId,
    required String userId,
    required String userRole,
    String? username,
  }) {
    if (_isConnected && _currentNegotiationId == negotiationId) {
      return; // Already connected to this negotiation
    }

    _currentNegotiationId = negotiationId;

    final socketOptions = {
      'transports': ['websocket'],
      'autoConnect': true,
      'reconnection': true,
      'reconnectionDelay': 1000,
      'reconnectionDelayMax': 5000,
      'reconnectionAttempts': 10,
    };

    _socket = IO.io(serverUrl, socketOptions);

    _socket!.on('connect', (_) {
      _isConnected = true;
      onConnect?.call();

      // Join negotiation room
      _socket!.emit('join-negotiation', {
        'negotiationId': negotiationId,
        'userId': userId,
        'userRole': userRole,
      });

      debugPrint(
          '[Socket] Connected to negotiation $negotiationId - Socket ID: ${_socket!.id}');
    });

    _socket!.on('disconnect', (_) {
      _isConnected = false;
      onDisconnect?.call();
      debugPrint('[Socket] Disconnected from negotiation');
    });

    // Listen for incoming messages
    _socket!.on('receive-message', (data) {
      debugPrint('[Socket] Message received: $data');
      onMessageReceived?.call(Map<String, dynamic>.from(data));
    });

    // Listen for typing indicators
    _socket!.on('user-typing', (data) {
      final userId = data['userId'] as String;
      final username = data['username'] as String? ?? 'User';
      onUserTyping?.call(userId, username);
    });

    _socket!.on('stop-typing', (data) {
      final userId = data['userId'] as String;
      onStopTyping?.call(userId, '');
    });

    // Listen for read receipts
    _socket!.on('message-read', (data) {
      final messageId = data['messageId'] as String;
      final userId = data['userId'] as String;
      onReadReceipt?.call(messageId, userId);
    });

    // Listen for user online/offline
    _socket!.on('user-online', (data) {
      onUserStatus?.call(
        data['userId'] as String,
        data['userRole'] as String,
        true,
      );
    });

    _socket!.on('user-offline', (data) {
      onUserStatus?.call(
        data['userId'] as String,
        data['userRole'] as String,
        false,
      );
    });

    _socket!.connect();
  }

  /// Send a message via Socket.io
  void sendMessage({
    required String message,
    required String userId,
    required String userRole,
  }) {
    if (!_isConnected || _currentNegotiationId == null) {
      debugPrint('[Socket] Not connected, cannot send message');
      return;
    }

    _socket!.emit('send-message', {
      'negotiationId': _currentNegotiationId,
      'message': message,
      'userId': userId,
      'userRole': userRole,
    });

    debugPrint('[Socket] Message sent: $message');
  }

  /// Emit typing indicator
  void emitTyping({
    required String userId,
    required String username,
    required String userRole,
  }) {
    if (!_isConnected || _currentNegotiationId == null) return;

    _socket!.emit('typing', {
      'negotiationId': _currentNegotiationId,
      'userId': userId,
      'username': username,
      'userRole': userRole,
    });
  }

  /// Emit stop typing
  void emitStopTyping({required String userId}) {
    if (!_isConnected || _currentNegotiationId == null) return;

    _socket!.emit('stop-typing', {
      'negotiationId': _currentNegotiationId,
      'userId': userId,
    });
  }

  /// Mark message as read
  void markMessageAsRead({
    required String messageId,
    required String userId,
  }) {
    if (!_isConnected || _currentNegotiationId == null) return;

    _socket!.emit('mark-read', {
      'negotiationId': _currentNegotiationId,
      'messageId': messageId,
      'userId': userId,
    });
  }

  /// Leave negotiation
  void leaveNegotiation({
    required String userId,
    required String userRole,
  }) {
    if (!_isConnected || _currentNegotiationId == null) return;

    _socket!.emit('leave-negotiation', {
      'negotiationId': _currentNegotiationId,
      'userId': userId,
      'userRole': userRole,
    });

    _currentNegotiationId = null;
  }

  /// Disconnect from server
  void disconnect() {
    _socket?.disconnect();
    _isConnected = false;
    _currentNegotiationId = null;
  }

  /// Reconnect to server
  void reconnect() {
    if (_socket != null) {
      _socket!.connect();
    }
  }
}
