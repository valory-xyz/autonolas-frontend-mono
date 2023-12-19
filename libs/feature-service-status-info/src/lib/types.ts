export type AppType =
  | 'coordinationkit'
  | 'mlkit'
  | 'oraclekit'
  | 'mintkit'
  | 'iekit'
  | 'govkit'
  | 'mechkit'
  | 'keeperkit'
  | 'messagingkit';

export type LinksSectionType = {
  appType?: AppType;
  isMidSize?: boolean;
};

export type EachLink = {
  text: string;
  redirectTo: string;
  isInternal?: boolean;
  isDisabled?: boolean;
};

export type LinkType = Record<
  AppType,
  {
    kit: {
      link: string;
      name: string;
      isDisabled?: boolean;
    };
    largeBuiltWith: EachLink[];
    midBuiltWith: EachLink[];
    docs?: EachLink[];
  }
>;
