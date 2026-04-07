const bcrypt = require("bcryptjs");

const hash = async () => {
  const hashed = await bcrypt.hash("securepassword123", 10);
  console.log(hashed);
};

hash();