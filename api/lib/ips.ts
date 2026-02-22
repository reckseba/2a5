import { prisma } from "./prisma";

export async function getIp(ipAddressHash: string) {
    return await prisma.ipaddresses.findUnique({
        where: {
            ipAddressHash: ipAddressHash,
        },
    });
}
