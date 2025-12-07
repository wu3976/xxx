import dotenv from "dotenv";

dotenv.config();
export const { REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT, SERVER_PORT, MONGODB_CONNECTION_STRING } = process.env;