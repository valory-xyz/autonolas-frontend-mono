export interface ZendeskTicketResponse {
  ticket: {
    id: number;
    url: string;
    subject: string;
    description: string;
    status: string;
  };
}
