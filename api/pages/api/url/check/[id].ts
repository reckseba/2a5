import type { NextApiRequest, NextApiResponse } from "next";
import { getUrlById, setUrlCheckedByAdminById } from "../../../../lib/urls";
import { getHostnameBlacklistedByHostname } from "../../../../lib/hostnames";

type ResponseType = {
    message: string;
    hostname?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseType>
) {

    if (req.method !== "GET") {
        res.status(405).json({ message: "Only GET requests allowed." });
        return;
    }


    const idString = req.query.id as string;
    const id = parseInt(idString);
    

    // first need to check that the hostname is not blacklisted already. would not be okay to have a checked url with a blacklisted hostname
    const url = await getUrlById(id);

    if (!url) {
        res.status(404).json({ message: "Not found."});
        return;
    }

    const hostname = await getHostnameBlacklistedByHostname(url.hostname);

    // hostname null -> ok
    // hostname not null and blacklisted true -> not ok
    // hostname not null and blacklisted false -> ok

    // the requested hostname is blacklisted -> connot check this url
    if (hostname !== null && hostname.blacklisted === true) {
        res.status(400).json({ message: "Hostname is blacklisted.", hostname: url.hostname});
        return;
    }

    // TODO: better to use NOW() function instead of injecting date. could be wrong according to timezone
    await setUrlCheckedByAdminById(id);
    res.status(200).json({ message: "success"});
    return;

}
