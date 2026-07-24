// Covers PUT /api/urlLong/new (public) end to end

const seed = require("../../support/seed");

const getHostname = (urlLong) => {
    const { hostname } = new URL(urlLong);
    return hostname;
};

const deletedUrlLong = "https://thisoneisdeleted.com/somepath.php";
const deletedUrlShort = "Dl1";
const deletedUrlShortFull = "https://localhost:3001/" + deletedUrlShort;
const deletedUrlQrCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAYAAABRRIOnAAAAAklEQVR4AewaftIAAAOhSURBVO3BMY5rRwADweZA979yewMHjAZ4kLS2v1kVfzDzt8NMOcyUw0w5zJTDTDnMlMNMOcyUw0w5zJTDTDnMlMNMOcyUw0x58aYk/CaVmyQ8odKScKPyRBJ+k8o7DjPlMFMOM+XFh6l8UhKeUGlJuEnCjUpLQlN5QuWTkvBJh5lymCmHmfLiy5LwhMoTSbhR+aYkNJUnkvCEyjcdZsphphxmyos/XBJuVFoSmsr/yWGmHGbKYaa8+MOo3CThRqUloam0JPxJDjPlMFMOM+XFl6n8piTcqLQk3Ki0JHySyr/JYaYcZsphprz4sCT8k1RaEp5QaUloKi0JTyTh3+wwUw4z5TBTXrxJ5d9M5UblHSo3Kv8lh5lymCmHmfLiTUloKi0Jn6TSVG6S0FRaEm5UWhJuVFoSPknlmw4z5TBTDjMl/uAXJaGpvCMJTeWJJDSVloSm0pLQVG6S0FSeSEJT+aTDTDnMlMNMiT/4oiTcqLQk/CaVJ5LwhMoTSWgqLQk3Ku84zJTDTDnMlBdvSsKNyk0SmspNEprKO5LQVG5UWhKeSMKNyo1KS8InHWbKYaYcZkr8wRuS8ITKE0l4h0pLwhMqTyThRqUloam0JDyh8o7DTDnMlMNMefFlKi0JTaUloam0JDSVloSWhKbSktBUWhKaSktCU7lJQlNpSWgqLQlN5ZMOM+UwUw4zJf7gDUloKi0JTeWJJDSVloSm8k1JaCo3SXiHSkvCjco7DjPlMFMOM+XFPywJTaWpfFMSmso7ktBUWhJuVG5UWhI+6TBTDjPlMFNe/LIkNJWWhE9KQlNpKi0JTaWptCTcJOEdSWgqTeWTDjPlMFMOMyX+4D8sCU2lJeEJlZaEJ1SeSMKNym86zJTDTDnMlBdvSsJvUmkqLQk3Ki0JNyo3SbhJQlO5UWlJeELlHYeZcpgph5ny4sNUPikJN0m4UblR+SaVJ5LQVH7TYaYcZsphprz4siQ8ofIOlZskPKHSknCThHeotCQ0lW86zJTDTDnMlBd/uCTcqLQkPKHSknCj0pLQknCThBuVdxxmymGmHGbKi/8ZlZaEmyQ0lZaEpvKESkvCjUpLwicdZsphphxmyosvU/kmlZaEpnKjcpOEloQnkvAOld90mCmHmXKYKS8+LAm/KQlN5YkkNJUblZskfFISftNhphxmymGmxB/M/O0wUw4z5TBTDjPlMFMOM+UwUw4z5TBTDjPlMFMOM+UwUw4z5TBT/gLQwaYLAJ6ouwAAAABJRU5ErkJggg==";
const deletedHostname = getHostname(deletedUrlLong);

// sha256(127.0.0.1)
const deletedIpAddressHash = "12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0";

const doesNotExistUrlShort = "aaaa";

// The API hashes the client IP (defaults to 127.0.0.1 with no x-real-ip); this
// is the same sha256("127.0.0.1") as `deletedIpAddressHash` above.
const bannedIpHash = deletedIpAddressHash;

const whitelistedHostname = "extra-whitelisted.example.com";

