import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function proxy(req: NextRequest) {

    if (req.nextUrl.pathname.match("/api/urlShort/*") || req.nextUrl.pathname.match("/api/urlLong/new") || req.nextUrl.pathname.match("/api/health")) {
        // only these routes are unauthenticated ok
        return;
    }


    const authHeaderValue = req.headers.get("authorization");

    if (!authHeaderValue) {
        return Response.json(
            { message: "No auth token provided." },
            { status: 401 }
        );
    }

    const token = authHeaderValue.split("Bearer ").at(1);

    if (token !== process.env.API_BEARER_TOKEN) {
        return Response.json(
            { message: "Invalid auth token." },
            { status: 401 }
        );
    }

    return;
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: "/api/:path*",
};
