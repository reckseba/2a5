// Covers DELETE /api/url/delete/[id] (authenticated).
// Soft-deletes a URL: deleted=true, deletedAt set, checkedBy=ADMIN.
//
// SEEDING: done at the DB level via the shared seed helpers
// (see cypress/support/seed.js) using the parameterized `queryPGParams` task.

const seed = require("../../support/seed");

const deletable = { short: "De1", long: "https://deletable.example.com/a", host: "deletable.example.com" };

const seeds = [
    seed.truncate(seed.TABLES.URLS),
    seed.insertUrl({ urlShort: deletable.short, urlLong: deletable.long, hostname: deletable.host }),
];

before(() => {
    // Given: a single, undeleted URL that can be soft-deleted.
    for (let i = 0; i < seeds.length; i++) {
        cy.task("queryPGParams", seeds[i]);
    }
});

describe("DELETE /api/url/delete/[id]", () => {
    it("soft-deletes an existing URL", () => {
        // Given: an existing undeleted URL (seeded).
        cy.authHeaders().then((authHeaders) => {
            cy.task("queryPGParams", seed.idOfUrlShort(deletable.short)).then((rows) => {
                const id = rows[0].id;
                // When: deleting that URL.
                cy.request({ method: "DELETE", url: "/api/url/delete/" + id, headers: authHeaders }).then((response) => {
                    // Then: the request succeeds.
                    expect(response.status).to.eq(200);
                    expect(response.body).to.have.property("message", "success");
                });
                // Then: the row is soft-deleted and marked ADMIN-checked.
                cy.task("queryPGParams", seed.selectUrlById(id, ["deleted", "deletedAt", "checkedBy"])).then((res) => {
                    expect(res[0].deleted).to.eq(true);
                    expect(res[0].deletedAt).to.not.eq(null);
                    expect(res[0].checkedBy).to.eq("ADMIN");
                });
            });
        });
    });

    it("returns 404 for a non-existent id", () => {
        // Given: an id that does not exist.
        cy.authHeaders().then((authHeaders) => {
            // When: attempting to delete that id.
            cy.request({ method: "DELETE", url: "/api/url/delete/99999999", headers: authHeaders, failOnStatusCode: false }).then((response) => {
                // Then: it returns a clean 404.
                expect(response.status).to.eq(404);
                expect(response.body).to.have.property("message", "Not found.");
            });
        });
    });

    it("rejects non-DELETE with 405", () => {
        // Given: an authenticated client.
        cy.authHeaders().then((authHeaders) => {
            // When: using a disallowed method on the endpoint.
            cy.request({ method: "GET", url: "/api/url/delete/1", headers: authHeaders, failOnStatusCode: false }).then((response) => {
                // Then: the request is rejected with 405.
                expect(response.status).to.eq(405);
            });
        });
    });
});
