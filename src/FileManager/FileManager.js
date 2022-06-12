import {
  copyFileSync,
  createReadStream,
  createWriteStream,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  renameSync,
  unlinkSync,
} from 'fs';
import { EOL, homedir } from 'os';
import { basename, dirname, join, parse, resolve } from 'path';
import { stdin, stdout } from 'process';
import { createInterface } from 'readline';
import { COMMAND_TYPE, ERRORS, QUOTES_REGEX } from '../constants.js';
import handleError from '../helpers/handleError.js';
import parseInputLine from '../helpers/parseInputLine.js';
import parseUsername from '../helpers/parseUsername.js';
import removeFile from '../helpers/removeFile.js';
import onExit from './listeners/onExit.js';

class FileManager {
  userName = parseUsername();
  // _currentPath = homedir();
  _currentPath = `F:\\Projects\\rsSchool\\repos\\nodeJsCourse\\node-file-manager-cli\\dist`;

  basicMethods = {
    ls: this.readDir.bind(this),
    up: () => this.changeDirectory('..'),
    '.exit': this.exit,
  };

  pathMethods = {
    cd: this.changeDirectory.bind(this),
    cat: this.readFile.bind(this),
    add: this.addFile.bind(this),
    rn: this.rename.bind(this),
    cp: (...args) => {
      this.copy(false, args);
    },
    mv: (...args) => {
      this.copy(true, args);
    },
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
    // this.askUser();

    // Listeners
    process.on('exit', onExit(this.userName));
    this.rl.on('line', this.onAnswer);
  }

  // askUser() {
  //   this.rl.question(
  //     `You are currently in ${this._currentPath}\n$ `,
  //     this.onAnswer.bind(this)
  //   );
  // }

  onAnswer = async (input) => {
    this.logPath();
    const [command, ...args] = parseInputLine(input);

    const commandType = this.validateCommand(command);

    if (commandType) {
      const method = this.selectMethod(commandType, command, args);

      await this.execute(method, args);
    } else {
      // this.askUser();
      // handleError(ERRORS.invalidInput);
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

  // clearPath(path, ...args) {
  //   if (QUOTES_REGEX.test(path)) {

  //   }
  // }

  validateFilePath(path, ...args) {
    const filePath = resolve(
      this._currentPath,
      join([path, ...args].join(' '))
    );
    return existsSync(filePath) && lstatSync(filePath).isFile()
      ? filePath
      : null;
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
    return () => {
      handleError(ERRORS.invalidInput);
    };
  }

  async execute(method, argsArray) {
    try {
      await method(...argsArray);
      this.logPath();
      // this.askUser();
    } catch (e) {
      console.log(e.message);
      handleError(ERRORS.operationFailed);
      // this.askUser();
    }
  }

  exit() {
    process.exit(0);
  }

  changeDirectory(path, ...args) {
    if (args.length || !path) {
      handleError(ERRORS.invalidInput);
    }
    const newPath = resolve(this._currentPath, join([path, ...args].join(' ')));
    const isValidFolder =
      existsSync(newPath) && lstatSync(newPath).isDirectory();
    if (isValidFolder) {
      this._currentPath = newPath;
    } else {
      handleError(ERRORS.invalidInput);
    }
  }

  readDir(...args) {
    if (args.length) {
      handleError(ERRORS.invalidInput);
      return;
    }
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

  readFile(path, ...args) {
    if (args.length) {
      handleError(ERRORS.invalidInput);
      return;
    }
    const filePath = this.validateFilePath(path, ...args);

    if (filePath) {
      console.log('-- Start of file --');
      const rs = createReadStream(filePath);
      return new Promise((res) => {
        rs.pipe(stdout);
        rs.on('end', () => {
          console.log('\n -- End of file --');
          res();
        });
      });
    }
    handleError(ERRORS.invalidInput);
  }

  addFile(fileName, ...args) {
    const ws = createWriteStream(join(this._currentPath, fileName));
    ws.close();
  }

  rename(path, name, ...args) {
    const filePath = this.validateFilePath(path);
    if (filePath) {
      renameSync(filePath, join(dirname(filePath), name));
    } else {
      handleError(ERRORS.invalidInput);
    }
  }

  copy(isMove = false, [path, dir, ...args]) {
    const filePath = this.validateFilePath(resolve(this._currentPath, path));
    const dirPath = resolve(this._currentPath, dir);
    const fileStats = lstatSync(filePath);
    const fileName = basename(filePath);
    const destPath = join(dirPath, fileName);

    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    if (filePath && fileStats.isFile()) {
      if (!existsSync(destPath)) {
        return new Promise((res) => {
          const rs = createReadStream(filePath);
          const ws = createWriteStream(destPath);

          rs.pipe(ws);
          ws.on('finish', res);
        }).then(removeFile(isMove, filePath));
      } else {
        return new Promise((res) => {
          const rs = createReadStream(filePath);
          const ws = createWriteStream(
            join(dirPath, `${Date.now()}${fileName}`)
          );

          rs.pipe(ws);
          ws.on('finish', () => {
            res();
          });
        }).then(removeFile(isMove, filePath));
      }
    } else {
      handleError(ERRORS.invalidInput);
    }
  }
}

export default FileManager;
