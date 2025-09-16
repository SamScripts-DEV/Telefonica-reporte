import React from "react"
import Head from "next/head"
import FormToFill from "@/components/pages/forms/fill-form/FormToFill"

export const metadata = {
    title: "Llenar Formulario",
    description: "Llenar el Formulario seleccionado",
}

export default function FormToFillPage({params}: {params: {id: string}}) {
    const {id} = params

    return (
        <>
            <Head>
                <title>{metadata.title}</title>
                <meta name="description" content={metadata.description} />
            </Head>
            <FormToFill formId={id} />
        </>
    )
}