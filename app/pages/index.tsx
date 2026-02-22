import Head from "next/head";
import CopyButton from "../components/CopyButton";
import Form from "../components/Form";
import Wrapper from "../components/Wrapper";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";

export default function Home() {

    const [urlQrCode, setUrlQrCode] = useState("");
    const [urlShortFull, setUrlShortFull] = useState("");
    const [urlShort, setUrlShort] = useState("");

    const checkQrCodeImage = () => {
        if (urlQrCode === "") {
            return;
        }

        return (
            <div className="text-center">
                <div>
                    <Link
                        id="resultUrlShortFullLink"
                        href={urlShortFull}
                        className="
                            text-3xl
                            font-bold
                        "
                    >2a5.de/{urlShort}</Link>
                    <CopyButton urlShortFull={urlShortFull} />
                </div>
                <div id="resultUrlQrCode">
                    <Image src={urlQrCode} className="mx-auto" alt="QR-Code" width="150" height="150" />
                </div>
            </div>
        );
    };


    const ref = useRef<HTMLElement|null>(null);

    useEffect(() => {
        ref.current?.focus();
    }, []);

    return (
        <>

            <Head>
                <title>2a5.de URL-Shortener</title>
            </Head>

            <Wrapper showHeader={true} showFooter={true}>
                <Form
                    setUrlQrCode={setUrlQrCode}
                    setUrlShortFull={setUrlShortFull}
                    setUrlShort={setUrlShort}
                    ref={ref}
                />

                {checkQrCodeImage()}

                <p>This is how 2a5 protects your privacy:</p>
                <ul className="space-y-4">
                    <li className="flex items-center">
                        <svg className="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="11" />
                            <path d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9" fill="none" />
                        </svg>
                        <p className="ml-4">
                            No trackers, ads or whatsoever
                        </p>
                    </li>
                    <li className="flex items-center">
                        <svg className="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="11" />
                            <path d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9" fill="none" />
                        </svg>
                        <p className="ml-4">
                            No log files
                        </p>
                    </li>
                </ul>
            </Wrapper>

        </>
    );
}
