// Covers the auth layer in proxy.ts (matcher "/api/:path*").
// Public routes: /api/urlShort/*, /api/urlLong/new, /api/health.
// Everything else requires "Authorization: Bearer <API_BEARER_TOKEN>".

// No seeding required: auth is enforced in proxy.ts before any DB access.

// A representative protected route used to probe the auth behavior.
const protectedRoute = "/api/token/correct";

describe("auth (proxy.ts)", () => {
    it("rejects protected route without authorization header", () => {
        // Given: no authorization header.
        // When: calling a protected route.
        cy.request({
            method: "GET",
            url: protectedRoute,
            failOnStatusCode: false,
        }).then((response) => {
            // Then: it is rejected with 401 (no token provided).
            expect(response.status).to.eq(401);
            expect(response.body).to.have.property("message", "No auth token provided.");
        });
    });

    it("rejects protected route with wrong bearer token", () => {
        // Given: an incorrect bearer token.
        // When: calling a protected route.
        cy.request({
            method: "GET",
            url: protectedRoute,
            failOnStatusCode: false,
            headers: { authorization: "Bearer definitely-not-the-token" },
        }).then((response) => {
            // Then: it is rejected with 401 (invalid token).
            expect(response.status).to.eq(401);
            expect(response.body).to.have.property("message", "Invalid auth token.");
        });
    });

    it("rejects protected route with malformed authorization header (no Bearer prefix)", () => {
        // Given: the token without the "Bearer " prefix.
        cy.env(["API_BEARER_TOKEN"]).then(({ API_BEARER_TOKEN }) => {
            // When: calling a protected route.
            cy.request({
                method: "GET",
                url: protectedRoute,
                failOnStatusCode: false,
                headers: { authorization: API_BEARER_TOKEN },
            }).then((response) => {
                // Then: it is rejected with 401 (invalid token).
                expect(response.status).to.eq(401);
                expect(response.body).to.have.property("message", "Invalid auth token.");
            });
        });
    });

    it("allows protected route with correct bearer token", () => {
        // Given: a valid bearer token.
        cy.authHeaders().then((authHeaders) => {
            // When: calling a protected route.
            cy.request({
                method: "GET",
                url: protectedRoute,
                headers: authHeaders,
            }).then((response) => {
                // Then: the request is allowed through.
                expect(response.status).to.eq(200);
                expect(response.body).to.have.property("message", "success");
            });
        });
    });

    // A protected path that merely CONTAINS the substring "/api/urlShort" must not be
    // treated as the public short-link route. Only the exact "/api/urlShort/<code>" shape
    // is public, so this crafted path requires auth.
    it("does not treat a protected path containing 'urlShort' as public", () => {
        // Given: a protected path crafted to contain "/api/urlShort", with no auth.
        // When: calling that path.
        cy.request({
            method: "GET",
            // This is not the real public short-link route; it should require auth.
            url: "/api/token/correct/api/urlShort/x",
            failOnStatusCode: false,
        }).then((response) => {
            // Then: it is still treated as protected and rejected with 401.
            expect(response.status).to.eq(401);
            expect(response.body).to.have.property("message", "No auth token provided.");
        });
    });

    // A path that merely starts with "/api/urlShort" (but is a different route) must not
    // be treated as public. Guards against a startsWith-style regression.
    it("does not treat '/api/urlShortcut' as the public urlShort route", () => {
        // Given: the "/api/urlShortcut" path (a different route), with no auth.
        // When: calling that path.
        cy.request({
            method: "GET",
            url: "/api/urlShortcut",
            failOnStatusCode: false,
        }).then((response) => {
            // Then: it is treated as protected and rejected with 401.
            expect(response.status).to.eq(401);
            expect(response.body).to.have.property("message", "No auth token provided.");
        });
    });
});
