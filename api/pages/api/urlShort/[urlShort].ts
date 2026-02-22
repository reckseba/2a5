import type { NextApiRequest, NextApiResponse } from "next";
import { getByUrlShort } from "../../../lib/urls";

type ErrorType = {
    message: string;
};

type SuccessType = {
    urlLong: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ErrorType | SuccessType>
) {

    if (req.method !== "GET") {
        res.status(405).json({ message: "Only GET requests allowed." });
        return;
    }


    const urlShort = req.query.urlShort as string;
    const regex = new RegExp("^[a-zA-Z0-9]{3,5}$");

    if (!regex.test(urlShort)) {
        res.status(400).json({ message: "Illegal short Url." });
        return;
    }


    const url = await getByUrlShort(urlShort);


    if (!!url) {
        // url is not null -> exists in db

        // if url was flagged as deleted then set response status to gone
        // no props are being passed to Deleted default function
        if (url.deleted === true) {
            res.status(410).json({ message: "This short link was deleted." });
            return;
        }

        // if not deleted then success response with urlLong
        res.status(200).json({ urlLong: url.urlLong });
        return;
    } else {
        // if there is no such shortUrl in database then 404
        res.status(404).json({ message: "Short link not found." });
        return;
    }
}
