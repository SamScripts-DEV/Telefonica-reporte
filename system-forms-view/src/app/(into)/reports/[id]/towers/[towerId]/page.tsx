import React from "react";
import TowerAnalysisPage from "@/components/pages/reports/OneFormReport/TowersReport";
import { getTowerAnalysisServer } from "@/api/reports/reports-endpoints-server";


export const metadata = {
    title: "Reportes - FormManager",
    description: "Página de gestión de reportes",
};

export default async function TowerReportPage({ params }: { params: { id: string, towerId: string } }) {

    const { id, towerId } = params
    const initialData = await getTowerAnalysisServer(id, towerId)

    return <TowerAnalysisPage
        params={{ id, towerId }}
        initialData={initialData}
    />
}