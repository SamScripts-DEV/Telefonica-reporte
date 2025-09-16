import React from "react";
import Head from "next/head";
import FormsView from "@/components/pages/forms/FormView";


export const metadata = {
    title: 'Formularios',
    description: 'Página de Formularios',
};

const FormsPage = () => {
    return (
        <>
            <Head>
                <title>{metadata.title}</title>
                <meta name="description" content={metadata.description} />
            </Head>
            <FormsView />
        </>
    );

}

export default FormsPage;