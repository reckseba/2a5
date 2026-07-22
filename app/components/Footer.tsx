import React from "react";
import Link from "next/link";

export default function Footer() {

    return (
        <footer className="text-xs text-center text-gray-600">
            <span>There for you since 2012</span>
            <span className="px-2">&middot;</span>
            <Link href="/imprint" className="text-sky-500 hover:text-sky-600">Imprint</Link>
        </footer>
    );
}
