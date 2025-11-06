import { ZENDESK_CONFIG } from '../constants';

export const getZendeskRequestHeaders = (contentType: string = 'application/json') => {
  if (!ZENDESK_CONFIG.API_EMAIL || !ZENDESK_CONFIG.API_TOKEN) {
    throw new Error('Zendesk API credentials are not set');
  }

  const auth = Buffer.from(
    `${ZENDESK_CONFIG.API_EMAIL}/token:${ZENDESK_CONFIG.API_TOKEN}`,
  ).toString('base64');

  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('Authorization', `Basic ${auth}`);
  headers.set('Accept', 'application/json');
  return headers;
};

type GenerateZendeskTicketInfoParams = {
  email?: string;
  subject: string;
  description: string;
  uploadTokens?: string[];
  tags?: string[];
};

export const generateZendeskTicketInfo = ({
  email,
  subject,
  description,
  uploadTokens,
  tags,
}: GenerateZendeskTicketInfoParams) => {
  return {
    ticket: {
      subject,
      comment: {
        body: description,
        uploads: uploadTokens || [],
      },
      requester: {
        email,
        name: email ? email.split('@')[0] : undefined,
      },
      priority: 'normal',
      tags,
    },
  };
};

export const isValidFileType = (contentType: string, fileName: string): boolean => {
  const isImage = contentType.startsWith('image/');
  const isVideo = contentType.startsWith('video/');
  const isZip =
    contentType === 'application/zip' ||
    contentType === 'application/x-zip-compressed' ||
    fileName.toLowerCase().endsWith('.zip');

  return isImage || isVideo || isZip;
};
