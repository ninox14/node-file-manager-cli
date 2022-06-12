const logCurrentPath = (FileManager) => () => {
  console.log(`You are currently in ${FileManager.currentPath}`);
};

export default logCurrentPath;
