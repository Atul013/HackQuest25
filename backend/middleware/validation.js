/**
 * Validation Middleware
 */

const Joi = require('joi');

/**
 * Validate location coordinates
 */
const validateLocation = (req, res, next) => {
  const schema = Joi.object({
    lat: Joi.number().min(-90).max(90).required()
      .messages({
        'number.base': 'Latitude must be a number',
        'number.min': 'Latitude must be between -90 and 90',
        'number.max': 'Latitude must be between -90 and 90',
        'any.required': 'Latitude is required'
      }),
    lon: Joi.number().min(-180).max(180).required()
      .messages({
        'number.base': 'Longitude must be a number',
        'number.min': 'Longitude must be between -180 and 180',
        'number.max': 'Longitude must be between -180 and 180',
        'any.required': 'Longitude is required'
      }),
    venueId: Joi.number().integer().optional(),
    accuracy: Joi.number().optional(),
    timestamp: Joi.number().optional()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  req.body = value;
  next();
};

/**
 * Validate venue data
 */
const validateVenue = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    type: Joi.string().valid('railway', 'airport', 'concert', 'stadium', 'mall', 'hospital', 'university', 'government').required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    geofence_radius: Joi.number().integer().min(50).max(5000).default(500),
    geofence_polygon: Joi.array().items(
      Joi.array().items(Joi.number()).length(2)
    ).optional(),
    wifi_ssid: Joi.string().max(100).optional(),
    wifi_enabled: Joi.boolean().default(false)
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  req.body = value;
  next();
};

/**
 * Validate alert data
 */
const validateAlert = (req, res, next) => {
  const schema = Joi.object({
    venueId: Joi.number().integer().required(),
    title: Joi.string().min(3).max(255).required(),
    message: Joi.string().min(10).max(1000).required(),
    type: Joi.string().valid('emergency', 'warning', 'info', 'update').required(),
    severity: Joi.string().valid('critical', 'high', 'medium', 'low').required(),
    category: Joi.string().valid('fire', 'medical', 'security', 'weather', 'evacuation', 'general').optional(),
    expiresAt: Joi.date().greater('now').optional()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  req.body = value;
  next();
};

module.exports = {
  validateLocation,
  validateVenue,
  validateAlert
};
