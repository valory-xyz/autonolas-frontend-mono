/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Fragment } from 'react';
import { Typography } from 'antd';
import { LinkType, LinksSectionType, EachLink } from './types';

const { Text } = Typography;

const PROPEL_URL = 'https://propel.valory.xyz';
const DOCS_LINK = 'https://docs.autonolas.network/product';
const ML_KIT_DOCS = `${DOCS_LINK}/mlkit/`;
const ORACLE_KIT_DOCS = `${DOCS_LINK}/oraclekit/`;
const MINT_KIT_DOCS = `${DOCS_LINK}/mintkit/`;
const COORDTINATION_KIT_URL = `${DOCS_LINK}/coordinationkit/`;
const IE_KIT_DOCS = `${DOCS_LINK}/iekit/`;
const GOVKIT_DOCS = `${DOCS_LINK}/govkit/`;
const MECHKIT_DOCS = `${DOCS_LINK}/mechkit/`;
const KEEPERKIT_DOCS = `${DOCS_LINK}/keeperkit/`;
const MESSAGINGKIT_DOCS = `${DOCS_LINK}/messagingkit/`;
const ECOSYSTEM_BUILDER = 'https://www.autonolas.network/#ecosystem-builders';

export const DotSpace = () => <>&nbsp;&nbsp;•&nbsp;&nbsp;</>;

const GET_HELP_BUILDING = {
  text: 'Get help building',
  redirectTo: PROPEL_URL,
  isInternal: false,
};
const GET_HELP_BUILDING_LARGE = { ...GET_HELP_BUILDING };
const GET_HELP_BUILDING_MID = { ...GET_HELP_BUILDING, text: 'Get help' };

const isGoerli = () => {
  // on server side, window is undefined.
  if (typeof window === 'undefined') return false;
  return Number((window as any)?.MODAL_PROVIDER?.chainId || 1) === 5;
};

