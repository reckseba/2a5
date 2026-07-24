// Covers the three authenticated URL list endpoints:
//   GET /api/urls/undeleted-unchecked  -> deleted=false, checkedBy=null
//   GET /api/urls/undeleted-checked    -> deleted=false, checkedBy != null
//   GET /api/urls/deleted-checked      -> deleted=true,  checkedBy != null
//
// SEEDING: done directly at the DB level (not via the API) because these states
// cannot be produced through the endpoints: they require fixed `urlShort`
// values and controlled `createdAt` timestamps (for deterministic ordering),
// and the `deleted=true + checkedBy=null` bucket the API never creates.
// Seeds use the parameterized `queryPGParams` task via the shared seed helpers
// (see cypress/support/seed.js) so values are bound safely and the column
// layout lives in one schema-aligned place.

const seed = require("../../support/seed");

// One representative row per bucket. Timestamps are set so ordering
// (createdAt desc) is deterministic for the "undeleted + checked" list.
const undeletedUnchecked = { short: "Uu1", long: "https://uu.example.com/a", host: "uu.example.com" };
const undeletedCheckedOld = { short: "Uc1", long: "https://uc.example.com/a", host: "uc.example.com" };
const undeletedCheckedNew = { short: "Uc2", long: "https://uc.example.com/b", host: "uc.example.com" };
const deletedChecked = { short: "Dc1", long: "https://dc.example.com/a", host: "dc.example.com" };

// Deterministic, controlled timestamps (bound as real timestamps by pg).
const now = new Date();
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

// The seed statements, each a safe { text, values } pair.
const seeds = [
    seed.truncate(seed.TABLES.URLS),
    // undeleted + unchecked (deleted defaults false, checkedBy null)
    seed.insertUrl({ urlShort: undeletedUnchecked.short, urlLong: undeletedUnchecked.long, hostname: undeletedUnchecked.host }),
    // undeleted + checked, older createdAt
    seed.insertUrl({ urlShort: undeletedCheckedOld.short, urlLong: undeletedCheckedOld.long, hostname: undeletedCheckedOld.host, deleted: false, checkedBy: "ADMIN", checkedAt: now, createdAt: twoHoursAgo }),
    // undeleted + checked, newer createdAt
    seed.insertUrl({ urlShort: undeletedCheckedNew.short, urlLong: undeletedCheckedNew.long, hostname: undeletedCheckedNew.host, deleted: false, checkedBy: "WHITELIST", checkedAt: now, createdAt: oneHourAgo }),
    // deleted + checked
    seed.insertUrl({ urlShort: deletedChecked.short, urlLong: deletedChecked.long, hostname: deletedChecked.host, deleted: true, deletedAt: now, checkedBy: "ADMIN", checkedAt: now }),
];

before(() => {
    // Given: a database seeded with one URL per bucket (see `seeds` above).
    for (let i = 0; i < seeds.length; i++) {
        cy.task("queryPGParams", seeds[i]);
    }
});

const shortsOf = (body) => body.map((u) => u.urlShort);

describe("GET /api/urls/undeleted-unchecked", () => {
    it("returns only undeleted + unchecked URLs", () => {
        // Given: the seeded rows (one per bucket) from the top-level `before`.
        cy.authHeaders().then((authHeaders) => {
            // When: requesting the undeleted-unchecked list.
            cy.request({ method: "GET", url: "/api/urls/undeleted-unchecked", headers: authHeaders }).then((response) => {
                // Then: only the undeleted + unchecked row is returned.
                expect(response.status).to.eq(200);
                const shorts = shortsOf(response.body);
                expect(shorts).to.include(undeletedUnchecked.short);
                expect(shorts).to.not.include(undeletedCheckedOld.short);
                expect(shorts).to.not.include(undeletedCheckedNew.short);
                expect(shorts).to.not.include(deletedChecked.short);
            });
        });
    });

    it("rejects non-GET with 405", () => {
        // Given: an authenticated client.
        cy.authHeaders().then((authHeaders) => {
            // When: using a disallowed method on the list endpoint.
            cy.request({ method: "POST", url: "/api/urls/undeleted-unchecked", headers: authHeaders, failOnStatusCode: false }).then((response) => {
                // Then: the request is rejected with 405.
                expect(response.status).to.eq(405);
            });
        });
    });
});

describe("GET /api/urls/undeleted-checked", () => {
    it("returns only undeleted + checked URLs, newest first", () => {
        // Given: two undeleted+checked rows with controlled createdAt (old/new).
        cy.authHeaders().then((authHeaders) => {
            // When: requesting the undeleted-checked list.
            cy.request({ method: "GET", url: "/api/urls/undeleted-checked", headers: authHeaders }).then((response) => {
                // Then: only undeleted+checked rows are returned, newest first.
                expect(response.status).to.eq(200);
                const shorts = shortsOf(response.body);
                expect(shorts).to.include(undeletedCheckedOld.short);
                expect(shorts).to.include(undeletedCheckedNew.short);
                expect(shorts).to.not.include(undeletedUnchecked.short);
                expect(shorts).to.not.include(deletedChecked.short);
                // ordering: createdAt desc -> newer before older
                expect(shorts.indexOf(undeletedCheckedNew.short)).to.be.lessThan(shorts.indexOf(undeletedCheckedOld.short));
            });
        });
    });

    it("rejects non-GET with 405", () => {
        // Given: an authenticated client.
        cy.authHeaders().then((authHeaders) => {
            // When: using a disallowed method on the list endpoint.
            cy.request({ method: "POST", url: "/api/urls/undeleted-checked", headers: authHeaders, failOnStatusCode: false }).then((response) => {
                // Then: the request is rejected with 405.
                expect(response.status).to.eq(405);
            });
        });
    });
});

describe("GET /api/urls/deleted-checked", () => {
    it("returns only deleted + checked URLs", () => {
        // Given: one deleted+checked row among the seeded buckets.
        cy.authHeaders().then((authHeaders) => {
            // When: requesting the deleted-checked list.
            cy.request({ method: "GET", url: "/api/urls/deleted-checked", headers: authHeaders }).then((response) => {
                // Then: only the deleted + checked row is returned.
                expect(response.status).to.eq(200);
                const shorts = shortsOf(response.body);
                expect(shorts).to.include(deletedChecked.short);
                expect(shorts).to.not.include(undeletedUnchecked.short);
                expect(shorts).to.not.include(undeletedCheckedOld.short);
                expect(shorts).to.not.include(undeletedCheckedNew.short);
            });
        });
    });

    it("rejects non-GET with 405", () => {
        // Given: an authenticated client.
        cy.authHeaders().then((authHeaders) => {
            // When: using a disallowed method on the list endpoint.
            cy.request({ method: "POST", url: "/api/urls/deleted-checked", headers: authHeaders, failOnStatusCode: false }).then((response) => {
                // Then: the request is rejected with 405.
                expect(response.status).to.eq(405);
            });
        });
    });
});