const deleteBannedIp = {
    text: 'DELETE FROM ' + seed.TABLES.IPADDRESSES + ' WHERE "ipAddressHash" = $1',
    values: [bannedIpHash],
};

// Seed database
const seeds = [
    seed.truncate(seed.TABLES.URLS),
    seed.truncate(seed.TABLES.HOSTNAMES),
    seed.truncate(seed.TABLES.IPADDRESSES),
    seed.insertHostname({ hostname: "thishostnameisblocked.com", blacklisted: true }),
    seed.insertHostname({ hostname: "thishostnameiswhitelisted.com", blacklisted: false }),
    seed.insertHostname({ hostname: whitelistedHostname, blacklisted: false }),
    seed.insertUrl({ urlLong: deletedUrlLong, urlQrCode: deletedUrlQrCode, urlShort: deletedUrlShort, urlShortFull: deletedUrlShortFull, hostname: deletedHostname, deleted: true, deletedAt: new Date(), ipAddressHash: deletedIpAddressHash }),
];

before(() => {
    // Given: a blocked hostname, a whitelisted hostname, and a pre-deleted URL.
    for (let i = 0; i < seeds.length; i++) {
        cy.task("queryPGParams", seeds[i]);
    }
});

const tests = [
    {
        testName: "Does not accept get requests",
        method: "GET",
        statusCode: 405,
        responseBodyProperties: [
            { name: "message", value: "Only PUT requests allowed." },
        ],
    },
    {
        testName: "Body is null",
        method: "PUT",
        statusCode: 400,
        responseBodyProperties: [
            { name: "message", value: "There is no long url given." },
        ],
    },
    {
        testName: "Body is no valid json",
        method: "PUT",
        body: "dasdasd",
        statusCode: 400,
        responseBodyProperties: [
            { name: "message", value: "There is no long url given." },
        ],
    },
    {
        testName: "urlLong is empty string",
        method: "PUT",
        body: { urlLong: "" },
        statusCode: 400,
        responseBodyProperties: [
            { name: "message", value: "There is no long url given." },
        ],
    },
    {
        testName: "urlLong is not a valid URL",
        method: "PUT",
        body: { urlLong: "x.yz" }, // protocol is missing -> http://
        statusCode: 400,
        responseBodyProperties: [
            { name: "message", value: "This is no valid URL." },
        ],
    },
    {
        testName: "urlLong is not a valid hostname",
        method: "PUT",
        body: { urlLong: "http://x.yz" }, // .yz is not a valid TLD
        statusCode: 400,
        responseBodyProperties: [
            { name: "message", value: "This is no valid hostname." },
        ],
    },
    {
        testName: "urlLong shall not be 2a5 itself",
        method: "PUT",
        body: { urlLong: "http://2a5.de" },
        statusCode: 400,
        responseBodyProperties: [
            {
                name: "message",
                value: "Recursive short linking is not allowed.",
            },
        ],
    },
    {
        testName: "urlLong shall not be 2a5 itself",
        method: "PUT",
        body: { urlLong: "http://www.2a5.de" },
        statusCode: 400,
        responseBodyProperties: [
            {
                name: "message",
                value: "Recursive short linking is not allowed.",
            },
        ],
    },
    {
        testName: "hostname is blacklisted and therefore urlLong rejected",
        method: "PUT",
        body: { urlLong: "http://thishostnameisblocked.com" },
        statusCode: 400,
        responseBodyProperties: [
            {
                name: "message",
                value: "This hostname is not allowed.",
            },
        ],
    },
    {
        testName: "subdomain of hostname is not blacklisted and therefore urlLong accepted",
        method: "PUT",
        body: { urlLong: "http://subdomain.thishostnameisblocked.com" },
        statusCode: 201,
        responseBodyProperties: [
            { name: "urlLong", value: "http://subdomain.thishostnameisblocked.com" },
            { name: "urlQrCode" },
            { name: "urlShort" },
            { name: "urlShortFull" },
        ],
    },
    {
        testName: "hostname is whitelisted and therefore urlLong is checked right away",
        method: "PUT",
        body: { urlLong: "http://thishostnameiswhitelisted.com" },
        statusCode: 201,
        responseBodyProperties: [
            { name: "urlLong", value: "http://thishostnameiswhitelisted.com" },
            { name: "urlQrCode" },
            { name: "urlShort" },
            { name: "urlShortFull" },
        ],
        dbProperties: [
            { name: "checkedBy", value: "WHITELIST" }
        ]
    },
    {
        testName: "success",
        method: "PUT",
        body: { urlLong: "https://this.is/my?super=ugly#link" },
        statusCode: 201,
        responseBodyProperties: [
            { name: "urlLong", value: "https://this.is/my?super=ugly#link" },
            { name: "urlQrCode" },
            { name: "urlShort" },
            { name: "urlShortFull" },
        ],
        saveResponseBody: true,
    },
];

