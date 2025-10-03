import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ==================== TYPES ====================

export type ReportReason = 'spam' | 'offensive' | 'fake' | 'inappropriate' | 'harassment' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type ReportTargetType = 'post' | 'comment' | 'user' | 'spotlight';

export type ReportDocument = Document & {
    reporterId: Types.ObjectId;

    // Target
    targetType: ReportTargetType;
    targetId: Types.ObjectId;

    // Report Details
    reason: ReportReason;
    description?: string;

    // Status
    status: ReportStatus;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    actionTaken?: string;

    // Timestamps
    createdAt: Date;

    // Methods
    review(moderatorId: Types.ObjectId, action: string): Promise<ReportDocument>;
    resolve(moderatorId: Types.ObjectId, action: string): Promise<ReportDocument>;
    dismiss(moderatorId: Types.ObjectId, reason: string): Promise<ReportDocument>;
};

// ==================== SCHEMA ====================

const ReportSchema = new Schema<ReportDocument>({
    reporterId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Target
    targetType: {
        type: String,
        enum: ['post', 'comment', 'user', 'spotlight'],
        required: true,
        index: true
    },
    targetId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true
    },

    // Report Details
    reason: {
        type: String,
        enum: ['spam', 'offensive', 'fake', 'inappropriate', 'harassment', 'other'],
        required: true,
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending',
        index: true
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    actionTaken: {
        type: String,
        trim: true
    },

    // Timestamp
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false // We use custom createdAt
});

// ==================== INDEXES ====================

// Compound indexes for common queries
ReportSchema.index({ targetType: 1, targetId: 1 }); // Reports for a specific target
ReportSchema.index({ status: 1, createdAt: -1 }); // Pending reports by date
ReportSchema.index({ reporterId: 1, createdAt: -1 }); // User's reports
ReportSchema.index({ targetType: 1, status: 1 }); // Reports by type and status

// ==================== VIRTUAL FIELDS ====================

// Reporter details (populate)
ReportSchema.virtual('reporter', {
    ref: 'User',
    localField: 'reporterId',
    foreignField: '_id',
    justOne: true
});

// Moderator details (populate)
ReportSchema.virtual('moderator', {
    ref: 'User',
    localField: 'reviewedBy',
    foreignField: '_id',
    justOne: true
});

// ==================== INSTANCE METHODS ====================

/**
 * Mark report as reviewed
 */
ReportSchema.methods.review = async function (
    moderatorId: Types.ObjectId,
    action: string
) {
    this.status = 'reviewed';
    this.reviewedBy = moderatorId;
    this.reviewedAt = new Date();
    this.actionTaken = action;
    await this.save();
    return this;
};

/**
 * Mark report as resolved
 */
ReportSchema.methods.resolve = async function (
    moderatorId: Types.ObjectId,
    action: string
) {
    this.status = 'resolved';
    this.reviewedBy = moderatorId;
    this.reviewedAt = new Date();
    this.actionTaken = action;
    await this.save();
    return this;
};

/**
 * Dismiss report
 */
ReportSchema.methods.dismiss = async function (
    moderatorId: Types.ObjectId,
    reason: string
) {
    this.status = 'dismissed';
    this.reviewedBy = moderatorId;
    this.reviewedAt = new Date();
    this.actionTaken = `Dismissed: ${reason}`;
    await this.save();
    return this;
};

// ==================== STATIC METHODS ====================

/**
 * Create a report
 */
ReportSchema.statics.createReport = async function (
    reporterId: Types.ObjectId,
    targetType: ReportTargetType,
    targetId: Types.ObjectId,
    reason: ReportReason,
    description?: string
) {
    const report = await this.create({
        reporterId,
        targetType,
        targetId,
        reason,
        description
    });

    // Increment report count on target (for posts only)
    if (targetType === 'post') {
        await mongoose.model('Post').findByIdAndUpdate(
            targetId,
            { $inc: { reports: 1 } }
        );
    }

    // TODO: Auto-hide content if reports reach threshold
    // TODO: Send notification to moderators

    return report;
};

/**
 * Get pending reports
 */
