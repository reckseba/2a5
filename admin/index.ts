import express, { Express, Request, Response } from "express";
import * as path from "path";
import "dotenv/config";

const bearer = "Bearer " + process.env.ADMIN_TOKEN;

async function fetchApi(path: string, method = "GET") {

    const endpoint = "http://" + process.env.DOCKER_API_HOSTNAME + ":" + process.env.DOCKER_API_PORT + path;

    const option = {
        headers: {
            "Authorization": bearer,
        },
        method: method
    };

    const response = await fetch(endpoint, option);

    const responseJson = await response.json();

    if (response.status != 200) {
        const message = responseJson.message || "something is not good";
        console.error(message);
    }

    return responseJson;
}

async function getUrlsUndeletedUnchecked() {
    return await fetchApi("/api/urls/undeleted-unchecked");
}

async function getUrlsUndeletedChecked() {
    return await fetchApi("/api/urls/undeleted-checked");
}

async function getUrlsDeletedChecked() {
    return await fetchApi("/api/urls/deleted-checked");
}

async function getHostnamesBlacklisted() {
    return await fetchApi("/api/hostnames/blacklisted");
}

async function getHostnamesWhitelisted() {
    return await fetchApi("/api/hostnames/whitelisted");
}

async function setUrlCheckedAdminUndeletedById(id: number) {
    return await fetchApi(`/api/url/check/${id}`);
}

async function setUrlCheckedAdminDeletedById(id: number) {
    return await fetchApi(`/api/url/delete/${id}`, "DELETE");
}

async function setUrlWhitelist(id: number) {
    return await fetchApi(`/api/url/whitelist/${id}`);
}

async function setUrlBlacklist(id: number) {
    return await fetchApi(`/api/url/blacklist/${id}`);
}

const app: Express = express();
app.set("view engine", "pug");

const port = process.env.ADMIN_PORT;

app.get("/", async (req: Request, res: Response) => {

    const urlsUndeletedUnchecked = await getUrlsUndeletedUnchecked();
    const urlsUndeletedChecked = await getUrlsUndeletedChecked();
    const urlsDeletedChecked = await getUrlsDeletedChecked();
    const hostnamesBlacklisted = await getHostnamesBlacklisted();
    const hostnamesWhitelisted = await getHostnamesWhitelisted();

    res.render("home", {
        title: "2a5 Admin",
        urlsUndeletedUnchecked: urlsUndeletedUnchecked,
        urlsUndeletedChecked: urlsUndeletedChecked,
        urlsDeletedChecked: urlsDeletedChecked,
        hostnamesBlacklisted: hostnamesBlacklisted,
        hostnamesWhitelisted: hostnamesWhitelisted
    });

});

app.get("/api/url/check/:id", async (req: Request, res: Response) => {

    const responseJson = await setUrlCheckedAdminUndeletedById(parseInt(req.params.id[0]));

    if (responseJson.message == "success") {
        res.redirect("/");
    } else {
        res.render("url-check-error", {
            title: "2a5 Admin - Url Check Error",
            hostname: responseJson.hostname
        });
    }

});

app.get("/api/url/delete/:id", async (req: Request, res: Response) => {

    await setUrlCheckedAdminDeletedById(parseInt(req.params.id[0]));

    res.redirect("/");

});

app.get("/api/url/whitelist/:id", async (req: Request, res: Response) => {

    const responseJson = await setUrlWhitelist(parseInt(req.params.id[0]));

    if (responseJson.message == "success") {
        res.redirect("/");
    } else if (responseJson.message == "error - whitelisted already") {
        // this is the case, that the hostname is whitelisted already
        res.render("whitelist-error-whitelisted-already", {
            title: "2a5 Admin - Whitelist Error",
            hostname: responseJson.hostname
        });
    } else if (responseJson.message == "error - blacklisted already") {
        // this is the case, that the hostname is blacklisted already
        res.render("blacklist-error-blacklisted-already", {
            title: "2a5 Admin - blacklist Error",
            hostname: responseJson.hostname
        });
    } else if (responseJson.message == "error - deleted URLs") {
        res.render("whitelist-error-urls-deleted", {
            title: "2a5 Admin - Whitelist Error",
            urls: responseJson.urls,
            hostname: responseJson.hostname
        });
    }

});

app.get("/api/url/blacklist/:id", async (req: Request, res: Response) => {

    const responseJson = await setUrlBlacklist(parseInt(req.params.id[0]));

    if (responseJson.message === "success") {
        res.redirect("/");
    } else if (responseJson.message == "error - blacklisted already") {
        // this is the case, that the hostname is blacklisted already
        res.render("blacklist-error-blacklisted-already", {
            title: "2a5 Admin - Blacklist Error",
            hostname: responseJson.hostname
        });
    } else if (responseJson.message == "error - checked URLs") {
        res.render("blacklist-error-urls-checked", {
            title: "2a5 Admin - Blacklist Error",
            urls: responseJson.urls,
            hostname: responseJson.hostname
        });
    }

});

app.get("/api/health", (req: Request, res: Response) => {
    res.json({ message: "healthy" });

});

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

app.use(express.static(path.join(__dirname, "public")));

