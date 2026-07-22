import Head from "next/head";
import Wrapper from "../components/Wrapper";
import Link from "next/link";
import { GetServerSideProps } from "next";

type ImprintProps = {
    representative: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    email: string;
    website: string;
};

const getEnv = (key: string, fallback = "Not configured"): string => {
    const value = process.env[key];

    if (!value || value.trim().length === 0) {
        return fallback;
    }

    return value;
};

export const getServerSideProps: GetServerSideProps<ImprintProps> = async () => {
    return {
        props: {
            representative: getEnv("IMPRINT_REPRESENTATIVE"),
            street: getEnv("IMPRINT_STREET"),
            postalCode: getEnv("IMPRINT_POSTAL_CODE"),
            city: getEnv("IMPRINT_CITY"),
            country: getEnv("IMPRINT_COUNTRY"),
            email: getEnv("IMPRINT_EMAIL"),
            website: getEnv("IMPRINT_WEBSITE", ""),
        }
    };
};

export default function Imprint({
    representative,
    street,
    postalCode,
    city,
    country,
    email,
    website,
}: ImprintProps) {
    return (
        <>
            <Head>
                <title>2a5.de URL-Shortener - Imprint</title>
            </Head>
            <Wrapper showHeader={false} showFooter={true}>
                <div>
                    <Link
                        href="/"
                        className="text-sky-500 hover:text-sky-600"
                    >&larr; To the front-page</Link>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">Imprint</h1>

                <div className="space-y-4 text-gray-700">
                    <section>
                        <h2 className="text-lg font-medium text-gray-900">Information according to section 5 TMG</h2>
                        <p>{street}</p>
                        <p>{postalCode} {city}</p>
                        <p>{country}</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-medium text-gray-900">Represented by</h2>
                        <p>{representative}</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-medium text-gray-900">Contact</h2>
                        <p>Email: {email}</p>
                        {website ? <p>Website: <Link href={website} className="text-sky-500 hover:text-sky-600">{website}</Link></p> : ""}
                    </section>

                </div>
            </Wrapper>
        </>
    );
}