const LINKS: LinkType = {
  mintkit: {
    kit: { link: MINT_KIT_DOCS, name: 'MINTKIT' },
    largeBuiltWith: [
      { text: 'Run the Code', redirectTo: `${MINT_KIT_DOCS}#demo` },
      GET_HELP_BUILDING_LARGE,
    ],
    midBuiltWith: [
      { text: 'Run demo code', redirectTo: `${MINT_KIT_DOCS}#demo` },
      GET_HELP_BUILDING_MID,
    ],
    docs: [
      {
        text: 'Live service',
        redirectTo: 'https://registry.olas.network/services/1',
        isInternal: false,
      },
      {
        text: 'Service code',
        redirectTo: 'http://github.com/valory-xyz/agent-academy-1',
        isInternal: false,
      },
    ],
  },
  oraclekit: {
    kit: { link: ORACLE_KIT_DOCS, name: 'ORACLEKIT' },
    largeBuiltWith: [
      { text: 'Run demo code', redirectTo: `${ORACLE_KIT_DOCS}#demo` },
      GET_HELP_BUILDING_LARGE,
    ],
    midBuiltWith: [
      { text: 'Run demo code', redirectTo: `${ORACLE_KIT_DOCS}#demo` },
      GET_HELP_BUILDING_MID,
    ],
    docs: [
      {
        text: 'Live service',
        redirectTo: 'https://registry.olas.network/services/1',
        isInternal: false,
      },
      {
        text: 'Service code',
        redirectTo: 'https://github.com/valory-xyz/price-oracle',
        isInternal: false,
      },
    ],
  },
  mlkit: {
    kit: { link: ML_KIT_DOCS, name: 'MLKIT' },
    largeBuiltWith: [
      { text: 'Run demo code', redirectTo: `${ML_KIT_DOCS}#demo` },
      GET_HELP_BUILDING_LARGE,
    ],
    midBuiltWith: [
      { text: 'Run demo code', redirectTo: `${ML_KIT_DOCS}#demo` },
      GET_HELP_BUILDING_MID,
    ],
    docs: [
      {
        text: 'Live service',
        redirectTo: 'https://registry.olas.network/services/2',
        isInternal: false,
      },
      {
        text: 'Service code',
        redirectTo: 'https://github.com/valory-xyz/apy-oracle',
        isInternal: false,
      },
    ],
  },
  coordinationkit: {
    kit: { link: COORDTINATION_KIT_URL, name: 'COORDINATIONKIT' },
    largeBuiltWith: [
      { text: 'Run demo code', redirectTo: `${COORDTINATION_KIT_URL}#demo` },
      GET_HELP_BUILDING_LARGE,
    ],
    midBuiltWith: [
      { text: 'Run demo code', redirectTo: `${COORDTINATION_KIT_URL}#demo` },
      GET_HELP_BUILDING_MID,
    ],
    docs: [
      {
        text: 'Live service',
        redirectTo: 'https://registry.olas.network/services/6',
        isInternal: false,
      },
      {
        text: 'Service code',
        redirectTo: 'https://github.com/valory-xyz/contribution-service',
        isInternal: false,
      },
      {
        text: 'Contracts',
        redirectTo: isGoerli()
          ? 'https://goerli.etherscan.io/address/0x7C3B976434faE9986050B26089649D9f63314BD8'
          : 'https://etherscan.io/address/0x02c26437b292d86c5f4f21bbcce0771948274f84',
        isInternal: false,
      },
    ],
  },
  iekit: {
    kit: { link: IE_KIT_DOCS, name: 'IEKIT', isDisabled: true },
    largeBuiltWith: [
      {
        text: 'Run demo code',
        redirectTo: `${IE_KIT_DOCS}#demo`,
        isDisabled: true,
      },
      {
        text: 'Get help building',
        redirectTo: ECOSYSTEM_BUILDER,
        isInternal: false,
      },
    ],
    midBuiltWith: [
      { text: 'Run demo code', redirectTo: `${IE_KIT_DOCS}#demo` },
      {
        text: 'Get help building',
        redirectTo: ECOSYSTEM_BUILDER,
        isInternal: false,
      },
    ],
    docs: [
      {
        text: 'Live service',
        redirectTo: 'https://registry.olas.network/services/9',
        isInternal: false,
      },
      {
        text: 'Service Code',
        redirectTo: 'https://github.com/valory-xyz/IEKit',
        isInternal: false,
        isDisabled: true,
      },
      {
        text: 'Contracts',
        redirectTo: isGoerli()
          ? 'https://goerli.etherscan.io/address/0x7C3B976434faE9986050B26089649D9f63314BD8'
          : 'https://etherscan.io/address/0x02c26437b292d86c5f4f21bbcce0771948274f84',
        isInternal: false,
      },
    ],
  },
  govkit: {
    kit: { link: GOVKIT_DOCS, name: 'GOVKIT' },
    largeBuiltWith: [
      { text: 'Run demo code', redirectTo: `${GOVKIT_DOCS}#demo` },
      GET_HELP_BUILDING_LARGE,
    ],
    midBuiltWith: [
      { text: 'Run demo code', redirectTo: `${GOVKIT_DOCS}#demo` },
      GET_HELP_BUILDING_MID,
    ],
    docs: [
      {
        text: 'Live service',
        redirectTo: 'https://registry.olas.network/services/5',
        isInternal: false,
      },
      {
        text: 'Service code',
        redirectTo: 'https://github.com/valory-xyz/governatooorr',
        isInternal: false,
      },
    ],
  },
  mechkit: {
    kit: { link: MECHKIT_DOCS, name: 'MECHKIT' },
    largeBuiltWith: [
      { text: 'Run demo code', redirectTo: `${MECHKIT_DOCS}#demo` },
      GET_HELP_BUILDING_LARGE,
    ],
    midBuiltWith: [
      { text: 'Run demo code', redirectTo: `${MECHKIT_DOCS}#demo` },
      GET_HELP_BUILDING_MID,
    ],
    docs: [
      {
        text: 'Live service',
        redirectTo: 'https://registry.olas.network/services/3',
        isInternal: false,
      },
      {
        text: 'Service code',
        redirectTo: 'https://github.com/valory-xyz/mech',
        isInternal: false,
      },
    ],
  },
  keeperkit: {
    kit: { link: KEEPERKIT_DOCS, name: 'KEEPERKIT' },
    largeBuiltWith: [
      { text: 'Run demo code', redirectTo: `${KEEPERKIT_DOCS}#demo` },
      GET_HELP_BUILDING_LARGE,
    ],
    midBuiltWith: [
      { text: 'Run demo code', redirectTo: `${KEEPERKIT_DOCS}#demo` },
      GET_HELP_BUILDING_MID,
    ],
    docs: [
      {
        text: 'Live service 1',
        redirectTo: 'https://registry.olas.network/services/3',
        isInternal: false,
      },
      {
        text: 'Live service 2',
        redirectTo: 'https://registry.olas.network/services/4',
        isInternal: false,
      },
      {
        text: 'Service code',
        redirectTo: 'https://github.com/valory-xyz/agent-academy-2',
        isInternal: false,
      },
    ],
  },
  messagingkit: {
    kit: { link: MESSAGINGKIT_DOCS, name: 'MESSAGINGKIT' },
    largeBuiltWith: [
      { text: 'Run demo code', redirectTo: `${MESSAGINGKIT_DOCS}#demo` },
      GET_HELP_BUILDING_LARGE,
    ],
    midBuiltWith: [
      { text: 'Run demo code', redirectTo: `${MESSAGINGKIT_DOCS}#demo` },
      GET_HELP_BUILDING_MID,
    ],
  },
};

