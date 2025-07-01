import Link from 'next/link';

type DiscordLinkProps = { text?: string };

export const DiscordLink = ({ text }: DiscordLinkProps) => (
  <Link href="/verification">{text || 'Complete Discord verification'}</Link>
);
