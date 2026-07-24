// In-process unit tests for lib/urls.ts createUrl().
//
// These cover the two error branches that cannot be exercised through the
// live-server Cypress suite (cypress/e2e/api/newUrlLong.cy.js), because they
// require QRCode / Prisma to fail:
//   - "Could not generate QR Code." (QRCode.toDataURL throws)
//   - "Could not insert into db."   (prisma.urls.create throws)
// plus the happy paths for the unchecked and whitelisted (checked) flows.
//
// QRCode, Prisma and the random short-code generator are mocked so the tests
// run fully in-process with no DB or dev server.

import { beforeEach, describe, expect, it, vi } from "vitest";

// --- mocks -----------------------------------------------------------------

const toDataURL = vi.fn();
vi.mock("qrcode", () => ({
    default: {
        toDataURL: (...args: unknown[]) => toDataURL(...args),
    },
}));

const create = vi.fn();
// Mock the prisma module so importing urls.ts never instantiates the real
// PG adapter / touches a database.
vi.mock("./prisma", () => ({
    prisma: {
        urls: {
            create: (...args: unknown[]) => create(...args),
        },
    },
}));

// Deterministic short code so we can assert urlShortFull composition.
vi.mock("./misc", () => ({
    generateRandomStringOfLength: () => "abc",
}));

import { createUrl } from "./urls";

const QR = "data:image/png;base64,AAAA";

const args = {
    urlLong: "https://example.com/some/path",
    hostname: "example.com",
    linkProtocol: "https",
    linkHostname: "localhost",
    ipAddressHash: "hash",
};

beforeEach(() => {
    toDataURL.mockReset();
    create.mockReset();
});

describe("createUrl - error branches", () => {
    it("throws 'Could not generate QR Code.' when QR generation fails", async () => {
        // Given: QRCode.toDataURL throws (generateQRCode swallows it -> undefined).
        toDataURL.mockRejectedValue(new Error("qr boom"));

        // When / Then: createUrl surfaces the QR error and never inserts.
        await expect(
            createUrl(args.urlLong, args.hostname, args.linkProtocol, args.linkHostname, null, args.ipAddressHash)
        ).rejects.toThrow("Could not generate QR Code.");
        expect(create).not.toHaveBeenCalled();
    });

    it("throws 'Could not insert into db.' on the unchecked path when the insert fails", async () => {
        // Given: QR ok, but prisma.urls.create throws (helper returns undefined).
        toDataURL.mockResolvedValue(QR);
        create.mockRejectedValue(new Error("db boom"));

        // When / Then (unchecked path: no checkedBy/checkedAt passed).
        await expect(
            createUrl(args.urlLong, args.hostname, args.linkProtocol, args.linkHostname, null, args.ipAddressHash)
        ).rejects.toThrow("Could not insert into db.");
    });

    it("throws 'Could not insert into db.' on the checked path when the insert fails", async () => {
        // Given: QR ok, but prisma.urls.create throws.
        toDataURL.mockResolvedValue(QR);
        create.mockRejectedValue(new Error("db boom"));

        // When / Then (checked path: checkedBy + checkedAt passed).
        await expect(
            createUrl(
                args.urlLong,
                args.hostname,
                args.linkProtocol,
                args.linkHostname,
                null,
                args.ipAddressHash,
                "WHITELIST",
                new Date()
            )
        ).rejects.toThrow("Could not insert into db.");
    });
});

describe("createUrl - happy paths", () => {
    it("inserts an unchecked URL and composes urlShortFull without a port", async () => {
        // Given: QR ok and a successful insert that echoes the created row.
        toDataURL.mockResolvedValue(QR);
        create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
            urlLong: data.urlLong,
            urlQrCode: data.urlQrCode,
            urlShort: data.urlShort,
            urlShortFull: data.urlShortFull,
        }));

        // When: creating a URL with no checkedBy/checkedAt (unchecked flow).
        const result = await createUrl(
            args.urlLong,
            args.hostname,
            args.linkProtocol,
            args.linkHostname,
            null,
            args.ipAddressHash
        );

        // Then: the row is returned with a port-less urlShortFull...
        expect(result).toEqual({
            urlLong: args.urlLong,
            urlQrCode: QR,
            urlShort: "abc",
            urlShortFull: "https://localhost/abc",
        });
        // ...and the persisted data carries no check metadata.
        const persisted = create.mock.calls[0][0].data;
        expect(persisted.checkedBy).toBeUndefined();
        expect(persisted.checkedAt).toBeUndefined();
    });

    it("inserts a checked URL (WHITELIST) and includes the port in urlShortFull", async () => {
        // Given: QR ok and a successful insert.
        toDataURL.mockResolvedValue(QR);
        create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
            urlLong: data.urlLong,
            urlQrCode: data.urlQrCode,
            urlShort: data.urlShort,
            urlShortFull: data.urlShortFull,
        }));

        const checkedAt = new Date();

        // When: creating a URL with checkedBy/checkedAt and a port (checked flow).
        const result = await createUrl(
            args.urlLong,
            args.hostname,
            args.linkProtocol,
            args.linkHostname,
            3001,
            args.ipAddressHash,
            "WHITELIST",
            checkedAt
        );

        // Then: urlShortFull includes the port...
        expect(result.urlShortFull).toBe("https://localhost:3001/abc");
        // ...and the check metadata is persisted.
        const persisted = create.mock.calls[0][0].data;
        expect(persisted.checkedBy).toBe("WHITELIST");
        expect(persisted.checkedAt).toBe(checkedAt);
    });
});
