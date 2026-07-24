// Covers GET /api/token/correct (authenticated route).
// Auth failure cases live in auth.cy.js; here we cover method handling + happy path.

// No seeding required: this endpoint only validates the bearer token + method.

describe("GET /api/token/correct", () => {
    it("returns 200 success with a valid token on GET", () => {
        // Given: an authenticated client with a valid bearer token.
        cy.authHeaders().then((authHeaders) => {
            // When: requesting the token-correct endpoint.
            cy.request({
                method: "GET",
                url: "/api/token/correct",
                headers: authHeaders,
            }).then((response) => {
                // Then: it confirms success.
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property("message", "success");
            });
        });
    });

    it("rejects non-GET with 405", () => {
        // Given: an authenticated client.
        cy.authHeaders().then((authHeaders) => {
            // When: using a disallowed method on the endpoint.
            cy.request({
                method: "POST",
                url: "/api/token/correct",
                headers: authHeaders,
                failOnStatusCode: false,
            }).then((response) => {
                // Then: the request is rejected with 405.
                expect(response.status).to.eq(405);
                expect(response.body).to.have.property("message", "Only GET requests allowed.");
            });
        });
    });
});
