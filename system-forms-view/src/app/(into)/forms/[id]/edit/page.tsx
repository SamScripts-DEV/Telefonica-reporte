import EditForm from "@/components/pages/forms/edit-forms/EditForm";

export default function EditFormPage({params}: {params: {id: string}}) {
    const {id} = params

    return <EditForm formId={id} />
}