export async function getByUrlShort(urlShort: string) {

    const endpoint = "http://" + ( process.env.DOCKER_API_HOSTNAME || "localhost" ) + ":" + ( process.env.DOCKER_API_PORT || "3000" ) + "/api/urlShort/" + urlShort;
    const response = await fetch(endpoint);

    if (response.status == 410) {
        return {
            deleted: true
        };
    }

    if (response.status == 200) {

        const { urlLong } = await response.json();

        return { 
            deleted: false,
            urlLong: urlLong
        };
    }
    
    return null;

}
