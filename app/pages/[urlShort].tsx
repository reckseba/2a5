import Head from "next/head";
import Wrapper from "../components/Wrapper";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { getByUrlShort } from "../lib/urls";

// This gets called on every request
export const getServerSideProps: GetServerSideProps = async ({
    params,
    res,
}) => {

    const urlShort = params?.urlShort as string;

    const regex = new RegExp("^[a-zA-Z0-9]{3,5}$");

    if (!regex.test(urlShort)) {
        return {
            notFound: true,
        };
    }

    const url = await getByUrlShort(urlShort);

    if (!!url) {
        // url is not null -> exists in db

        // if url was flagged as deleted then set response status to gone
        // no props are being passed to Deleted default function
        if (url.deleted === true) {
            res.statusCode = 410;
            return {
                props: {}
            };
        }

        // if not deleted then redirect
        return {
            redirect: {
                // Next.js uses the 307 temporary redirect, and 308 permanent redirect status codes to explicitly preserve the request method used.
                permanent: true, // 308 ... false would do 307
                destination: url.urlLong,
            },
        };
    } else {
        // if there is no such shortUrl in database then 404
        return {
            notFound: true,
        };
    }
};

export default function Deleted() {
    // there must be default function being exported
    return (
        <>
            <Head>
                <title>2a5.de URL-Shortener - Deleted</title>
            </Head>
            <div className="text-center">
                <Wrapper showHeader={false} showFooter={false}>
                    <div>Hey Buddy,<br/>in case you do not know: you have landed on 2a5 - a URL-Shortener. People use it to shorten their long and ugly links. But the one you just used has been deleted due to abuse. Might have been that someone tried to trick you. But lucky you - 2a5 got your back. Be careful when clicking on links in emails from malicious senders.<br/>Cheers.</div>
                    <div><Link
                        href="/"
                        className="text-sky-500 hover:text-sky-600"
                    >To the front-page &rarr;</Link></div>
                </Wrapper>
            </div>
        </>
    );
}