let responseBody;

for (let i = 0; i < tests.length; i++) {
    it(tests[i]["testName"], () => {
        // Given: the seeded hostnames + deleted URL (see `before`) and this
        // test case's request definition.
        // When: sending the request to the creation endpoint.
        cy.request({
            method: tests[i]["method"],
            url: "/api/urlLong/new",
            failOnStatusCode: false,
            body: tests[i]["body"] ? tests[i]["body"] : null,
        }).then((response) => {
            // Then: the status and body match the expectations for this case.
            expect(response.status).to.eq(tests[i]["statusCode"]);

            tests[i]["responseBodyProperties"].forEach((prop) => {
                if (prop.value) {
                    // response.body is automatically serialized into JSON
                    expect(response.body).to.have.property(
                        prop.name,
                        prop.value
                    );
                } else {
                    expect(response.body).to.have.property(prop.name);
                }
            });

            if (tests[i]["saveResponseBody"]) {
                // cy.task("log", response.body);

                responseBody = response.body;
            }

            if (tests[i]["dbProperties"]) {
                // Then (DB): the persisted row carries the expected column value.
                tests[i]["dbProperties"].forEach((prop) => {
                    cy.task("queryPGParams", {
                        text: 'SELECT "' + prop.name + '" FROM ' + seed.TABLES.URLS + ' WHERE "urlShort" = $1',
                        values: [response.body.urlShort],
                    }).then((res) => {
                        expect(res[0].checkedBy).to.eq(prop.value);
                    });
                });
            }

        });
    });
}

it("does not insert twice", () => {
    // Given: a urlLong that was already created by the "success" case above.
    // When: creating the same urlLong again.
    cy.request({
        method: "PUT",
        url: "/api/urlLong/new",
        failOnStatusCode: false,
        body: { urlLong: responseBody.urlLong },
    }).then((response) => {
        // Then: it returns 409 with the existing entry (no duplicate created).
        expect(response.status).to.eq(409);
        expect(response.body).to.deep.eq(responseBody);
    });
});

it("short url is available", () => {
    // Given: the short link created by the "success" case above.
    // When: resolving that short link.
    cy.request({
        method: "GET",
        url: "/api/urlShort/" + responseBody.urlShort,
    }).then((response) => {
        // Then: it resolves back to the original long url.
        expect(response.status).to.eq(200);
        expect(response.body).to.deep.eq({ urlLong: responseBody.urlLong });
    });
});

it("deleted URLs return 410 gone", () => {
    // Given: a pre-seeded deleted short link.
    // When: resolving that short link.
    cy.request({
        method: "GET",
        url: "/api/urlShort/" + deletedUrlShort,
        failOnStatusCode: false,
    }).then((response) => {
        // Then: it returns 410 Gone.
        expect(response.status).to.eq(410);
    });
});

it("impossible urlShort", () => {
    // Given: a short code containing characters outside the allowed format.
    // When: resolving that short link.
    cy.request({
        method: "GET",
        url: "/api/urlShort/äöüö",
        failOnStatusCode: false,
    }).then((response) => {
        // Then: it returns 400.
        expect(response.status).to.eq(400);
        // cy.task("log", response);
    });
});

