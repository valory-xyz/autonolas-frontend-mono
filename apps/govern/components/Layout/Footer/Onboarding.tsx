import { LeftOutlined, QuestionCircleOutlined, RightOutlined } from '@ant-design/icons';
import { Carousel, FloatButton, Modal } from 'antd';
import Image from 'next/image';
import { useState } from 'react';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

const OnboardingContent = styled.div`
  padding: 0 16px 16px;
  height: 400px;

  .ant-carousel {
    .slick-prev,
    .slick-next {
      font-size: 24px;
      color: ${COLOR.TEXT_SECONDARY};
    }

    .slick-dots {
      li button {
        background: ${COLOR.PRIMARY};
      }
    }
  }
`;

const STEPS = [
  {
    id: 1,
    title: 'Support different parts of the Olas agent economy',
    image: {
      src: '/images/onboarding/1.png',
      height: 345,
    },
  },
  {
    id: 2,
    title: 'Allocate your voting power to different staking contracts',
    image: {
      src: '/images/onboarding/2.png',
      height: 375,
    },
  },
  {
    id: 3,
    title: 'Browse contracts, add them to your list and set your vote weights',
    image: {
      src: '/images/onboarding/3.png',
      height: 345,
    },
  },
];

export const Onboarding = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Modal open={open} onCancel={handleClose} width={896} footer={null}>
        <OnboardingContent>
          <Carousel arrows nextArrow={<RightOutlined />} prevArrow={<LeftOutlined />}>
            {STEPS.map((item) => (
              <Image
                key={item.id}
                src={item.image.src}
                className="mb-24"
                width={816}
                height={item.image.height}
                alt={item.title}
              />
            ))}
          </Carousel>
        </OnboardingContent>
      </Modal>
      <FloatButton icon={<QuestionCircleOutlined />} onClick={handleOpen} />
    </>
  );
};
