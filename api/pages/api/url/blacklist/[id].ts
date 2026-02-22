import type { NextApiRequest, NextApiResponse } from "next";
import { getUrlById, getUrlsCheckedByHostname, setUrlsBlacklistedByHostname } from "../../../../lib/urls";
import { getHostnameBlacklistedByHostname, createHostnameBlacklisted } from "../../../../lib/hostnames";

type ResponseType = {
    message: string;
    hostname?: string;
    urls?: {
        id: number
    }[];
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
    
    // check if there is such an url under that id
    const url = await getUrlById(id);

    if (!url) {
        res.status(404).json({ message: "Not found."});
        return;
    }

    // check if hostname is blacklisted already
    const hostname = await getHostnameBlacklistedByHostname(url.hostname);

    if (hostname) {
        res.status(400).json({ message: "error - blacklisted already", hostname: url.hostname});
        return;
    }

    // now check if any url with that hostname got checked manually before
    const urls = await getUrlsCheckedByHostname(url.hostname);

    if (urls.length > 0) {
        // yes there is at least one. so cannot add to blacklist. first need to clean it. Or hostname is no blacklist candidate
        res.status(400).json({ message: "error - checked URLs", urls: urls, hostname: url.hostname});
        return;
    }

    // all fine, we can add the hostname to the blacklist
    await createHostnameBlacklisted(url.hostname);

    // and finally set all urls with that hostname blacklisted
    await setUrlsBlacklistedByHostname(url!.hostname);


    res.status(200).json({ message: "success"});
    return;

}
