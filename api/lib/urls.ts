import { CheckType } from "../generated/prisma/client";
import QRCode from "qrcode";
import { generateRandomStringOfLength } from "./misc";

import { prisma } from "./prisma";


async function generateQRCode(urlShortFull: string) {
    try {
        // if you want to test the catch part, then simply:
        // import { Buffer } from "node:buffer";
        // const buf4 = Buffer.from([1, 2, 3]);
        // return await QRCode.toDataURL(buf4);

        return await QRCode.toDataURL(urlShortFull);
    } catch (e) {
        console.error(e);
    }
}

async function insertUrlUnChecked(
    urlLong: string,
    urlQrCode: string,
    urlShort: string,
    urlShortFull: string,
    hostname: string,
    ipAddressHash: string
) {
    try {

        return await prisma.urls.create({
            data: {
                urlLong: urlLong,
                urlQrCode: urlQrCode,
                urlShort: urlShort,
                urlShortFull: urlShortFull,
                hostname: hostname,
                ipAddressHash: ipAddressHash
            },
            select: {
                urlLong: true,
                urlQrCode: true,
                urlShort: true,
                urlShortFull: true,
            }
        });
    } catch (e) {
        console.error(e);
    }
}

async function insertUrlChecked(
    urlLong: string,
    urlQrCode: string,
    urlShort: string,
    urlShortFull: string,
    hostname: string,
    ipAddressHash: string,
    checkedBy: CheckType,
    checkedAt: Date
) {
    try {

        return await prisma.urls.create({
            data: {
                urlLong: urlLong,
                urlQrCode: urlQrCode,
                urlShort: urlShort,
                urlShortFull: urlShortFull,
                hostname: hostname,
                ipAddressHash: ipAddressHash,
                checkedBy: checkedBy,
                checkedAt: checkedAt
            },
            select: {
                urlLong: true,
                urlQrCode: true,
                urlShort: true,
                urlShortFull: true,
            }
        });
    } catch (e) {
        console.error(e);
    }
}

export async function createUrl(urlLong: string, hostname: string, linkProtocol: string, linkHostname: string, linkPort: number | null, ipAddressHash: string, checkedBy?: CheckType, checkedAt?: Date) {
    const urlShort = generateRandomStringOfLength(3, 5);

    const urlShortFull = linkProtocol + "://" + linkHostname + (linkPort === null ? "" : (":" + linkPort)) + "/" + urlShort;
    const urlQrCode = await generateQRCode(urlShortFull);

    if (urlQrCode === undefined) {
        throw new Error("Could not generate QR Code.");
    }

    if (typeof checkedBy !== undefined && typeof checkedAt !== undefined) {
        const newUrl = await insertUrlChecked(
            urlLong,
            urlQrCode,
            urlShort,
            urlShortFull,
            hostname,
            ipAddressHash,
            checkedBy as CheckType,
            checkedAt as Date
        );

        if (newUrl === undefined) {
            throw new Error("Could not insert into db.");
        }

        return newUrl;

    }

    const newUrl = await insertUrlUnChecked(
        urlLong,
        urlQrCode,
        urlShort,
        urlShortFull,
        hostname,
        ipAddressHash
    );

    if (newUrl === undefined) {
        throw new Error("Could not insert into db.");
    }

    return newUrl;
}

export async function getUrlById(id: number) {
    return await prisma.urls.findUnique({
        where: {
            id: id
        },
        select: {
            hostname: true
        }
    });
}

export async function setUrlCheckedByAdminById(id: number) {
    await prisma.urls.update({
        where: {
            id: id
        },
        data: {
            deleted: false,
            deletedAt: null,
            checkedBy: "ADMIN",
            checkedAt: new Date()
        }
    });
}

export async function getByUrlLong(urlLong: string) {
    return await prisma.urls.findUnique({
        where: {
            urlLong: urlLong,
        },
        select: {
            urlLong: true,
            urlQrCode: true,
            urlShort: true,
            urlShortFull: true,
        },
    });
}

export async function getByUrlShort(urlShort: string) {
    return await prisma.urls.findUnique({
        where: {
            urlShort: urlShort,
        },
    });
}

export async function getUrlsUndeletedUnchecked() {
    return await prisma.urls.findMany({
        where: {
            deleted: false,
            checkedBy: null
        },
        select: {
            id: true,
            urlLong: true,
            urlShort: true,
            urlShortFull: true,
            checkedAt: true,
            checkedBy: true,
            deleted: true,
            deletedAt: true,
            hostname: true,
            ipAddressHash: true,
            createdAt: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });
}

export async function getUrlsUndeletedChecked() {
    return await prisma.urls.findMany({
        where: {
            deleted: false,
            NOT: {
                checkedBy: null
            }
        },
        select: {
            id: true,
            urlLong: true,
            urlShort: true,
            urlShortFull: true,
            checkedAt: true,
            checkedBy: true,
            deleted: true,
            deletedAt: true,
            hostname: true,
            ipAddressHash: true,
            createdAt: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });
}

export async function getUrlsDeletedChecked() {
    return await prisma.urls.findMany({
        where: {
            deleted: true,
            NOT: {
                checkedBy: null
            }
        },
        select: {
            id: true,
            urlLong: true,
            urlShort: true,
            urlShortFull: true,
            checkedAt: true,
            checkedBy: true,
            deleted: true,
            deletedAt: true,
            hostname: true,
            ipAddressHash: true,
            createdAt: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });
}

export async function deleteUrl(id: number) {
    // TODO: better to use NOW() function instead of injecting date. could be wrong according to timezone
    return await prisma.urls.update({
        where: {
            id: id
        },
        data: {
            deleted: true,
            deletedAt: new Date(),
            checkedBy: "ADMIN",
            checkedAt: new Date()
        }
    });
}

export async function getUrlsDeletedByHostname(hostname: string) {
    return await prisma.urls.findMany({
        where: {
            hostname: hostname,
            deleted: true,
            NOT: {
                checkedBy: null
            }
        },
        select: {
            id: true
        }
    });
}

export async function getUrlsCheckedByHostname(hostname: string) {
    return await prisma.urls.findMany({
        where: {
            hostname: hostname,
            deleted: false,
            NOT: {
                checkedBy: null
            }
        },
        select: {
            id: true
        }
    });
}


export async function setUrlsWhitelistedByHostname(hostname: string) {

    return await prisma.urls.updateMany({
        where: {
            hostname: hostname,
            checkedBy: null
        },
        data: {
            checkedAt: new Date(),
            checkedBy: "WHITELIST"
        }
    });
}

export async function setUrlsBlacklistedByHostname(hostname: string) {

    return await prisma.urls.updateMany({
        where: {
            hostname: hostname,
            checkedBy: null
        },
        data: {
            deleted: true,
            deletedAt: new Date(),
            checkedBy: "BLACKLIST",
            checkedAt: new Date()
        }
    });
}
