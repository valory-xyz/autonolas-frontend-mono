import type { NextApiRequest, NextApiResponse } from 'next';

import { generateZendeskTicketInfo, getZendeskRequestHeaders } from '../../../utils';
import { ZENDESK_BASE_URL } from '../../../constants';
import type { ZendeskTicketResponse } from '../../../types';

const API_URL = `${ZENDESK_BASE_URL}/api/v2/tickets.json`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const { email, subject, description, uploadTokens } = req.body;

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
    });
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(ticketInfo),
    });

    if (!response.ok) {
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
