import PropTypes from 'prop-types';

import { NavTypes } from '../util/constants';

export const typePropType = PropTypes.oneOf([NavTypes.AGENT, NavTypes.COMPONENT, NavTypes.SERVICE]);
