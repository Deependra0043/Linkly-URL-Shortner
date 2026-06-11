const mongoose = require('mongoose');

const shortUrlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true
    },
    shortCode: {
      type: String,
      required: [true, 'Short code is required'],
      unique: true,
      trim: true,
      index: true // High-frequency lookup optimization
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'URL must be linked to a user account'],
      index: true
    },
    qrCode: {
      type: String, // Storing base64 Data URL for easy frontend rendering
      required: false
    },
    expiresAt: {
      type: Date,
      default: null,
      index: { expireAfterSeconds: 0 } // TTL index for automatic database cleanup
    },
    clicks: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compounded index to optimize filtering/sorting on user dashboards
shortUrlSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ShortURL', shortUrlSchema);