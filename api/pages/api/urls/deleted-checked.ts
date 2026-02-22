import type { NextApiRequest, NextApiResponse } from "next";
import { getUrlsDeletedChecked } from "../../../lib/urls";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {

    if (req.method !== "GET") {
        res.status(405).json({ message: "Only GET requests allowed." });
        return;
    }

    const urls = await getUrlsDeletedChecked();

    res.status(200).json(urls);
    return;

}