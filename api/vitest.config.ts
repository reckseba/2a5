import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        // Only pick up in-process unit tests. Cypress e2e specs (*.cy.js) live
        // under cypress/ and are run separately via `npm run test`.
        include: ["lib/**/*.test.ts"],
    },
});
