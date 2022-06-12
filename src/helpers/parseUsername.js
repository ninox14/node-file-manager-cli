import { ERRORS, USERNAME_ARG_PREFIX } from '../constants.js';
import handleError from './handleError.js';

const parseUsername = () => {
  const args = process.argv.slice(2);

  const userName = args[0] ? args[0].split(USERNAME_ARG_PREFIX)[1] : null;
  const isUsernameArgMissing = !args[0] || !userName;

  if (isUsernameArgMissing) {
    handleError(ERRORS.noUsernameError);
  }

  return userName;
};

export default parseUsername;
