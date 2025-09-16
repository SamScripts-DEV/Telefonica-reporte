import React from "react"
import Head from "next/head"
import DetailForm from "@/components/pages/forms/detail-form/DetailForm"


export const metadata = {
    title: "Detalle del Formulario",
    description: "Detalle del Formulario seleccionado",
}

export default function EditFormPage({params}: {params: {id: string}}) {
    const {id} = params
    return (
        <>
            <Head>
                <title>{metadata.title}</title>
                <meta name="description" content={metadata.description} />
            </Head>
            <DetailForm formId={id} />
        </>
    )

    
}