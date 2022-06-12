import { ERRORS } from '../constants.js';

const handleError = (error) => {
  switch (error) {
    case ERRORS.noUsernameError: {
      throw new Error(ERRORS.noUsernameError);
    }
    case ERRORS.invalidInput: {
      console.error(ERRORS.invalidInput);
      break;
    }
    case ERRORS.operationFailed: {
      console.error(ERRORS.operationFailed);
      break;
    }
  }
};

export default handleError;
