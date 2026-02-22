import "@/styles/globals.css";
import type { AppProps } from "next/app";
import localFont from "next/font/local";
import Head from "next/head";

const myFont = localFont({
    src: "../public/Virgil.woff2",
    variable: "--font-virgil"
});

export default function App({ Component, pageProps }: AppProps) {
    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <main className={`${myFont.variable} font-virgil`}>
                <Component {...pageProps} />
            </main>
        </>
    );
}
