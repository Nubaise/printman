require("dotenv").config({ quiet: true });

if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL is not configured");
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
