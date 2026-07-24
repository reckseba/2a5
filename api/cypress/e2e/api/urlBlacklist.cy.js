// Covers GET /api/url/blacklist/[id] (authenticated).
// Blacklists the URL's hostname (creates Hostnames row blacklisted=true)
// and soft-deletes matching unchecked URLs with checkedBy=BLACKLIST.
//
// SEEDING: done at the DB level via the shared seed helpers
// (see cypress/support/seed.js) using the parameterized `queryPGParams` task.

const seed = require("../../support/seed");

const fresh = { short: "Bl1", long: "https://fresh-bl.example.com/a", host: "fresh-bl.example.com" };
const alreadyBlack = { short: "Bl2", long: "https://already-bl2.example.com/a", host: "already-bl2.example.com" };
const hasChecked = { short: "Bl3", long: "https://has-checked.example.com/a", host: "has-checked.example.com" };

const seeds = [
    seed.truncate(seed.TABLES.URLS),
    seed.truncate(seed.TABLES.HOSTNAMES),
    seed.insertHostname({ hostname: alreadyBlack.host, blacklisted: true }),
    seed.insertUrl({ urlShort: fresh.short, urlLong: fresh.long, hostname: fresh.host }),
    seed.insertUrl({ urlShort: alreadyBlack.short, urlLong: alreadyBlack.long, hostname: alreadyBlack.host }),
    // An undeleted+checked URL for hasChecked host -> blocks blacklisting.
    seed.insertUrl({ urlShort: hasChecked.short, urlLong: hasChecked.long, hostname: hasChecked.host, deleted: false, checkedBy: "ADMIN", checkedAt: new Date() }),
];

before(() => {
    // Given: a fresh URL, a URL on an already-blacklisted host, and a URL whose
    // host already has a checked URL (which must block blacklisting).
    for (let i = 0; i < seeds.length; i++) {
        cy.task("queryPGParams", seeds[i]);
    }
});

describe("GET /api/url/blacklist/[id]", () => {
    it("blacklists a fresh hostname and soft-deletes matching unchecked URLs as BLACKLIST", () => {
        // Given: a URL whose hostname is not yet listed.
        cy.authHeaders().then((authHeaders) => {
            cy.task("queryPGParams", seed.idOfUrlShort(fresh.short)).then((rows) => {
                const id = rows[0].id;
                // When: blacklisting that URL's hostname.
                cy.request({ method: "GET", url: "/api/url/blacklist/" + id, headers: authHeaders }).then((response) => {
                    // Then: the request succeeds.
                    expect(response.status).to.eq(200);
                    expect(response.body).to.have.property("message", "success");
                });
                // Then: the hostname is stored as blacklisted.
                cy.task("queryPGParams", { text: 'SELECT "blacklisted" FROM ' + seed.TABLES.HOSTNAMES + ' WHERE "hostname" = $1', values: [fresh.host] }).then((res) => {
                    expect(res.length).to.eq(1);
                    expect(res[0].blacklisted).to.eq(true);
                });
                // Then: the matching URL is soft-deleted as BLACKLIST.
                cy.task("queryPGParams", seed.selectUrlById(id, ["checkedBy", "deleted"])).then((res) => {
                    expect(res[0].checkedBy).to.eq("BLACKLIST");
                    expect(res[0].deleted).to.eq(true);
                });
            });
        });
    });

    it("returns 400 when the hostname is already blacklisted", () => {
        // Given: a URL whose hostname is already blacklisted.
        cy.authHeaders().then((authHeaders) => {
            cy.task("queryPGParams", seed.idOfUrlShort(alreadyBlack.short)).then((rows) => {
                const id = rows[0].id;
                // When: blacklisting that URL's hostname again.
                cy.request({ method: "GET", url: "/api/url/blacklist/" + id, headers: authHeaders, failOnStatusCode: false }).then((response) => {
                    // Then: it is rejected as already blacklisted.
                    expect(response.status).to.eq(400);
                    expect(response.body).to.have.property("message", "error - blacklisted already");
                    expect(response.body).to.have.property("hostname", alreadyBlack.host);
                });
            });
        });
    });

    it("returns 400 when there are checked URLs for the hostname", () => {
        // Given: a URL whose hostname already has a checked URL.
        cy.authHeaders().then((authHeaders) => {
            cy.task("queryPGParams", seed.idOfUrlShort(hasChecked.short)).then((rows) => {
                const id = rows[0].id;
                // When: attempting to blacklist that hostname.
                cy.request({ method: "GET", url: "/api/url/blacklist/" + id, headers: authHeaders, failOnStatusCode: false }).then((response) => {
                    // Then: it is rejected because checked URLs exist for the host.
                    expect(response.status).to.eq(400);
                    expect(response.body).to.have.property("message", "error - checked URLs");
                    expect(response.body).to.have.property("hostname", hasChecked.host);
                    expect(response.body.urls).to.be.an("array").and.have.length.greaterThan(0);
                });
            });
        });
    });

    it("returns 404 for a non-existent id", () => {
        // Given: an id that does not exist.
        cy.authHeaders().then((authHeaders) => {
            // When: attempting to blacklist that id.
            cy.request({ method: "GET", url: "/api/url/blacklist/99999999", headers: authHeaders, failOnStatusCode: false }).then((response) => {
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
            cy.request({ method: "POST", url: "/api/url/blacklist/1", headers: authHeaders, failOnStatusCode: false }).then((response) => {
                // Then: the request is rejected with 405.
                expect(response.status).to.eq(405);
            });
        });
    });
});
