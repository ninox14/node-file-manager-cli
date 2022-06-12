import { EOL, homedir } from 'os';
import { stdin, stdout } from 'process';
import { createInterface } from 'readline';
import { COMMAND_TYPE, ERRORS } from '../constants.js';
import handleError from '../helpers/handleError.js';
import logCurrentPath from '../helpers/logCurrentPath.js';
import parseInputLine from '../helpers/parseInputLine.js';
import parseUsername from '../helpers/parseUsername.js';
import onExit from './listeners/onExit.js';

class FileManager {
  userName = parseUsername();
  currentPath = homedir();
  logPath = logCurrentPath(this);

  basicMethods = {
    ls: () => {},
    up: () => {},
    '.exit': this['.exit'],
  };

  pathMethods = {
    cd: () => {},
    cat: () => {},
    add: () => {},
    rn: () => {},
    cp: () => {},
    mv: () => {},
    rm: () => {},
    hash: () => {},
    compress: () => {},
    decompress: () => {},
  };

  osMethods = {
    '--EOL': () => {},
    '--cpus': () => {},
    '--homedir': () => {},
    '--username': () => {},
    '--architecture': () => {},
  };

  rl = createInterface({ input: stdin, output: stdout });

  constructor() {
    console.log(`Welcome to the File Manager, ${this.userName}!`);
    this.logPath();

    // Listeners
    process.on('exit', onExit(this.userName));
    this.rl.on('line', this.onLine);
  }

  onLine = (input) => {
    this.logPath();
    const [command, ...args] = parseInputLine(input);

    const commandType = this.validateCommand(command);

    if (commandType) {
      const method = this.selectMethod(commandType, command, args);
    }
  };

  validateCommand(command) {
    if (this.pathMethods[command]) {
      return COMMAND_TYPE.path;
    }
    if (this.basicMethods[command]) {
      return COMMAND_TYPE.basic;
    }
    if (command === COMMAND_TYPE.os) {
      return COMMAND_TYPE.os;
    }
    handleError(ERRORS.invalidInput);
  }

  selectMethod(commandType, command, argsArray) {
    switch (commandType) {
      case COMMAND_TYPE.path: {
        return this.pathMethods[command];
      }
      case COMMAND_TYPE.os: {
        return this.selectOsMethod(argsArray);
      }
      case COMMAND_TYPE.basic: {
        return this.basicMethods[command];
      }
    }
  }
  selectOsMethod(argsArray) {
    const methodName = argsArray[0];
    const isInvaliArgs = !argsArray.length || argsArray.length > 1;

    if (!isInvaliArgs && this.osMethods[methodName]) {
      return this.osMethods[methodName];
    }
  }

  async execute(method, args) {
    try {
      await method(...args);
    } catch {
      handleError(ERRORS.operationFailed);
    }
  }

  ['.exit']() {
    process.exit(0);
  }
}

export default FileManager;
