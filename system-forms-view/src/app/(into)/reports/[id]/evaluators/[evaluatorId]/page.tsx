import React from "react";
import EvaluatorAnalysisPage from "@/components/pages/reports/OneFormReport/EvaluatorsReport";
import { getEvaluatorAnalysisServer } from "@/api/reports/reports-endpoints-server";


export const metadata = {
    title: "Reportes - FormManager",
    description: "Página de gestión de reportes",
};

export default async function EvaluatorReportPage({ params }: { params: { id: string, evaluatorId: string } }) {

    const { id, evaluatorId } = params
    const initialData = await getEvaluatorAnalysisServer(id, evaluatorId)

    return <EvaluatorAnalysisPage
        params={{ id, evaluatorId }}
        initialData={initialData}
    />
}