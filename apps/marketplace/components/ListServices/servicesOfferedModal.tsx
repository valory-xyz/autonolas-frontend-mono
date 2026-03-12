import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Typography, Tag, Space, Spin, Flex } from 'antd';
import { COLOR } from 'libs/ui-theme/src/lib/ui-theme';
import { UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { useHelpers } from 'common-util/hooks';
import { getIpfsResponse, getIpfsUrl } from '../../common-util/functions/ipfs';

type ServicesOfferedModalProps = {
  visible: boolean;
  configHash?: string;
  metadata?: string;
  onCancel: () => void;
};

type ServiceData = {
  name?: string;
  description?: string;
  tools?: string[];
};

const { Text, Paragraph } = Typography;

const SectionHeading = ({ text }: { text: string }) => {
  return <Text style={{ fontSize: 14, color: COLOR.TEXT_TERTIARY }}>{text}</Text>;
};

const ServicesOfferedModal: React.FC<ServicesOfferedModalProps> = ({
  visible,
  onCancel,
  configHash,
  metadata,
}) => {
  const { isMainnet } = useHelpers();
  const [loading, setLoading] = useState(true);
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const hash = metadata || configHash || '';
  const modalTitle = !isMainnet && metadata ? 'Services Offered' : 'Agent Description';

  const getServiceMetadata = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getIpfsResponse(hash);
      setServiceData(data);
    } catch (error) {
      console.error('Error fetching IPFS metadata:', error);
    } finally {
      setLoading(false);
    }
  }, [hash]);

  useEffect(() => {
    if (visible) {
      getServiceMetadata();
    }
  }, [getServiceMetadata, visible]);

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
      destroyOnClose
      styles={{
        content: {
          padding: 32,
        },
      }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin />
        </div>
      ) : (
        <Flex vertical gap={24}>
          {serviceData?.description && (
            <div style={{ marginTop: 16 }}>
              <SectionHeading text="Description" />
              <Paragraph style={{ margin: 0, marginTop: 8, fontSize: 16 }}>
                {serviceData?.description}
              </Paragraph>
            </div>
          )}

          {serviceData?.tools && serviceData.tools.length > 0 && (
            <div>
              <SectionHeading text="Tools" />
              <Space wrap style={{ marginTop: 8, gap: 0 }}>
                {serviceData.tools.map((tool: string, index: number) => (
                  <Tag
                    key={index}
                    style={{
                      marginBottom: 8,
                      border: 'none',
                      borderRadius: 6,
                      padding: '1px 10px',
                    }}
                  >
                    {tool}
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          {hash && (
            <div>
              <SectionHeading text="IPFS Link" />
              <Paragraph style={{ margin: 0, marginTop: 8, fontSize: 16 }}>
                <a href={getIpfsUrl(hash)} target="_blank" rel="noopener noreferrer">
                  {getIpfsUrl(hash)} {UNICODE_SYMBOLS.EXTERNAL_LINK}
                </a>
              </Paragraph>
            </div>
          )}
        </Flex>
      )}
    </Modal>
  );
};

export default ServicesOfferedModal;
