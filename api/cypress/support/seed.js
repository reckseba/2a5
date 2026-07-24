// Shared, schema-aligned seed helpers for the e2e API tests.
//
// Fully-qualified, quoted table identifiers (Postgres schema + PascalCase names).
const TABLES = {
    URLS: 'appschema."Urls"',
    HOSTNAMES: 'appschema."Hostnames"',
    IPADDRESSES: 'appschema."Ipaddresses"',
};

// A tiny placeholder QR code payload; the value itself is irrelevant to the
// assertions but the column is NOT NULL, so seeds must provide something.
const DEFAULT_QR_CODE = "data:image/png;base64,AAAA";

// Returns a TRUNCATE statement for a table, wrapped as { text, values }.
const truncate = (table) => ({ text: 'TRUNCATE TABLE ' + table, values: [] });

// Builds an INSERT for appschema."Urls".
//
// `row` supports: urlShort (required), urlLong (required), hostname (required),
// and optional urlQrCode, urlShortFull, deleted, deletedAt, checkedBy,
// checkedAt, createdAt, ipAddressHash. Any column left undefined falls back to
// the DB default (we simply omit it from the INSERT), so callers only specify
// what a given test actually cares about.
const insertUrl = (row) => {
    // Column name -> value, in one place. Aligned with schema.prisma model Urls.
    const columns = {
        urlLong: row.urlLong,
        urlQrCode: row.urlQrCode !== undefined ? row.urlQrCode : DEFAULT_QR_CODE,
        urlShort: row.urlShort,
        urlShortFull:
            row.urlShortFull !== undefined
                ? row.urlShortFull
                : "https://localhost:3001/" + row.urlShort,
        hostname: row.hostname,
        deleted: row.deleted,
        deletedAt: row.deletedAt,
        checkedBy: row.checkedBy,
        checkedAt: row.checkedAt,
        createdAt: row.createdAt,
        ipAddressHash: row.ipAddressHash,
    };

    return buildInsert(TABLES.URLS, columns);
};

// Builds an INSERT for appschema."Hostnames".
const insertHostname = (row) =>
    buildInsert(TABLES.HOSTNAMES, {
        hostname: row.hostname,
        blacklisted: row.blacklisted,
    });

// Builds an INSERT for appschema."Ipaddresses".
const insertIp = (row) =>
    buildInsert(TABLES.IPADDRESSES, {
        ipAddressHash: row.ipAddressHash,
        blacklisted: row.blacklisted,
        until: row.until,
    });

// Selects the id of a URL by its urlShort. Returns { text, values }.
const idOfUrlShort = (urlShort) => ({
    text: 'SELECT "id" FROM ' + TABLES.URLS + ' WHERE "urlShort" = $1',
    values: [urlShort],
});

// Selects arbitrary columns of a URL row by id. `columns` is an array of
// column names (validated against a safe allow-list to avoid identifier
// injection, since column names cannot be parameterized).
const selectUrlById = (id, columns) => ({
    text:
        "SELECT " +
        columns.map(quoteIdentifier).join(", ") +
        " FROM " +
        TABLES.URLS +
        ' WHERE "id" = $1',
    values: [id],
});

// --- internals -------------------------------------------------------------

// Column names that seeds/selects are allowed to reference. Kept in sync with
// schema.prisma so a typo or a renamed column fails loudly here.
const ALLOWED_COLUMNS = new Set([
    "id",
    "urlLong",
    "urlQrCode",
    "urlShort",
    "urlShortFull",
    "hostname",
    "createdAt",
    "deleted",
    "deletedAt",
    "checkedBy",
    "checkedAt",
    "ipAddressHash",
    "blacklisted",
    "until",
    "created_at",
]);

const quoteIdentifier = (name) => {
    if (!ALLOWED_COLUMNS.has(name)) {
        throw new Error("Unknown column referenced in seed helper: " + name);
    }
    return '"' + name + '"';
};

// Turns a { column: value } map into a parameterized INSERT, skipping any
// column whose value is undefined (so the DB default applies).
const buildInsert = (table, columns) => {
    const names = [];
    const placeholders = [];
    const values = [];

    Object.keys(columns).forEach((name) => {
        const value = columns[name];
        if (value === undefined) {
            return;
        }
        names.push(quoteIdentifier(name));
        values.push(value);
        placeholders.push("$" + values.length);
    });

    const text =
        "INSERT INTO " +
        table +
        " (" +
        names.join(", ") +
        ") VALUES (" +
        placeholders.join(", ") +
        ")";

    return { text, values };
};

module.exports = {
    TABLES,
    DEFAULT_QR_CODE,
    truncate,
    insertUrl,
    insertHostname,
    insertIp,
    idOfUrlShort,
    selectUrlById,
};
