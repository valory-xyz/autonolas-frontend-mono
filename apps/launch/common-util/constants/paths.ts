export type Path = {
  id: string;
  name: string;
  description: string;
};

export const PATHS: Path[] = [
  {
    id: 'start-from-a-kit',
    name: 'Start from a kit',
    description:
      'Select from a range of pre-built kits. Make it your own, launch it and bring it to market.',
  },
  {
    id: 'launch-your-own-idea',
    name: 'Launch your own idea',
    description: 'Take your market insight and turn it into a full-fledged service.',
  },
];
