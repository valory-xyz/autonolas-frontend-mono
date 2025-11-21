import type { NextApiRequest, NextApiResponse } from 'next';

import {
  generateZendeskTicketInfo,
  getZendeskRequestHeaders,
  setCorsHeaders,
} from '../../../utils';
import { ZENDESK_BASE_URL } from '../../../constants';
import type { ZendeskTicketResponse } from '../../../types';

const API_URL = `${ZENDESK_BASE_URL}/api/v2/tickets.json`;

type RequestBody = {
  email: string;
  subject: string;
  description: string;
  uploadTokens?: string[];
  tags?: string[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    const { email, subject, description, uploadTokens, tags } = req.body as RequestBody;

    if (!email || !subject || !description) {
      return res
        .status(400)
        .json({ error: 'Bad request', message: 'One or more of the required fields is missing' });
    }

    const headers = getZendeskRequestHeaders();
    const ticketInfo = generateZendeskTicketInfo({
      email,
      subject,
      description,
      uploadTokens,
      tags,
    });
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(ticketInfo),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response text');
      console.error('Zendesk API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      return res.status(response.status).json({ error: 'Failed to create ticket' });
    }

    const data: ZendeskTicketResponse = await response.json();
    return res.status(200).json({ ...data });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({
      error: 'Ticket creation failed',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
}
