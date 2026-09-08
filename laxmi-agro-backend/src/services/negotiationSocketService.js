const logger = require('../utils/logger');

// Store active connections: { negotiationId: Set<socketId> }
const activeConnections = new Map();

// Store typing users: { negotiationId: { userId: { username, timestamp } } }
const typingUsers = new Map();

class NegotiationSocketService {
  static initializeSocket(io) {
    io.on('connection', (socket) => {
      logger.info(`[Socket] New connection: ${socket.id}`);

      // User joins a negotiation chat room
      socket.on('join-negotiation', (data) => {
        const { negotiationId, userId, userRole } = data;
        const room = `negotiation-${negotiationId}`;

        socket.join(room);
        socket.negotiationId = negotiationId;
        socket.userId = userId;
        socket.userRole = userRole;

        // Track connection
        if (!activeConnections.has(negotiationId)) {
          activeConnections.set(negotiationId, new Set());
        }
        activeConnections.get(negotiationId).add(socket.id);

        logger.info(
          `[Socket] ${userRole} joined negotiation ${negotiationId}`
        );

        // Notify others that user is online
        socket.to(room).emit('user-online', {
          userId,
          userRole,
          timestamp: new Date(),
        });
      });

      // User sends a message
      socket.on('send-message', (data) => {
        const { negotiationId, message, userId, userRole } = data;
        const room = `negotiation-${negotiationId}`;

        // Broadcast message to all in the room (including sender)
        io.to(room).emit('receive-message', {
          negotiationId,
          message,
          userId,
          userRole,
          timestamp: new Date(),
          messageId: `${userId}-${Date.now()}`,
        });

        // Clear typing indicator
        if (typingUsers.has(negotiationId)) {
          delete typingUsers.get(negotiationId)[userId];
        }

        io.to(room).emit('stop-typing', { userId });

        logger.info(
          `[Socket] Message from ${userRole} in negotiation ${negotiationId}`
        );
      });

      // User is typing
      socket.on('typing', (data) => {
        const { negotiationId, userId, username, userRole } = data;
        const room = `negotiation-${negotiationId}`;

        if (!typingUsers.has(negotiationId)) {
          typingUsers.set(negotiationId, {});
        }

        typingUsers.get(negotiationId)[userId] = {
          username,
          userRole,
          timestamp: Date.now(),
        };

        // Broadcast typing indicator
        socket.to(room).emit('user-typing', {
          userId,
          username,
          userRole,
        });
      });

      // User stopped typing
      socket.on('stop-typing', (data) => {
        const { negotiationId, userId } = data;
        const room = `negotiation-${negotiationId}`;

        if (typingUsers.has(negotiationId)) {
          delete typingUsers.get(negotiationId)[userId];
        }

        socket.to(room).emit('stop-typing', { userId });
      });

      // Mark message as read
      socket.on('mark-read', (data) => {
        const { negotiationId, messageId, userId } = data;
        const room = `negotiation-${negotiationId}`;

        io.to(room).emit('message-read', {
          messageId,
          userId,
          timestamp: new Date(),
        });

        logger.info(`[Socket] Message ${messageId} marked as read by ${userId}`);
      });

      // User leaves negotiation
      socket.on('leave-negotiation', (data) => {
        const { negotiationId, userId, userRole } = data;
        const room = `negotiation-${negotiationId}`;

        socket.leave(room);

        // Remove connection
        if (activeConnections.has(negotiationId)) {
          activeConnections.get(negotiationId).delete(socket.id);
          if (activeConnections.get(negotiationId).size === 0) {
            activeConnections.delete(negotiationId);
          }
        }

        // Remove typing indicator
        if (typingUsers.has(negotiationId)) {
          delete typingUsers.get(negotiationId)[userId];
        }

        // Notify others
        socket.to(room).emit('user-offline', {
          userId,
          userRole,
          timestamp: new Date(),
        });

        logger.info(
          `[Socket] ${userRole} left negotiation ${negotiationId}`
        );
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        const { negotiationId, userId, userRole } = socket;

        if (negotiationId) {
          // Remove connection
          if (activeConnections.has(negotiationId)) {
            activeConnections.get(negotiationId).delete(socket.id);
            if (activeConnections.get(negotiationId).size === 0) {
              activeConnections.delete(negotiationId);
            }
          }

          // Remove typing indicator
          if (typingUsers.has(negotiationId)) {
            delete typingUsers.get(negotiationId)[userId];
          }

          const room = `negotiation-${negotiationId}`;
          socket
            .to(room)
            .emit('user-offline', {
              userId,
              userRole,
              timestamp: new Date(),
            });
        }

        logger.info(`[Socket] Disconnected: ${socket.id}`);
      });
    });
  }

  static getActiveUsers(negotiationId) {
    return activeConnections.has(negotiationId)
      ? activeConnections.get(negotiationId).size
      : 0;
  }

  static getTypingUsers(negotiationId) {
    if (!typingUsers.has(negotiationId)) return [];
    return Object.entries(typingUsers.get(negotiationId)).map(
      ([userId, data]) => ({
        userId,
        username: data.username,
        userRole: data.userRole,
      })
    );
  }
}

module.exports = NegotiationSocketService;
