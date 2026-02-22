import type { NextApiRequest, NextApiResponse } from "next";
import { getUrlById, getUrlsDeletedByHostname, setUrlsWhitelistedByHostname } from "../../../../lib/urls";
import { getHostnameWhitelistedByHostname, getHostnameBlacklistedByHostname, createHostnameWhitelisted } from "../../../../lib/hostnames";

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

    // check if hostname is whitelisted already
    const hostnameWhitelisted = await getHostnameWhitelistedByHostname(url.hostname);

    if (hostnameWhitelisted) {
        res.status(400).json({ message: "error - whitelisted already", hostname: url.hostname});
        return;
    }

    // check if hostname is whitelisted already
    const hostnameBlacklisted = await getHostnameBlacklistedByHostname(url.hostname);

    if (hostnameBlacklisted) {
        res.status(400).json({ message: "error - blacklisted already", hostname: url.hostname});
        return;
    }

    // now check if any url with that hostname got deleted manually before
    const urls = await getUrlsDeletedByHostname(url.hostname);

    if (urls.length > 0) {
        // yes there is at least one. so cannot add to whitelist. first need to clean it. Or hostname is no whitelist candidate
        res.status(400).json({ message: "error - deleted URLs", urls: urls, hostname: url.hostname});
        return;
    }

    // all fine, we can add the hostname to the whitelist
    await createHostnameWhitelisted(url.hostname);

    // and finally set all urls with that hostname whitelisted
    await setUrlsWhitelistedByHostname(url!.hostname);


    res.status(200).json({ message: "success"});
    return;

}
