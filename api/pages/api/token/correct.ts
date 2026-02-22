import type { NextApiRequest, NextApiResponse } from "next";

type ResponseType = {
    message: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseType>
) {

    if (req.method !== "GET") {
        res.status(405).json({ message: "Only GET requests allowed." });
        return;
    }

    res.status(200).json({ message: "success"});
    return;

}
