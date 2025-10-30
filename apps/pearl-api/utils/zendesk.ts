import { ZENDESK_CONFIG } from '../constants';
import { ZENDESK_RATING_FIELD_ID } from '../constants';

export const getZendeskRequestHeaders = (contentType: string = 'application/json') => {
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
  rating?: string | number;
};

export const generateZendeskTicketInfo = ({
  email,
  subject,
  description,
  uploadTokens,
  tags,
  rating,
}: GenerateZendeskTicketInfoParams) => {
  const customFields: Array<{ id: number; value: string | number }> = [];
  if (rating !== undefined && ZENDESK_RATING_FIELD_ID) {
    const fieldIdNum = Number(ZENDESK_RATING_FIELD_ID);
    customFields.push({ id: fieldIdNum, value: rating });
  }

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
      ...(customFields.length > 0 ? { custom_fields: customFields } : {}),
    },
  };
};
