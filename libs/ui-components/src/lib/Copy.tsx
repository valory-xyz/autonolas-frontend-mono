import { Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

export const Copy = ({ text }: { text: string }) => {
  return (
    <Button
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
      }}
      icon={<CopyOutlined />}
    />
  );
};
