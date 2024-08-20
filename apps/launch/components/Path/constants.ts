import { Define } from './steps/Define';
import { Design } from './steps/Design';
import { Engage } from './steps/Engage';
import { Intro } from './steps/Intro';
import { Promote } from './steps/Promote';
import { Watch } from './steps/Watch';

export const steps = [
  { title: 'Intro', content: Intro },
  { title: 'Define goals and KPIs', content: Define },
  { title: 'Design agent economy', content: Design },
  { title: 'Engage Builders', content: Engage },
  { title: 'Promote, co-market & observe', content: Promote },
  { title: 'Watch your metrics grow', content: Watch },
];

export const LAST_STEP_KEY = 'path_last_step';
