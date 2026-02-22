import React from "react";
import Footer from "./Footer";
import Header from "./Header";

export default function Wrapper({ children, showHeader, showFooter }: {
    children: React.ReactNode;
    showHeader: Boolean;
    showFooter: Boolean;
}) {

    return (
        <div className="relative flex min-h-screen flex-col justify-center overflow-hidden">
            <div className="
                absolute
                inset-0
                bg-center
                from-cyan-50
                via-cyan-50
                to-orange-50
                bg-gradient-to-bl
            "></div>
            <div className="
                relative
                bg-white
                mt-10
                mb-10
                rounded
                2xl:mt-10
                px-6
                pt-10
                pb-8
                shadow-xl
                ring-1
                ring-gray-900/5
                max-w-2xl
                w-full
                mx-auto
                ">
                <div className="">
                    {showHeader ? <Header /> : ""}
                    <div className="divide-y divide-gray-300/50">
                        <div className="space-y-6 py-8 text-base leading-7 text-gray-600">
                            {children}
                        </div>
                    </div>
                    {showFooter ? <Footer /> : ""}
                </div>
            </div>
        </div>
    );
}