// there is a slight chance that this test fails because aaaaa exists because it was generated in a previous test. But its pretty pretty rare
it("does not exist 404", () => {
    // Given: a well-formed short code that was never created.
    // When: resolving that short link.
    cy.request({
        method: "GET",
        url: "/api/urlShort/" + doesNotExistUrlShort,
        failOnStatusCode: false,
    }).then((response) => {
        // Then: it returns 404 Not Found.
        expect(response.status).to.eq(404);
        // cy.task("log", response);
    });
});

describe("PUT /api/urlLong/new - IP ban", () => {
    before(() => {
        // Given: the local IP is banned (until defaults to NOW() + 1 day, so
        // this ban is currently active).
        cy.task("queryPGParams", seed.insertIp({ ipAddressHash: bannedIpHash, blacklisted: true }));
    });

    after(() => {
        // Cleanup: undo the ban so the other describe blocks can create URLs.
        cy.task("queryPGParams", deleteBannedIp);
    });

    it("rejects creation from a blacklisted IP", () => {
        // Given: an active ban on the calling IP (seeded above).
        // When: attempting to create a URL.
        cy.request({
            method: "PUT",
            url: "/api/urlLong/new",
            failOnStatusCode: false,
            body: { urlLong: "https://ip-banned-test.example.com/x" },
        }).then((response) => {
            // Then: creation is rejected because the IP is not allowed.
            expect(response.status).to.eq(400);
            expect(response.body).to.have.property("message", "This IP is not allowed.");
        });
    });

    it("allows creation when the IP ban has expired", () => {
        // Given: an IP ban whose `until` is in the past (already expired).
        cy.task("queryPGParams", deleteBannedIp);
        cy.task("queryPGParams", seed.insertIp({ ipAddressHash: bannedIpHash, blacklisted: true, until: new Date(Date.now() - 24 * 60 * 60 * 1000) }));
        // When: attempting to create a URL.
        cy.request({
            method: "PUT",
            url: "/api/urlLong/new",
            failOnStatusCode: false,
            body: { urlLong: "https://ip-expired-test.example.com/x" },
        }).then((response) => {
            // Then: creation succeeds because the ban is no longer active.
            expect(response.status).to.eq(201);
        });
    });
});

describe("PUT /api/urlLong/new - checked timestamps", () => {
    it("sets checkedAt (not just checkedBy) when the hostname is whitelisted", () => {
        // Given: a whitelisted hostname (seeded in the top-level `before`).
        // When: creating a URL on that hostname.
        cy.request({
            method: "PUT",
            url: "/api/urlLong/new",
            body: { urlLong: "https://" + whitelistedHostname + "/page" },
        }).then((response) => {
            // Then: the row is stored WHITELIST-checked with a checkedAt timestamp.
            expect(response.status).to.eq(201);
            cy.task("queryPGParams", {
                text: 'SELECT "checkedBy","checkedAt" FROM ' + seed.TABLES.URLS + ' WHERE "urlShort" = $1',
                values: [response.body.urlShort],
            }).then((res) => {
                expect(res[0].checkedBy).to.eq("WHITELIST");
                expect(res[0].checkedAt).to.not.eq(null);
            });
        });
    });

    it("stores an unlisted hostname's URL as unchecked (checkedBy null, checkedAt null)", () => {
        // Given: a hostname that is not present in the Hostnames table.
        // When: creating a URL on that unlisted hostname.
        cy.request({
            method: "PUT",
            url: "/api/urlLong/new",
            body: { urlLong: "https://unlisted-host.example.org/page" },
        }).then((response) => {
            // Then: it is stored unchecked, awaiting moderation.
            expect(response.status).to.eq(201);
            cy.task("queryPGParams", {
                text: 'SELECT "checkedBy","checkedAt" FROM ' + seed.TABLES.URLS + ' WHERE "urlShort" = $1',
                values: [response.body.urlShort],
            }).then((res) => {
                expect(res[0].checkedBy).to.eq(null);
                expect(res[0].checkedAt).to.eq(null);
            });
        });
    });
});
