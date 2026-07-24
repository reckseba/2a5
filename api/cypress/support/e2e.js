// this file is needed by cypress

// Yields an authorization headers object built from the sensitive API bearer token.
// The token is read securely via cy.env() (Cypress.env() is disabled).
Cypress.Commands.add("authHeaders", () =>
    cy.env(["API_BEARER_TOKEN"]).then(({ API_BEARER_TOKEN }) => ({
        authorization: "Bearer " + API_BEARER_TOKEN,
    }))
);
