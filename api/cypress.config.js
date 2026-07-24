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
    env: {
        API_BEARER_TOKEN: dotenvOutput.parsed.API_BEARER_TOKEN
    },
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
                },
                // Parameterized variant of queryPG. Accepts { text, values } and lets
                // node-postgres bind the values safely ($1, $2, ...). This avoids the
                // fragile string concatenation used for seeding (quote escaping,
                // injection-style building) and keeps seed data readable.
                async queryPGParams({ text, values }) {
                    const client = new Client(clientConfig);
                    await client.connect();
                    const res = await client.query(text, values);
                    await client.end();
                    return res.rows;
                }
            });
        }
    }
});
