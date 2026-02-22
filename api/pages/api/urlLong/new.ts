import { CheckType } from "../../../generated/prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "tldts";
import { IncomingHttpHeaders } from "http";
import { hashSha256 } from "../../../lib/crypto";
import { getHostnameByHostname } from "../../../lib/hostnames";
import { getIp } from "../../../lib/ips";
import { getHostnameFromUrlLong } from "../../../lib/misc";
import { createUrl, getByUrlLong } from "../../../lib/urls";

type ErrorType = {
    message: string;
};

type SuccessType = {
    urlLong: string;
    urlQrCode: string;
    urlShort: string;
    urlShortFull: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ErrorType | SuccessType>
) {

    if (req.method !== "PUT") {
        res.status(405).json({ message: "Only PUT requests allowed." });
        return;
    }

    // check if there is any input
    if (!req.body.hasOwnProperty("urlLong") || req.body.urlLong.length === 0) {
        res.status(400).json({
            message: "There is no long url given.",
        });
        return;
    }

    const hostname = getHostnameFromUrlLong(req.body.urlLong);

    // if this is no valid url it will throw exception
    if (hostname === undefined) {
        res.status(400).json({
            message: "This is no valid URL.",
        });
        return;
    }

    const hostnameParsed = parse(hostname!);
    // now check if its a valid top level domain
    if (!hostnameParsed.isIcann) {
        res.status(400).json({
            message: "This is no valid hostname.",
        });
        return;
    }

    // prevent recursive behavior
    if (["2a5.de", "www.2a5.de"].includes(hostname!)) {
        res.status(400).json({
            message: "Recursive short linking is not allowed.",
        });
        return;
    }

    // get hostname information. Might be black- or whitelisted
    const hostnameListResult = await getHostnameByHostname(hostname);

    // in case of a  blacklisted hostname -> return right away
    if (hostnameListResult?.blacklisted === true) {
        // hostname is on blacklist
        res.status(400).json({
            message: "This hostname is not allowed.",
        });
        return;

    }

    const getClientIpAddress = (headers: IncomingHttpHeaders): string => {

        if (headers.hasOwnProperty("x-real-ip")) {
            return headers["x-real-ip"] as string;
        }

        return "127.0.0.1";
    };

    const ipAddress = getClientIpAddress(req.headers);
    const ipAddressHash = hashSha256(ipAddress);

    // get ip bann list information. Might be black- or whitelisted
    const ipListResult = await getIp(ipAddressHash);

    // in case of a  blacklisted hostname -> return right away
    if (ipListResult?.blacklisted === true) {
        // hostname is on blacklist
        res.status(400).json({
            message: "This IP is not allowed.",
        });
        return;

    }

    const setCheckType = (blacklisted: Boolean | undefined): {
        checkedBy: CheckType | undefined;
        checkedAt: Date | undefined;
    } => {

        if (blacklisted === false) {
            // listed in db but whitelisted
            // so we can set checked flag right away
            return { checkedBy: "WHITELIST", checkedAt: new Date() };
        }

        return { checkedBy: undefined, checkedAt: undefined };
    };

    const { checkedBy, checkedAt } = setCheckType(hostnameListResult?.blacklisted);

    // finally check if the requested urlLong is already in database
    const url = await getByUrlLong(req.body.urlLong);

    if (!!url) {
        // if not null then let know via status code that already exists but return the url entry
        res.status(409).json(url);
        return;
    } else {
        try {
            const linkProtocol: string = process.env.LINK_PROTOCOL ?? "http";
            const linkHostname: string = process.env.LINK_HOSTNAME ?? "localhost";
            const linkPort: number | null = (typeof process.env.LINK_PORT === "undefined" || process.env.LINK_PORT == "" ? null : parseInt(process.env.LINK_PORT));

            if (typeof checkedBy === undefined) {
                const newUrl = await createUrl(req.body.urlLong, hostname, linkProtocol, linkHostname, linkPort, ipAddressHash);
                res.status(201).json(newUrl);
                return;
            }

            const newUrl = await createUrl(req.body.urlLong, hostname, linkProtocol, linkHostname, linkPort, ipAddressHash, checkedBy, checkedAt);
            res.status(201).json(newUrl);
            return;
        } catch (e) {
            res.status(400).json({
                message: (e as Error).message,
            });
            return;
        }
    }
}
