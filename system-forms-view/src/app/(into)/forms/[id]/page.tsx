import DetailForm from "@/components/pages/forms/detail-form/DetailForm"

export default function EditFormPage({params}: {params: {id: string}}) {
    const {id} = params

    return <DetailForm formId={id} />
}