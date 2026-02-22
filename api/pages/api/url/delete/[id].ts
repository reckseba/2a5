import type { NextApiRequest, NextApiResponse } from "next";
import { deleteUrl } from "../../../../lib/urls";

type ResponseType = {
    message: string;
    hostname?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseType>
) {

    if (req.method !== "DELETE") {
        res.status(405).json({ message: "Only DELETE requests allowed." });
        return;
    }


    const idString = req.query.id as string;
    const id = parseInt(idString);
    

    // first need to check that the hostname is not blacklisted already. would not be okay to have a checked url with a blacklisted hostname
    const url = await deleteUrl(id);

    if (!url) {
        res.status(404).json({ message: "Not found."});
        return;
    }

    res.status(200).json({ message: "success"});
    return;

}
