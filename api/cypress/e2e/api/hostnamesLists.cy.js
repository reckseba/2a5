// Covers the authenticated hostname list endpoints:
//   GET /api/hostnames/whitelisted -> blacklisted=false
//   GET /api/hostnames/blacklisted -> blacklisted=true
//
// SEEDING: done at the DB level via the shared seed helpers
// (see cypress/support/seed.js) using the parameterized `queryPGParams` task.

const seed = require("../../support/seed");

const whitelistedHostname = "whitelisted.example.com";
const blacklistedHostname = "blacklisted.example.com";

const seeds = [
    seed.truncate(seed.TABLES.HOSTNAMES),
    seed.insertHostname({ hostname: whitelistedHostname, blacklisted: false }),
    seed.insertHostname({ hostname: blacklistedHostname, blacklisted: true }),
];

before(() => {
    // Given: one whitelisted and one blacklisted hostname.
    for (let i = 0; i < seeds.length; i++) {
        cy.task("queryPGParams", seeds[i]);
    }
});

const hostnamesOf = (body) => body.map((h) => h.hostname);

describe("GET /api/hostnames/whitelisted", () => {
    it("returns only whitelisted hostnames with id + hostname fields", () => {
        // Given: the seeded whitelisted/blacklisted hostnames.
        cy.authHeaders().then((authHeaders) => {
            // When: requesting the whitelisted hostnames list.
            cy.request({ method: "GET", url: "/api/hostnames/whitelisted", headers: authHeaders }).then((response) => {
                // Then: only the whitelisted hostname appears, with id + hostname.
                expect(response.status).to.eq(200);
                const hostnames = hostnamesOf(response.body);
                expect(hostnames).to.include(whitelistedHostname);
                expect(hostnames).to.not.include(blacklistedHostname);
                response.body.forEach((h) => {
                    expect(h).to.have.property("id");
                    expect(h).to.have.property("hostname");
                });
            });
        });
    });

    it("rejects non-GET with 405", () => {
        // Given: an authenticated client.
        cy.authHeaders().then((authHeaders) => {
            // When: using a disallowed method on the endpoint.
            cy.request({ method: "POST", url: "/api/hostnames/whitelisted", headers: authHeaders, failOnStatusCode: false }).then((response) => {
                // Then: the request is rejected with 405.
                expect(response.status).to.eq(405);
            });
        });
    });
});

describe("GET /api/hostnames/blacklisted", () => {
    it("returns only blacklisted hostnames with id + hostname fields", () => {
        // Given: the seeded whitelisted/blacklisted hostnames.
        cy.authHeaders().then((authHeaders) => {
            // When: requesting the blacklisted hostnames list.
            cy.request({ method: "GET", url: "/api/hostnames/blacklisted", headers: authHeaders }).then((response) => {
                // Then: only the blacklisted hostname appears, with id + hostname.
                expect(response.status).to.eq(200);
                const hostnames = hostnamesOf(response.body);
                expect(hostnames).to.include(blacklistedHostname);
                expect(hostnames).to.not.include(whitelistedHostname);
                response.body.forEach((h) => {
                    expect(h).to.have.property("id");
                    expect(h).to.have.property("hostname");
                });
            });
        });
    });

    it("rejects non-GET with 405", () => {
        // Given: an authenticated client.
        cy.authHeaders().then((authHeaders) => {
            // When: using a disallowed method on the endpoint.
            cy.request({ method: "POST", url: "/api/hostnames/blacklisted", headers: authHeaders, failOnStatusCode: false }).then((response) => {
                // Then: the request is rejected with 405.
                expect(response.status).to.eq(405);
            });
        });
    });
});
