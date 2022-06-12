import { unlinkSync } from 'fs';

const removeFile = (isMove, filePath) => () => {
  if (isMove) {
    unlinkSync(filePath);
  }
};

export default removeFile;
