export const ZENDESK_CONFIG = {
  SUBDOMAIN: process.env.ZENDESK_SUBDOMAIN,
  API_TOKEN: process.env.ZENDESK_API_TOKEN,
  API_EMAIL: process.env.ZENDESK_API_EMAIL,
};

export const ZENDESK_BASE_URL = `https://${ZENDESK_CONFIG.SUBDOMAIN}.zendesk.com`;

export const ZENDESK_RATING_FIELD_ID = process.env.ZENDESK_RATING_FIELD_ID;
