import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta
                    name="description"
                    content="Shorten your long URL the easy way!"
                />
                <meta
                    name="copyright"
                    content="(c) 2023 2a5.de All rights reserved."
                />
                <meta name="publisher" content="Sebastian Reck" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
