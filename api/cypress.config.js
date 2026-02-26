const { defineConfig } = require("cypress");
const { Client } = require("pg");
const dotenvOutput = require("dotenv").config({ path: ".env.development.local" });

const clientConfig = {
    user: dotenvOutput.parsed.DATABASE_APP_USERNAME,
    password: dotenvOutput.parsed.DATABASE_APP_PASSWORD,
    host: "localhost",
    database: dotenvOutput.parsed.DATABASE_NAME,
    ssl: false,
    port: dotenvOutput.parsed.DATABASE_PORT
};

module.exports = defineConfig({
    allowCypressEnv: false,
    e2e: {
        baseUrl: "http://localhost:3000",
        setupNodeEvents(on, config) {
            on("task", {
                log(message) {
                    console.log(message);

                    return null;
                },
                async queryPG(query) {
                    const client = new Client(clientConfig);
                    await client.connect();
                    const res = await client.query(query);
                    await client.end();
                    return res.rows;
                }
            });
        }
    }
});
