import { createHash } from "node:crypto";

export function hashSha256(inputString: string) {

    const hash = createHash("sha256");
    hash.update(inputString);
    return hash.digest("hex");

}
