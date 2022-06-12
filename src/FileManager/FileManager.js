import { existsSync, lstatSync, readdirSync } from 'fs';
import { EOL, homedir } from 'os';
import { parse, resolve } from 'path';
import { stdin, stdout } from 'process';
import { createInterface } from 'readline';
import { COMMAND_TYPE, ERRORS } from '../constants.js';
import handleError from '../helpers/handleError.js';
import parseInputLine from '../helpers/parseInputLine.js';
import parseUsername from '../helpers/parseUsername.js';
import onExit from './listeners/onExit.js';

class FileManager {
  userName = parseUsername();
  // currentPath = homedir();
  _currentPath = `F:\\Projects\\rsSchool\\repos\\nodeJsCourse\\node-file-manager-cli\\.dist`;

  basicMethods = {
    ls: this.readDir.bind(this),
    up: () => this.changeDirectory('..'),
    '.exit': this.exit,
  };

  pathMethods = {
    cd: this.changeDirectory.bind(this),
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

  onLine = async (input) => {
    this.logPath();
    const [command, ...args] = parseInputLine(input);

    const commandType = this.validateCommand(command);

    if (commandType) {
      const method = this.selectMethod(commandType, command, args);

      await this.execute(method, args);
    }
  };

  logPath() {
    console.log(`You are currently in ${this._currentPath}`);
  }

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
      case COMMAND_TYPE.basic: {
        return this.basicMethods[command];
      }
      case COMMAND_TYPE.os: {
        return this.selectOsMethod(argsArray);
      }
    }
  }

  selectOsMethod(argsArray) {
    const methodName = argsArray[0];
    const isInvaliArgs = !argsArray.length || argsArray.length > 1;
    const isMethodExists = !isInvaliArgs && this.osMethods[methodName];

    if (isMethodExists) {
      return this.osMethods[methodName];
    }
    return () => handleError(ERRORS.invalidInput);
  }

  async execute(method, argsArray) {
    try {
      await method(...argsArray);
      this.logPath();
    } catch (e) {
      console.log(e.message);
      handleError(ERRORS.operationFailed);
    }
  }

  exit() {
    process.exit(0);
  }

  changeDirectory(path, ...args) {
    if (args.length) {
      handleError(ERRORS.invalidInput);
    }
    const newPath = resolve(this._currentPath, path);
    const isValidFolder =
      existsSync(newPath) && lstatSync(newPath).isDirectory();
    if (isValidFolder) {
      this._currentPath = newPath;
    } else {
      throw new Error('Invalid path');
    }
  }

  readDir() {
    const files = readdirSync(this._currentPath, { withFileTypes: true });
    if (files.length) {
      files.forEach((file) => {
        if (file.isFile()) {
          console.log(file.name);
        }
        if (file.isDirectory()) {
          console.log(`/${file.name}`);
        }
      });
    } else {
      console.log('Empty folder.');
    }
  }
}

export default FileManager;
