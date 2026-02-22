import { prisma } from "./prisma";

export async function getHostnameByHostname(hostname: string) {
    return await prisma.hostnames.findUnique({
        where: {
            hostname: hostname,
        },
    });
}

export async function getHostnamesBlacklisted() {
    return await prisma.hostnames.findMany({
        where: {
            blacklisted: true
        },
        select: {
            id: true,
            hostname: true
        },
    });
}

export async function getHostnamesWhitelisted() {
    return await prisma.hostnames.findMany({
        where: {
            blacklisted: false
        },
        select: {
            id: true,
            hostname: true
        },
    });
}

export async function getHostnameBlacklistedByHostname(hostname: string) {
    return await prisma.hostnames.findUnique({
        where: {
            hostname: hostname,
            blacklisted: true
        },
        select: {
            id: true,
            blacklisted: true
        }
    });
}

export async function getHostnameWhitelistedByHostname(hostname: string) {
    return await prisma.hostnames.findUnique({
        where: {
            hostname: hostname,
            blacklisted: false
        },
        select: {
            id: true,
            blacklisted: true
        }
    });
}

export async function createHostnameWhitelisted(hostname: string) {
    await prisma.hostnames.create({
        data: {
            hostname: hostname,
            blacklisted: false
        }
    });
}

export async function createHostnameBlacklisted(hostname: string) {
    await prisma.hostnames.create({
        data: {
            hostname: hostname,
            blacklisted: true
        }
    });
}
