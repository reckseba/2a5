// Covers GET /api/url/check/[id] (authenticated).
// Marks a URL as ADMIN-checked, unless its hostname is blacklisted.
//
// SEEDING: done at the DB level via the shared seed helpers
// (see cypress/support/seed.js) using the parameterized `queryPGParams` task.

const seed = require("../../support/seed");

const checkableUrl = { short: "Ck1", long: "https://checkable.example.com/a", host: "checkable.example.com" };
const blacklistedHostUrl = { short: "Ck2", long: "https://blocked-check.example.com/a", host: "blocked-check.example.com" };

const seeds = [
    seed.truncate(seed.TABLES.URLS),
    seed.truncate(seed.TABLES.HOSTNAMES),
    seed.insertHostname({ hostname: blacklistedHostUrl.host, blacklisted: true }),
    seed.insertUrl({ urlShort: checkableUrl.short, urlLong: checkableUrl.long, hostname: checkableUrl.host }),
    seed.insertUrl({ urlShort: blacklistedHostUrl.short, urlLong: blacklistedHostUrl.long, hostname: blacklistedHostUrl.host }),
];

before(() => {
    // Given: one URL on a normal hostname and one URL on a blacklisted hostname.
    for (let i = 0; i < seeds.length; i++) {
        cy.task("queryPGParams", seeds[i]);
    }
});

describe("GET /api/url/check/[id]", () => {
    it("checks a URL whose hostname is not blacklisted and sets checkedBy=ADMIN", () => {
        // Given: a URL whose hostname is not blacklisted.
        cy.authHeaders().then((authHeaders) => {
            cy.task("queryPGParams", seed.idOfUrlShort(checkableUrl.short)).then((rows) => {
                const id = rows[0].id;
                // When: checking that URL.
                cy.request({ method: "GET", url: "/api/url/check/" + id, headers: authHeaders }).then((response) => {
                    // Then: the request succeeds.
                    expect(response.status).to.eq(200);
                    expect(response.body).to.have.property("message", "success");
                });
                // Then: the row is marked ADMIN-checked and not deleted.
                cy.task("queryPGParams", seed.selectUrlById(id, ["checkedBy", "checkedAt", "deleted"])).then((res) => {
                    expect(res[0].checkedBy).to.eq("ADMIN");
                    expect(res[0].checkedAt).to.not.eq(null);
                    expect(res[0].deleted).to.eq(false);
                });
            });
        });
    });

    it("returns 400 when the URL's hostname is blacklisted", () => {
        // Given: a URL whose hostname is blacklisted.
        cy.authHeaders().then((authHeaders) => {
            cy.task("queryPGParams", seed.idOfUrlShort(blacklistedHostUrl.short)).then((rows) => {
                const id = rows[0].id;
                // When: attempting to check that URL.
                cy.request({ method: "GET", url: "/api/url/check/" + id, headers: authHeaders, failOnStatusCode: false }).then((response) => {
                    // Then: it is rejected because the hostname is blacklisted.
                    expect(response.status).to.eq(400);
                    expect(response.body).to.have.property("message", "Hostname is blacklisted.");
                });
            });
        });
    });

    it("returns 404 for a non-existent id", () => {
        // Given: an id that does not exist.
        cy.authHeaders().then((authHeaders) => {
            // When: attempting to check that id.
            cy.request({ method: "GET", url: "/api/url/check/99999999", headers: authHeaders, failOnStatusCode: false }).then((response) => {
                // Then: it returns 404 Not Found.
                expect(response.status).to.eq(404);
                expect(response.body).to.have.property("message", "Not found.");
            });
        });
    });

    it("rejects non-GET with 405", () => {
        // Given: an authenticated client.
        cy.authHeaders().then((authHeaders) => {
            // When: using a disallowed method on the endpoint.
            cy.request({ method: "POST", url: "/api/url/check/1", headers: authHeaders, failOnStatusCode: false }).then((response) => {
                // Then: the request is rejected with 405.
                expect(response.status).to.eq(405);
            });
        });
    });
});
