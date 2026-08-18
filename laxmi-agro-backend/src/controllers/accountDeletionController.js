const { User, AccountDeletionRequest } = require('../models');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { createRequestForUser } = require('../services/accountDeletionService');

const serializeRequest = (request) => ({
  id: request._id,
  status: request.status,
  source: request.source,
  requestedAt: request.requestedAt,
  dueAt: request.dueAt,
  completedAt: request.completedAt,
  staffNote: request.status === 'rejected' ? request.staffNote : null,
});

exports.getMyRequest = async (req, res, next) => {
  try {
    const request = await AccountDeletionRequest.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: request ? serializeRequest(request) : null,
    });
  } catch (error) {
    next(error);
  }
};

exports.requestMyAccountDeletion = async (req, res, next) => {
  try {
    const { request, alreadyPending } = await createRequestForUser({
      user: req.user,
      source: 'app',
    });

    res.status(alreadyPending ? 200 : 201).json({
      success: true,
      message: alreadyPending
        ? 'Your account deletion request is already being processed.'
        : 'Your account deletion request has been submitted. We will complete it within 30 days.',
      data: serializeRequest(request),
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelMyAccountDeletion = async (req, res, next) => {
  try {
    const request = await AccountDeletionRequest.findOne({
      userId: req.user._id,
      status: 'pending',
    }).sort({ createdAt: -1 });

    if (!request) {
      throw new NotFoundError('No pending deletion request can be cancelled', 'DELETION_REQUEST_NOT_FOUND');
    }

    request.status = 'cancelled';
    request.events.push({
      action: 'cancelled',
      byUserId: req.user._id,
      note: 'Cancelled by the authenticated account holder before staff processing.',
    });
    await request.save();

    res.json({
      success: true,
      message: 'Your account deletion request has been cancelled.',
      data: serializeRequest(request),
    });
  } catch (error) {
    next(error);
  }
};

exports.requestDeletionFromWebsite = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) {
      throw new BadRequestError('Provide the email address or phone number used for your account.', 'DELETION_CONTACT_REQUIRED');
    }

    const conditions = [];
    if (email) conditions.push({ email: String(email).trim().toLowerCase() });
    if (phone) conditions.push({ phone: String(phone).trim() });

    const user = await User.findOne({
      role: { $ne: 'admin' },
      isActive: true,
      $or: conditions,
    });

    // Return the same response when no active account matches to avoid account enumeration.
    if (user) {
      await createRequestForUser({ user, source: 'website' });
    }

    res.status(202).json({
      success: true,
      message: 'If we can match an active Laxmi Agro account, we will contact the account holder to verify the request and complete it within 30 days.',
    });
  } catch (error) {
    next(error);
  }
};
