import { FileImageOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import { useRef } from 'react';

import { TweetOrThread } from '.';

const SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png'];
const MAX_IMAGE_SIZE_IN_MB = 5;
const MAX_IMAGE_SIZE = MAX_IMAGE_SIZE_IN_MB * 1024 * 1024;
const ACCEPT = SUPPORTED_FILE_TYPES.join(',');

type UploadButtonProps = {
  disabled: boolean;
  title?: string;
  onUploadMedia: (file: TweetOrThread['media'][number]) => void;
};

const UploadButton = ({
  disabled = true,
  title = 'Add Image',
  onUploadMedia,
  ...rest
}: UploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (inputRef.current) {
      inputRef.current.value = '';
    }

    // Validate file type
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      message.error('Unsupported file type. Please select an image file.');
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      message.error(`File size limit is ${MAX_IMAGE_SIZE_IN_MB} MB. Please select a smaller file.`);
      return;
    }

    onUploadMedia(file);
  };

  return (
    <>
      <input
        type="file"
        accept={ACCEPT}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        ref={inputRef}
      />
      <Button
        type="link"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        icon={<FileImageOutlined />}
        {...rest}
      >
        {title}
      </Button>
    </>
  );
};

export default UploadButton;
