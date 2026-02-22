import React, { forwardRef } from "react";

type FormParamType = {
    setUrlQrCode: React.Dispatch<React.SetStateAction<string>>;
    setUrlShortFull: React.Dispatch<React.SetStateAction<string>>;
    setUrlShort: React.Dispatch<React.SetStateAction<string>>;
};

const Form = forwardRef(function Form ({ setUrlQrCode, setUrlShortFull, setUrlShort }: FormParamType, ref: any) {
    const setInterfaceResults = (urlQrCode: string, urlShortFull: string, urlShort: string) => {
        setUrlQrCode(urlQrCode);
        setUrlShortFull(urlShortFull);
        setUrlShort(urlShort);
    };

    const handleSubmit = async (event: React.SyntheticEvent) => {
        // Stop the form from submitting and refreshing the page.
        event.preventDefault();

        // see here: https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/forms_and_events/#list-of-event-types
        const target = event.target as typeof event.target & {
            urlLong: { value: string };
        };

        const urlLong = target.urlLong.value;

        // Get data from the form.
        const data = {
            urlLong: urlLong,
        };

        // Send the data to the server in JSON format.
        const JSONdata = JSON.stringify(data);

        // API endpoint where we send form data.
        const endpoint = "/api/newUrlLong";

        // Form the request for sending data to the server.
        const options = {
            // The method is POST because we are sending data.
            method: "PUT",
            // Tell the server we're sending JSON.
            headers: {
                "Content-Type": "application/json",
            },
            // Body of the request is the JSON data we created above.
            body: JSONdata,
        };

        // Send the form data to our forms API on Vercel and get a response.
        const response = await fetch(endpoint, options);

        // Get the response data from server as JSON.
        // If server returns the name submitted, that means the form works.
        const result = await response.json();

        if (![201, 409].includes(response.status)) {
            console.error("something is not good");
            return;
        }

        setInterfaceResults(result.urlQrCode, result.urlShortFull, result.urlShort);

        // alert(`Is this your full name: ${result.data}`);
    };

    return (
        <form onSubmit={handleSubmit} className="relative block">
            <input
                type="url"
                ref={ref}
                required
                name="urlLong"
                placeholder="https://this.is/my?super=ugly#link"
                className="
                        form-input
                        border
                        border-2
                        rounded
                        border-gray-900
                        py-3
                        px-4
                        bg-white
                        placeholder-gray-400
                        text-gray-500
                        appearance-none
                        w-full
                        block
                        pr-14
                        focus:outline-none focus:text-gray-700 focus:bg-white focus:border-cyan-500
                        "
            />


            <button type="submit"
                className="
                        text-gray-50
                        w-8
                        h-8
                        absolute
                        top-1/2
                        transform
                        -translate-y-1/2
                        right-3
                        ">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 27 27"
                    fill="currentColor"
                    className="stroke-black active:stroke-cyan-500">
                    <path className="stroke-inherit" d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path className="stroke-inherit" d="M10.74 15.53L14.26 12L10.74 8.46997" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

        </form>
    );
});

export default Form;
