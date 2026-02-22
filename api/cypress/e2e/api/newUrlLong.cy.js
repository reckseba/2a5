const getHostname = (urlLong) => {
    const { hostname } = new URL(urlLong);
    return hostname;
};

const deletedUrlLong = "https://thisoneisdeleted.com/somepath.php";
const deletedUrlShort = "Dl1";
const deletedUrlShortFull = "https://localhost:3001/" + deletedUrlShort;
const deletedUrlQrCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAYAAABRRIOnAAAAAklEQVR4AewaftIAAAOhSURBVO3BMY5rRwADweZA979yewMHjAZ4kLS2v1kVfzDzt8NMOcyUw0w5zJTDTDnMlMNMOcyUw0w5zJTDTDnMlMNMOcyUw0x58aYk/CaVmyQ8odKScKPyRBJ+k8o7DjPlMFMOM+XFh6l8UhKeUGlJuEnCjUpLQlN5QuWTkvBJh5lymCmHmfLiy5LwhMoTSbhR+aYkNJUnkvCEyjcdZsphphxmyos/XBJuVFoSmsr/yWGmHGbKYaa8+MOo3CThRqUloam0JPxJDjPlMFMOM+XFl6n8piTcqLQk3Ki0JHySyr/JYaYcZsphprz4sCT8k1RaEp5QaUloKi0JTyTh3+wwUw4z5TBTXrxJ5d9M5UblHSo3Kv8lh5lymCmHmfLiTUloKi0Jn6TSVG6S0FRaEm5UWhJuVFoSPknlmw4z5TBTDjMl/uAXJaGpvCMJTeWJJDSVloSm0pLQVG6S0FSeSEJT+aTDTDnMlMNMiT/4oiTcqLQk/CaVJ5LwhMoTSWgqLQk3Ku84zJTDTDnMlBdvSsKNyk0SmspNEprKO5LQVG5UWhKeSMKNyo1KS8InHWbKYaYcZkr8wRuS8ITKE0l4h0pLwhMqTyThRqUloam0JDyh8o7DTDnMlMNMefFlKi0JTaUloam0JDSVloSWhKbSktBUWhKaSktCU7lJQlNpSWgqLQlN5ZMOM+UwUw4zJf7gDUloKi0JTeWJJDSVloSm8k1JaCo3SXiHSkvCjco7DjPlMFMOM+XFPywJTaWpfFMSmso7ktBUWhJuVG5UWhI+6TBTDjPlMFNe/LIkNJWWhE9KQlNpKi0JTaWptCTcJOEdSWgqTeWTDjPlMFMOMyX+4D8sCU2lJeEJlZaEJ1SeSMKNym86zJTDTDnMlBdvSsJvUmkqLQk3Ki0JNyo3SbhJQlO5UWlJeELlHYeZcpgph5ny4sNUPikJN0m4UblR+SaVJ5LQVH7TYaYcZsphprz4siQ8ofIOlZskPKHSknCThHeotCQ0lW86zJTDTDnMlBd/uCTcqLQkPKHSknCj0pLQknCThBuVdxxmymGmHGbKi/8ZlZaEmyQ0lZaEpvKESkvCjUpLwicdZsphphxmyosvU/kmlZaEpnKjcpOEloQnkvAOld90mCmHmXKYKS8+LAm/KQlN5YkkNJUblZskfFISftNhphxmymGmxB/M/O0wUw4z5TBTDjPlMFMOM+UwUw4z5TBTDjPlMFMOM+UwUw4z5TBT/gLQwaYLAJ6ouwAAAABJRU5ErkJggg==";
const deletedHostname = getHostname(deletedUrlLong);
const deletedIpAddressHash = "12ca17b49af2289436f303e0166030a21e525d266e209267433801a8fd4071a0"; // sha256(127.0.0.1)

const doesNotExistUrlShort = "aaaa";

