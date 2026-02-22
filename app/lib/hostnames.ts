export function getHostname(urlLong: string) {
    try {
        const { hostname } = new URL(urlLong);
        return hostname;
    } catch (e) {
        return undefined;
    }
}
