const crypto = require('crypto');
const validator = require('validator');
const QRCode = require('qrcode');
const useragent = require('useragent');
const ShortURL = require('../models/ShortURL');
const Analytics = require('../models/Analytics');
const { getCountryFromRequest } = require('../utils/geoip');

// Custom base62 alphabet for clean, readable codes without ambiguous characters (like 0, O, I, l)
const generateSlug = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * @route   POST /api/urls
 * @desc    Create a shortened URL with optional configuration
 * @access  Private
 */
const createUrl = async (req, res, next) => {
  const { originalUrl, customCode, expiresAt } = req.body;

  try {
    if (!originalUrl) {
      return res.status(400).json({ success: false, error: 'Original destination URL is required.' });
    }

    // Sanitize and validate input URL string
    if (!validator.isURL(originalUrl, { require_protocol: true })) {
      return res.status(400).json({ success: false, error: 'Invalid URL format. Include http:// or https://' });
    }

    let shortCode = customCode ? customCode.trim() : '';

    if (shortCode) {
      // Enforce slug format requirements for custom short URLs
      if (!/^[a-zA-Z0-9-_]{3,15}$/.test(shortCode)) {
        return res.status(400).json({
          success: false,
          error: 'Custom codes must be between 3-15 characters and contain only alphanumeric values, dashes, or underscores.'
        });
      }

      const existingSlug = await ShortURL.findOne({ shortCode });
      if (existingSlug) {
        return res.status(400).json({ success: false, error: 'This custom short code is already in use.' });
      }
    } else {
      // Loop to guarantee slug uniqueness in case of highly improbable collisions
      let dynamicSlug;
      let collision = true;
      while (collision) {
        dynamicSlug = generateSlug();
        const existing = await ShortURL.findOne({ shortCode: dynamicSlug });
        if (!existing) collision = false;
      }
      shortCode = dynamicSlug;
    }

    // Build the structural link pointing directly to the application distribution router
    const absoluteShortUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/${shortCode}`;
    
    // Pre-render the QR Code data stream as an optimized base64 asset
    const qrCodeDataUrl = await QRCode.toDataURL(absoluteShortUrl, {
      margin: 2,
      width: 300,
      color: { dark: '#1f2937', light: '#ffffff' }
    });

    const parsedExpiry = expiresAt ? new Date(expiresAt) : null;
    if (parsedExpiry && parsedExpiry <= new Date()) {
      return res.status(400).json({ success: false, error: 'The expiration timestamp must be scheduled in the future.' });
    }

    const newUrl = await ShortURL.create({
      originalUrl,
      shortCode,
      user: req.user._id,
      qrCode: qrCodeDataUrl,
      expiresAt: parsedExpiry
    });

    res.status(201).json({ success: true, data: newUrl });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/urls
 * @desc    Fetch active user links with server-side pagination, searching, and sorting
 * @access  Private
 */
const getUrls = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, sort } = req.query;

    // Isolate lookup criteria specifically to the current user context
    let queryCondition = { user: req.user._id };

    if (search) {
      queryCondition.originalUrl = { $regex: search, $options: 'i' };
    }

    let sortOrder = { createdAt: -1 }; // Newest items first by default
    if (sort === 'clicks') sortOrder = { clicks: -1 };
    if (sort === 'oldest') sortOrder = { createdAt: 1 };

    const total = await ShortURL.countDocuments(queryCondition);
    const urls = await ShortURL.find(queryCondition)
      .sort(sortOrder)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: urls.length,
      pagination: { page, limit, totalPages: Math.ceil(total / limit), totalResults: total },
      data: urls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/urls/:id
 * @desc    Modify destination metadata targets
 * @access  Private
 */
const updateUrl = async (req, res, next) => {
  const { originalUrl, expiresAt } = req.body;

  try {
    let urlRecord = await ShortURL.findById(req.params.id);
    if (!urlRecord) {
      return res.status(404).json({ success: false, error: 'Target short link resource not found.' });
    }

    // Verify ownership permissions explicitly
    if (urlRecord.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Unauthorized to modify this asset.' });
    }

    if (originalUrl) {
      if (!validator.isURL(originalUrl, { require_protocol: true })) {
        return res.status(400).json({ success: false, error: 'Invalid destination link payload format.' });
      }
      urlRecord.originalUrl = originalUrl;
    }

    if (expiresAt !== undefined) {
      urlRecord.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    await urlRecord.save();
    res.status(200).json({ success: true, data: urlRecord });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/urls/:id
 * @desc    Cascade delete a link map alongside analytics logs
 * @access  Private
 */
const deleteUrl = async (req, res, next) => {
  try {
    const urlRecord = await ShortURL.findById(req.params.id);
    if (!urlRecord) {
      return res.status(404).json({ success: false, error: 'Target short link resource not found.' });
    }

    if (urlRecord.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Action forbidden. Ownership validation failed.' });
    }

    // Clean up all related telemetry records concurrently to save overhead
    await Promise.all([
      Analytics.deleteMany({ shortUrl: urlRecord._id }),
      urlRecord.deleteOne()
    ]);

    res.status(200).json({ success: true, message: 'Link and associated telemetry logs removed.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /:shortCode
 * @desc    Public core redirect engine recording performance analytics
 * @access  Public
 */
const redirectUrl = async (req, res, next) => {
  const { shortCode } = req.params;

  try {
    const urlRecord = await ShortURL.findOne({ shortCode });
    if (!urlRecord) {
      return res.status(404).send('<h1>Link Not Found</h1><p>The shortened link requested does not exist or has expired.</p>');
    }

    // Asynchronous non-blocking metrics processing loop to isolate execution speed from user experience
    processMetrics(req, urlRecord._id).catch(err => 
      console.error(`[METRICS ERROR] Telemetry gathering failure for ${shortCode}:`, err.message)
    );

    // Update the base hit counts directly on the link node
    urlRecord.clicks += 1;
    await urlRecord.save();

    // Fire HTTP redirect immediately 
    return res.redirect(urlRecord.originalUrl);
  } catch (error) {
    next(error);
  }
};

// Isolated analytics handler logic runs asynchronously decoupled from response loop
async function processMetrics(req, shortUrlId) {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  
  // SHA256 anonymization loop allows unique counting without storing raw personal information strings
  const ipHash = crypto.createHash('sha256').update(rawIp).digest('hex');

  const agent = useragent.parse(req.headers['user-agent']);
  const country = getCountryFromRequest(req);
  
  const rawReferrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';
  let referrer = 'Direct';
  if (rawReferrer !== 'Direct') {
    try {
      referrer = new URL(rawReferrer).hostname;
    } catch (_) {
      referrer = 'Invalid Referrer Trace';
    }
  }

  await Analytics.create({
    shortUrl: shortUrlId,
    ipHash,
    device: agent.device.toString() === 'Other 0.0.0' ? 'Desktop/Server' : agent.device.family,
    browser: agent.family,
    os: agent.os.family,
    country,
    referrer
  });
}

module.exports = {
  createUrl,
  getUrls,
  updateUrl,
  deleteUrl,
  redirectUrl
};