ReportSchema.statics.getPendingReports = function (
    page: number = 1,
    limit: number = 20,
    targetType?: ReportTargetType
): Promise<ReportDocument[]> {
    const query: Record<string, unknown> = { status: 'pending' };

    if (targetType) {
        query.targetType = targetType;
    }

    return this.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('reporterId', 'name email')
        .populate('targetId')
        .exec();
};

/**
 * Get reports for a specific target
 */
ReportSchema.statics.getTargetReports = function (
    targetType: ReportTargetType,
    targetId: Types.ObjectId
): Promise<ReportDocument[]> {
    return this.find({ targetType, targetId })
        .sort({ createdAt: -1 })
        .populate('reporterId', 'name email college')
        .exec();
};

/**
 * Get report count for a target
 */
ReportSchema.statics.getTargetReportCount = async function (
    targetType: ReportTargetType,
    targetId: Types.ObjectId
): Promise<number> {
    return this.countDocuments({ targetType, targetId });
};

/**
 * Get user's reports
 */
ReportSchema.statics.getUserReports = function (
    userId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
): Promise<ReportDocument[]> {
    return this.find({ reporterId: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
};

/**
 * Get reports by reason
 */
ReportSchema.statics.getByReason = function (
    reason: ReportReason,
    page: number = 1,
    limit: number = 20
): Promise<ReportDocument[]> {
    return this.find({ reason, status: 'pending' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('reporterId', 'name email')
        .populate('targetId')
        .exec();
};

/**
 * Get moderation queue stats
 */
ReportSchema.statics.getModerationStats = async function (): Promise<Record<string, unknown>> {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const reasonStats = await this.aggregate([
        {
            $match: { status: 'pending' }
        },
        {
            $group: {
                _id: '$reason',
                count: { $sum: 1 }
            }
        }
    ]);

    return {
        byStatus: stats,
        byReason: reasonStats
    };
};

/**
 * Delete old resolved/dismissed reports
 */
ReportSchema.statics.cleanupOldReports = async function (
    daysOld: number = 90
): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.deleteMany({
        status: { $in: ['resolved', 'dismissed'] },
        reviewedAt: { $lt: cutoffDate }
    });

    return result.deletedCount;
};

// ==================== MIDDLEWARE (HOOKS) ====================

/**
 * Post-save middleware
 */
ReportSchema.post('save', async function (doc) {
    if (doc.isNew) {
        // Check if target has reached threshold for auto-moderation
        const reportCount = await mongoose.model('Report').countDocuments({
            targetType: doc.targetType,
            targetId: doc.targetId,
            status: 'pending'
        });

        // Auto-hide if 5+ pending reports
        if (reportCount >= 5) {
            if (doc.targetType === 'post') {
                await mongoose.model('Post').findByIdAndUpdate(
                    doc.targetId,
                    {
                        $set: {
                            isHidden: true,
                            isModerated: true,
                            moderationReason: 'Multiple reports received',
                            moderatedAt: new Date()
                        }
                    }
                );
            }
        }
    }
});

// ==================== MODEL ====================

export type ReportModel = Model<ReportDocument> & {
    createReport(
        reporterId: Types.ObjectId,
        targetType: ReportTargetType,
        targetId: Types.ObjectId,
        reason: ReportReason,
        description?: string
    ): Promise<ReportDocument>;

    getPendingReports(
        page?: number,
        limit?: number,
        targetType?: ReportTargetType
    ): Promise<ReportDocument[]>;

    getTargetReports(
        targetType: ReportTargetType,
        targetId: Types.ObjectId
    ): Promise<ReportDocument[]>;

    getTargetReportCount(
        targetType: ReportTargetType,
        targetId: Types.ObjectId
    ): Promise<number>;

    getUserReports(
        userId: Types.ObjectId,
        page?: number,
        limit?: number
    ): Promise<ReportDocument[]>;

    getByReason(
        reason: ReportReason,
        page?: number,
        limit?: number
    ): Promise<ReportDocument[]>;

    getModerationStats(): Promise<Record<string, unknown>>;
    cleanupOldReports(daysOld?: number): Promise<number>;
};

const Report = mongoose.model<ReportDocument, ReportModel>('Report', ReportSchema);

export default Report;
