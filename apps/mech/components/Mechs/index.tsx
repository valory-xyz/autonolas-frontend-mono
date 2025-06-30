import { Segmented } from 'antd';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { MEDIA_QUERY } from '@autonolas/frontend-library';
import { URL } from 'util/constants';

import { ListAgents } from './ListAgents';
import { ListServices } from './ListServices';

const MECH_MM = 'mechMM';
const LEGACY = 'legacy';

const MECH_TYPES = [
  {
    value: MECH_MM,
    label: 'Mech Marketplace',
  },
  {
    value: LEGACY,
    label: 'Legacy',
  },
];

const Content = styled.div`
  position: relative;
  padding: 20px 0;

  > .ant-segmented {
    position: absolute;
  }

  ${MEDIA_QUERY.tabletL} {
    > .ant-segmented {
      position: relative;
      margin-bottom: 8px;
    }
  }
`;

type MechType = 'mechMM' | 'legacy';

export const Mechs = () => {
  const router = useRouter();
  const [mechType, setMechType] = useState<MechType>(MECH_MM);

  const networkNameFromUrl = router?.query?.network;

  const handleChangeMechType = (selectedValue: string) =>
    router.push(
      `/${networkNameFromUrl}/${selectedValue === MECH_MM ? URL.MECHS : URL.MECHS_LEGACY}`,
    );

  useEffect(() => {
    if (router.asPath.includes(URL.MECHS_LEGACY)) setMechType(LEGACY);
    else setMechType(MECH_MM);
  }, [router]);

  return (
    <Content>
      <Segmented
        options={MECH_TYPES}
        value={mechType}
        size="large"
        onChange={handleChangeMechType}
      />
      {mechType === MECH_MM ? <ListServices /> : <ListAgents />}
    </Content>
  );
};
