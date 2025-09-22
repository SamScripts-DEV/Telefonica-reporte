import React from "react";
import TechnicianAnalysisPage from "@/components/pages/reports/OneFormReport/TechnicianReport";
import { getTechnicianAnalysisServer } from "@/api/reports/reports-endpoints-server";


export const metadata = {
    title: "Reportes - FormManager",
    description: "Página de gestión de reportes",
};

export default async function TechnicianReportPage({ params }: { params: { id: string, technicianId: string } }) {

    const { id, technicianId } = params
    const initialData = await getTechnicianAnalysisServer(id, technicianId)

    return <TechnicianAnalysisPage
        params={{ id, technicianId }}
        initialData={initialData}
    />
}