// Covers GET /api/health (public route).

// No seeding required: the health endpoint is stateless.

describe("GET /api/health", () => {
    it("returns 200 healthy on GET", () => {
        // Given: the running API.
        // When: requesting the health endpoint.
        cy.request({ method: "GET", url: "/api/health" }).then((response) => {
            // Then: it reports healthy.
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property("message", "healthy");
        });
    });

    it("rejects non-GET with 405", () => {
        // Given: the running API.
        // When: using a disallowed method on the endpoint.
        cy.request({
            method: "POST",
            url: "/api/health",
            failOnStatusCode: false,
        }).then((response) => {
            // Then: the request is rejected with 405.
            expect(response.status).to.eq(405);
            expect(response.body).to.have.property("message", "Only GET requests allowed.");
        });
    });
});
