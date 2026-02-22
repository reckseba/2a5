import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingHttpHeaders } from "http";
import { parse } from "tldts";

import { getHostname } from "../../lib/hostnames";

type ErrorType = {
    message: string;
};

type SuccessType = {
    urlLong: string;
    urlQrCode: string;
    urlShort: string;
    urlShortFull: string;
}

async function doAPIRequest(urlLong: string, ipAddress: string) {
    const endpoint = "http://" + (process.env.DOCKER_API_HOSTNAME || "localhost") + ":" + (process.env.DOCKER_API_PORT || "3000") + "/api/urlLong/new";
    const payload = {
        urlLong: urlLong
    };
    const options = {
        headers: {
            "Content-Type": "application/json",
            "x-real-ip": ipAddress
        },
        method: "PUT",
        body: JSON.stringify(payload)
    };
    const response = await fetch(endpoint, options);

    if (![201, 409].includes(response.status)) {
        console.error("something is not good");
        return false;
    }

    // either 201: created new
    // or 409: which is when urlLong already exists which is fine
    return {
        status: response.status,
        json: await response.json()
    };

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

    const hostname = getHostname(req.body.urlLong);

    // if this is no valid url it will throw exception
    if (hostname === undefined) {
        res.status(400).json({
            message: "This is no valid URL.",
        });
        return;
    }

    // now check if its a valid top level domain
    const hostnameParsed = parse(hostname!);
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

    const getClientIpAddress = (headers: IncomingHttpHeaders): string => {

        if (headers.hasOwnProperty("x-real-ip")) {
            return headers["x-real-ip"] as string;
        }

        return "127.0.0.1";
    };

    const ipAddress = getClientIpAddress(req.headers);

    // finally check if the requested urlLong is already in database
    const response = await doAPIRequest(req.body.urlLong, ipAddress);

    if (response == false) {
        res.status(400).json({
            message: "Something went wrong",
        });
        return;
    } else {
        res.status(response.status).json(response.json);
        return;
    }
}
