import { ZENDESK_CONFIG } from '../constants';

export const getZendeskRequestHeaders = () => {
  const auth = Buffer.from(
    `${ZENDESK_CONFIG.API_EMAIL}/token:${ZENDESK_CONFIG.API_TOKEN}`,
  ).toString('base64');

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Basic ${auth}`);
  return headers;
};

type GenerateZendeskTicketInfoParams = {
  email: string;
  subject: string;
  description: string;
  uploadTokens?: string[];
};

export const generateZendeskTicketInfo = ({
  email,
  subject,
  description,
  uploadTokens,
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
        name: email.split('@')[0],
      },
      priority: 'normal',
      //   type
      //   tags,
    },
  };
};
