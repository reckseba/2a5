export function randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function generateRandomStringOfLength(lengthMin: number, lengthMax: number) {
    const length = randomIntFromInterval(lengthMin, lengthMax);
    let urlShort = "";
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const countChars = chars.length;

    for (var i = 0; i < length; i++) {
        urlShort += chars.charAt(Math.floor(Math.random() * countChars));
    }

    return urlShort;
}
