import { homedir } from 'os';
import logCurrentPath from '../helpers/logCurrentPath.js';
import parseUsername from '../helpers/parseUsername.js';
import onExit from './listeners/onExit.js';

class FileManager {
  currentPath = homedir();
  userName = parseUsername();
  constructor() {
    console.log(`Welcome to the File Manager, ${this.userName}!`);
    logCurrentPath(this.currentPath);

    // Listeners
    process.on('exit', onExit(this.userName));
  }
}

export default FileManager;
