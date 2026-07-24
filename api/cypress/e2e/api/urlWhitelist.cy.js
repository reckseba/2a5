// Covers GET /api/url/whitelist/[id] (authenticated).
// Whitelists the URL's hostname (creates Hostnames row blacklisted=false)
// and flips matching unchecked URLs to checkedBy=WHITELIST.
//
// SEEDING: done at the DB level via the shared seed helpers
// (see cypress/support/seed.js) using the parameterized `queryPGParams` task.

const seed = require("../../support/seed");

const fresh = { short: "Wl1", long: "https://fresh-wl.example.com/a", host: "fresh-wl.example.com" };
const alreadyWhite = { short: "Wl2", long: "https://already-wl.example.com/a", host: "already-wl.example.com" };
const alreadyBlack = { short: "Wl3", long: "https://already-bl.example.com/a", host: "already-bl.example.com" };
const hasDeleted = { short: "Wl4", long: "https://has-deleted.example.com/a", host: "has-deleted.example.com" };

const seeds = [
    seed.truncate(seed.TABLES.URLS),
    seed.truncate(seed.TABLES.HOSTNAMES),
    seed.insertHostname({ hostname: alreadyWhite.host, blacklisted: false }),
    seed.insertHostname({ hostname: alreadyBlack.host, blacklisted: true }),
    seed.insertUrl({ urlShort: fresh.short, urlLong: fresh.long, hostname: fresh.host }),
    seed.insertUrl({ urlShort: alreadyWhite.short, urlLong: alreadyWhite.long, hostname: alreadyWhite.host }),
    seed.insertUrl({ urlShort: alreadyBlack.short, urlLong: alreadyBlack.long, hostname: alreadyBlack.host }),
    // A deleted+checked URL for hasDeleted host -> blocks whitelisting.
    seed.insertUrl({ urlShort: hasDeleted.short, urlLong: hasDeleted.long, hostname: hasDeleted.host, deleted: true, deletedAt: new Date(), checkedBy: "ADMIN", checkedAt: new Date() }),
];

before(() => {
    // Given: a fresh URL, URLs on already-white/black hosts, and a URL whose
    // host already has a deleted URL (which must block whitelisting).
    for (let i = 0; i < seeds.length; i++) {
        cy.task("queryPGParams", seeds[i]);
    }
});

describe("GET /api/url/whitelist/[id]", () => {
    it("whitelists a fresh hostname and flips matching unchecked URLs to WHITELIST", () => {
        // Given: a URL whose hostname is not yet listed.
        cy.authHeaders().then((authHeaders) => {
            cy.task("queryPGParams", seed.idOfUrlShort(fresh.short)).then((rows) => {
                const id = rows[0].id;
                // When: whitelisting that URL's hostname.
                cy.request({ method: "GET", url: "/api/url/whitelist/" + id, headers: authHeaders }).then((response) => {
                    // Then: the request succeeds.
                    expect(response.status).to.eq(200);
                    expect(response.body).to.have.property("message", "success");
                });
                // Then: the hostname is stored as whitelisted (blacklisted=false).
                cy.task("queryPGParams", { text: 'SELECT "blacklisted" FROM ' + seed.TABLES.HOSTNAMES + ' WHERE "hostname" = $1', values: [fresh.host] }).then((res) => {
                    expect(res.length).to.eq(1);
                    expect(res[0].blacklisted).to.eq(false);
                });
                // Then: the matching URL is flipped to WHITELIST.
                cy.task("queryPGParams", seed.selectUrlById(id, ["checkedBy"])).then((res) => {
                    expect(res[0].checkedBy).to.eq("WHITELIST");
                });
            });
        });
    });

    it("returns 400 when the hostname is already whitelisted", () => {
        // Given: a URL whose hostname is already whitelisted.
        cy.authHeaders().then((authHeaders) => {
            cy.task("queryPGParams", seed.idOfUrlShort(alreadyWhite.short)).then((rows) => {
                const id = rows[0].id;
                // When: whitelisting that hostname again.
                cy.request({ method: "GET", url: "/api/url/whitelist/" + id, headers: authHeaders, failOnStatusCode: false }).then((response) => {
                    // Then: it is rejected as already whitelisted.
                    expect(response.status).to.eq(400);
                    expect(response.body).to.have.property("message", "error - whitelisted already");
                    expect(response.body).to.have.property("hostname", alreadyWhite.host);
                });
            });
        });
    });

    it("returns 400 when the hostname is already blacklisted", () => {
        // Given: a URL whose hostname is already blacklisted.
        cy.authHeaders().then((authHeaders) => {
            cy.task("queryPGParams", seed.idOfUrlShort(alreadyBlack.short)).then((rows) => {
                const id = rows[0].id;
                // When: attempting to whitelist that hostname.
                cy.request({ method: "GET", url: "/api/url/whitelist/" + id, headers: authHeaders, failOnStatusCode: false }).then((response) => {
                    // Then: it is rejected as already blacklisted.
                    expect(response.status).to.eq(400);
                    expect(response.body).to.have.property("message", "error - blacklisted already");
                    expect(response.body).to.have.property("hostname", alreadyBlack.host);
                });
            });
        });
    });

    it("returns 400 when there are deleted URLs for the hostname", () => {
        // Given: a URL whose hostname already has a deleted URL.
        cy.authHeaders().then((authHeaders) => {
            cy.task("queryPGParams", seed.idOfUrlShort(hasDeleted.short)).then((rows) => {
                const id = rows[0].id;
                // When: attempting to whitelist that hostname.
                cy.request({ method: "GET", url: "/api/url/whitelist/" + id, headers: authHeaders, failOnStatusCode: false }).then((response) => {
                    // Then: it is rejected because deleted URLs exist for the host.
                    expect(response.status).to.eq(400);
                    expect(response.body).to.have.property("message", "error - deleted URLs");
                    expect(response.body).to.have.property("hostname", hasDeleted.host);
                    expect(response.body.urls).to.be.an("array").and.have.length.greaterThan(0);
                });
            });
        });
    });

    it("returns 404 for a non-existent id", () => {
        // Given: an id that does not exist.
        cy.authHeaders().then((authHeaders) => {
            // When: attempting to whitelist that id.
            cy.request({ method: "GET", url: "/api/url/whitelist/99999999", headers: authHeaders, failOnStatusCode: false }).then((response) => {
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
            cy.request({ method: "POST", url: "/api/url/whitelist/1", headers: authHeaders, failOnStatusCode: false }).then((response) => {
                // Then: the request is rejected with 405.
                expect(response.status).to.eq(405);
            });
        });
    });
});
