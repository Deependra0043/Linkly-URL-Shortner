const mongoose = require('mongoose');
const ShortURL = require('../models/ShortURL');
const Analytics = require('../models/Analytics');
const User = require('../models/User');

/**
 * @route   GET /api/analytics/:urlId
 * @desc    Fetch metric aggregations for a specific URL link node
 * @access  Private
 */
const getUrlAnalytics = async (req, res, next) => {
  const { urlId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(urlId)) {
      return res.status(400).json({ success: false, error: 'Malformed system reference ID identifier.' });
    }

    const urlRecord = await ShortURL.findById(urlId);
    if (!urlRecord) {
      return res.status(404).json({ success: false, error: 'Target short link reference point not found.' });
    }

    // Security checkpoint: verify access permissions
    if (urlRecord.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized profile tracking clearance.' });
    }

    const targetObjectId = new mongoose.Types.ObjectId(urlId);

    // High performance parallel pipeline processing for fast response dispatching
    const [
      totalClicks,
      uniqueVisitors,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      countryBreakdown,
      referrerBreakdown,
      clickHistory
    ] = await Promise.all([
      // 1. Total Hits
      Analytics.countDocuments({ shortUrl: targetObjectId }),

      // 2. Anonymized Distinct IP Calculations
      Analytics.distinct('ipHash', { shortUrl: targetObjectId }).then(res => res.length),

      // 3. Device Segmentation Grouping
      Analytics.aggregate([
        { $match: { shortUrl: targetObjectId } },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // 4. Browser Usage Distributions
      Analytics.aggregate([
        { $match: { shortUrl: targetObjectId } },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // 5. Operating System Mapping
      Analytics.aggregate([
        { $match: { shortUrl: targetObjectId } },
        { $group: { _id: '$os', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // 6. Geographic Country Coordinates
      Analytics.aggregate([
        { $match: { shortUrl: targetObjectId } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // 7. Referral Inbound Origins
      Analytics.aggregate([
        { $match: { shortUrl: targetObjectId } },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // 8. Timed Chronological Histograms (Last 30 Days)
      Analytics.aggregate([
        {
          $match: {
            shortUrl: targetObjectId,
            clickedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } },
            clicks: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      summary: {
        totalClicks,
        uniqueVisitors,
        creationDate: urlRecord.createdAt,
        expiresAt: urlRecord.expiresAt
      },
      breakdowns: {
        devices: deviceBreakdown,
        browsers: browserBreakdown,
        operatingSystems: osBreakdown,
        countries: countryBreakdown,
        referrers: referrerBreakdown,
        history: clickHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/admin/stats
 * @desc    Global overview metrics rollup panel
 * @access  Private/Admin
 */
const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, totalUrls, totalClicks] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      ShortURL.countDocuments(),
      Analytics.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalUrls,
        totalClicks
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUrlAnalytics,
  getAdminStats
};