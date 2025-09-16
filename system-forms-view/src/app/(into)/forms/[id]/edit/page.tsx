import React from "react";
import Head from "next/head";
import EditForm from "@/components/pages/forms/edit-forms/EditForm";

export const metadata = {
    title: "Editar Formulario",
    description: "Editar Formulario",
}

export default function EditFormPage({ params }: { params: { id: string } }) {
    const { id } = params

    return (
        <>
            <Head>
                <title>{metadata.title}</title>
                <meta name="description" content={metadata.description} />
            </Head>
            <EditForm formId={id} />
        </>
    )

}