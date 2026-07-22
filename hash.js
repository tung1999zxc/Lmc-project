const bcrypt = require("bcryptjs");

(async () => {
  const hash = await bcrypt.hash("1", 10);
  console.log(hash);
})();
//// node hash.js
//// $2b$10$7ldFtlwsYTOxjdOn4CNX4eVnYiRbGymUR.pwW5Gyl5MjaFTyLNV7O
/// node sync-common-collections.js