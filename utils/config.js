require("dotenv").config();

const PORT = process.env.PORT;
const MONGODB_URI = () => {
  if (process.env.NODE_ENV === "production")
    return process.env.PROD_MONGODB_URI;
  else if (process.env.NODE_ENV === "development")
    return process.env.DEV_MONGODB_URI;
  else return process.env.TEST_MONGODB_URI;
};

module.exports = {
  MONGODB_URI,
  PORT,
};
