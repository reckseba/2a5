// Covers GET /api/urlShort/[urlShort] (public route).
//
// SEEDING: done at the DB level via the shared seed helpers
// (see cypress/support/seed.js) using the parameterized `queryPGParams` task.
// These states need fixed `urlShort` values which the API cannot set.

const seed = require("../../support/seed");

const existingUrlLong = "https://existing-short.example.com/page";
const existingUrlShort = "Ex1";
const existingUrlShortFull = "https://localhost:3001/" + existingUrlShort;

const deletedUrlLong = "https://gone-short.example.com/page";
const deletedUrlShort = "Gn1";
const deletedUrlShortFull = "https://localhost:3001/" + deletedUrlShort;

const missingUrlShort = "zzz9";

const seeds = [
    seed.truncate(seed.TABLES.URLS),
    seed.insertUrl({ urlLong: existingUrlLong, urlShort: existingUrlShort, urlShortFull: existingUrlShortFull, hostname: "existing-short.example.com", deleted: false }),
    seed.insertUrl({ urlLong: deletedUrlLong, urlShort: deletedUrlShort, urlShortFull: deletedUrlShortFull, hostname: "gone-short.example.com", deleted: true, deletedAt: new Date() }),
];

before(() => {
    // Given: one existing undeleted short link and one deleted short link.
    for (let i = 0; i < seeds.length; i++) {
        cy.task("queryPGParams", seeds[i]);
    }
});

describe("GET /api/urlShort/[urlShort]", () => {
    it("returns 200 with urlLong for an existing, undeleted short link", () => {
        // Given: an existing undeleted short link (seeded).
        // When: resolving that short link.
        cy.request({
            method: "GET",
            url: "/api/urlShort/" + existingUrlShort,
        }).then((response) => {
            // Then: it returns 200 with the original long url.
            expect(response.status).to.eq(200);
            expect(response.body).to.deep.eq({ urlLong: existingUrlLong });
        });
    });

    it("returns 410 gone for a deleted short link", () => {
        // Given: a deleted short link (seeded).
        // When: resolving that short link.
        cy.request({
            method: "GET",
            url: "/api/urlShort/" + deletedUrlShort,
            failOnStatusCode: false,
        }).then((response) => {
            // Then: it returns 410 Gone.
            expect(response.status).to.eq(410);
            expect(response.body).to.have.property("message", "This short link was deleted.");
        });
    });

    it("returns 404 for a non-existent short link", () => {
        // Given: a short code that was never seeded.
        // When: resolving that short link.
        cy.request({
            method: "GET",
            url: "/api/urlShort/" + missingUrlShort,
            failOnStatusCode: false,
        }).then((response) => {
            // Then: it returns 404 Not Found.
            expect(response.status).to.eq(404);
            expect(response.body).to.have.property("message", "Short link not found.");
        });
    });

    // Regex is ^[a-zA-Z0-9]{3,5}$
    const illegalShorts = ["aa", "aaaaaa", "a_b", "ä1b"];
    illegalShorts.forEach((short) => {
        it("returns 400 for illegal short url '" + short + "'", () => {
            // Given: a short code violating the ^[a-zA-Z0-9]{3,5}$ format.
            // When: resolving that short link.
            cy.request({
                method: "GET",
                url: "/api/urlShort/" + encodeURIComponent(short),
                failOnStatusCode: false,
            }).then((response) => {
                // Then: it returns 400 Illegal short Url.
                expect(response.status).to.eq(400);
                expect(response.body).to.have.property("message", "Illegal short Url.");
            });
        });
    });

    it("rejects non-GET with 405", () => {
        // Given: an existing short link.
        // When: using a disallowed method on it.
        cy.request({
            method: "POST",
            url: "/api/urlShort/" + existingUrlShort,
            failOnStatusCode: false,
        }).then((response) => {
            // Then: the request is rejected with 405.
            expect(response.status).to.eq(405);
            expect(response.body).to.have.property("message", "Only GET requests allowed.");
        });
    });
});
