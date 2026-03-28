const bcrypt = require("bcryptjs");

const hash = async () => {
  const hashed = await bcrypt.hash("your_plain_password_here", 10);
  console.log(hashed);
};

hash();