// Jest setup file - load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local for test environment
config({ path: resolve(process.cwd(), ".env.local") });
