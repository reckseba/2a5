import Head from "next/head";
import Wrapper from "../components/Wrapper";
import Link from "next/link";

export default function NotFound() {
    return (
        <>
            <Head>
                <title>2a5.de URL-Shortener - Not Found</title>
            </Head>
            <div className="text-center">
                <Wrapper showHeader={false} showFooter={false}>
                    <div>Hey Buddy,<br/>in case you do not know: you have landed on 2a5 - a URL-Shortener. People use it to shorten their long and ugly links. But the one you just used never existed.<br/>Cheers.</div>
                    <div><Link
                        href="/"
                        className="text-sky-500 hover:text-sky-600"
                    >To the front-page &rarr;</Link></div>
                </Wrapper>
            </div>
        </>
    );
}
