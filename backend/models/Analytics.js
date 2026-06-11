const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    shortUrl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShortURL',
      required: true,
      index: true // Fast filtering per short link
    },
    ipHash: {
      type: String,
      required: true
      // Anonymous hash to calculate unique visitors without breaching GDPR/PII compliance
    },
    device: {
      type: String,
      default: 'Desktop',
      trim: true
    },
    browser: {
      type: String,
      default: 'Unknown',
      trim: true
    },
    os: {
      type: String,
      default: 'Unknown',
      trim: true
    },
    country: {
      type: String,
      default: 'Localhost',
      trim: true
    },
    referrer: {
      type: String,
      default: 'Direct',
      trim: true
    }
  },
  {
    timestamps: { createdAt: 'clickedAt', updatedAt: false } // We only care about insertion time
  }
);

// Compounded index for lightning fast aggregation queries on the analytics dashboard
analyticsSchema.index({ shortUrl: 1, clickedAt: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);