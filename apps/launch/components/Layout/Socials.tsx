import Image from 'next/image';

const SOCIALS = [
  { type: 'web', url: 'https://olas.network' },
  {
    type: 'github',
    url: 'https://github.com/valory-xyz/autonolas-frontend-mono/tree/main/apps/launch',
  },
  { type: 'twitter', url: 'https://twitter.com/autonolas' },
];

const Socials = () => (
  <div className="socials">
    {SOCIALS.map((social) => {
      const src = `/images/${social.type}.svg`;

      return (
        <a
          href={social.url}
          className={social.type}
          target="_blank"
          rel="noopener noreferrer"
          key={`social-${social.type}`}
          aria-label={`social-${social.type}`}
        >
          <Image src={src} alt="" width={16} height={16} />
        </a>
      );
    })}
  </div>
);

export default Socials;