// Seed database
const queries = [
    "TRUNCATE TABLE public.\"Urls\"",
    "TRUNCATE TABLE public.\"Hostnames\"",
    "INSERT INTO public.\"Hostnames\" (\"hostname\",\"blacklisted\") VALUES ('thishostnameisblocked.com',true)",
    "INSERT INTO public.\"Hostnames\" (\"hostname\",\"blacklisted\") VALUES ('thishostnameiswhitelisted.com',false)",
    "INSERT INTO public.\"Urls\" (\"urlLong\",\"urlQrCode\",\"urlShort\",\"urlShortFull\",\"hostname\",\"deleted\",\"deletedAt\",\"ipAddressHash\") VALUES ('" + deletedUrlLong + "','" + deletedUrlQrCode + "','" + deletedUrlShort + "','" + deletedUrlShortFull + "','" + deletedHostname + "',true,NOW(),'" + deletedIpAddressHash +"')"
];

before(() => {
    for (let i = 0; i < queries.length; i++) {
        cy.task("queryPG", queries[i]).then((res) => {
            // cy.task("log", res);
        });
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
    //
    // for this test to work you'd need to uncomment in lib/urls.ts generateQRCode()
    //   {
    //     testName: "qr code buf",
    //     method: "PUT",
    //     body: { urlLong: "http://www.2a5dadsadadasdadasdadadad.de" },
    //     statusCode: 400,
    //     responseBodyProperties: [
    //       { name: "message", value: "Could not generate QR Code." },
    //     ],
    //   },
    //
    // for this test to work you'd need to comment out in lib/urls.ts insertNewUrl(): for example do not pass urlShort as it is required
    //   {
    //     testName: "cannot insert into db",
    //     method: "PUT",
    //     body: { urlLong: "http://www.2a5dadsadadasdadasdadadad.de" },
    //     statusCode: 400,
    //     responseBodyProperties: [
    //       { name: "message", value: "Could not insert into db." },
    //     ],
    //   },
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
        cy.request({
            method: tests[i]["method"],
            url: "/api/urlLong/new",
            failOnStatusCode: false,
            body: tests[i]["body"] ? tests[i]["body"] : null,
        }).then((response) => {
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
                tests[i]["dbProperties"].forEach((prop) => {
                    cy.task("queryPG", "SELECT \"" + prop.name + "\" FROM public.\"Urls\" WHERE \"urlShort\"='" + response.body.urlShort + "'").then((res) => {
                        expect(res[0].checkedBy).to.eq(prop.value);
                    });
                });
            }

        });
    });
}

it("does not insert twice", () => {
    cy.request({
        method: "PUT",
        url: "/api/urlLong/new",
        failOnStatusCode: false,
        body: { urlLong: responseBody.urlLong },
    }).then((response) => {
        expect(response.status).to.eq(409);
        expect(response.body).to.deep.eq(responseBody);
    });
});

it("short url is available", () => {
    cy.request({
        method: "GET",
        url: "/api/urlShort/" + responseBody.urlShort,
    }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.deep.eq({ urlLong: responseBody.urlLong});
    });
});

it("deleted URLs return 410 gone", () => {
    cy.request({
        method: "GET",
        url: "/api/urlShort/" + deletedUrlShort,
        failOnStatusCode: false,
    }).then((response) => {
        expect(response.status).to.eq(410);
    });
});

it("impossible urlShort", () => {
    cy.request({
        method: "GET",
        url: "/api/urlShort/äöüö",
        failOnStatusCode: false,
    }).then((response) => {
        expect(response.status).to.eq(400);
        // cy.task("log", response);
    });
});

// there is a slight chance that this test fails because aaaaa exists because it was generated in a previous test. But its pretty pretty rare
it("does not exist 404", () => {
    cy.request({
        method: "GET",
        url: "/api/urlShort/" + doesNotExistUrlShort,
        failOnStatusCode: false,
    }).then((response) => {
        expect(response.status).to.eq(404);
        // cy.task("log", response);
    });
});
