const fs = require('fs');

module.exports = () => {
  if (fs.existsSync('./config/eula.txt')) {
    if (
      !fs
        .readFileSync('./config/eula.txt')
        .toString()
        .includes('eula=true')
    ) {
	  console.error("Flying-squid cannot start as you haven't agreed to the EULA")
      process.exit(1);
    }
  } else {
    fs.writeFileSync(
      './config/eula.txt',
      '# By changing this value to true you agree to the Minecraft EULA @ https://account.mojang.com/documents/minecraft_eula.\neula=false\n'
    );
	console.error('Please agree to the Minecraft EULA in eula.txt')
    process.exit(1);
  }
};