const getList = (contents?: EachLink[]) => {
  if (!contents) return null;

  return contents.map(
    ({ text, redirectTo, isInternal = true, isDisabled }, index) => {
      const getRedirectTo = () => {
        if (redirectTo) {
          return (
            <a
              href={redirectTo}
              target={isInternal ? '_self' : '_blank'}
              rel="noreferrer"
            >
              {text}
            </a>
          );
        }
        return `${text} (link coming soon)`;
      };

      return (
        <Fragment key={`link-${redirectTo}`}>
          <Text type="secondary" disabled={!!isDisabled}>
            {isDisabled ? text : getRedirectTo()}

            {index !== (contents || []).length - 1 && (
              <>&nbsp;&nbsp;•&nbsp;&nbsp;</>
            )}
          </Text>
        </Fragment>
      );
    }
  );
};

export const LinksSection = ({ appType, isMidSize }: LinksSectionType) => {
  // if no appType, return null
  if (!appType) return null;

  // for mid-size
  if (isMidSize) return <>{getList(LINKS[appType].midBuiltWith)}</>;

  const kitName = LINKS[appType].kit.name || '';

  return (
    <>
      {[
        {
          id: 'docs',
          list: LINKS[appType].largeBuiltWith,
          name: (
            <>
              BUILT WITH&nbsp;
              {LINKS[appType].kit.isDisabled ? (
                <Text type="secondary" disabled>
                  {kitName}
                </Text>
              ) : (
                <a href={LINKS[appType].kit.link} rel="noreferrer">
                  {kitName}
                </a>
              )}
            </>
          ),
        },
        { id: 'code', name: 'CODE', list: LINKS[appType].docs },
      ].map((e) => {
        const docsList = getList(e.list);

        if (!docsList) return null;

        return (
          <div key={e.id}>
            <div>
              <Text className="status-sub-header">{e.name}</Text>
            </div>

            <div className="status-sub-content">{docsList}</div>
          </div>
        );
      })}
    </>
  );
};
