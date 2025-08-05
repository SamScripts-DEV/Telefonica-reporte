import FormToFill from "@/components/pages/forms/fill-form/FormToFill"

export default function FormToFillPage({params}: {params: {id: string}}) {
    const {id} = params

    return <FormToFill formId={id} />
}