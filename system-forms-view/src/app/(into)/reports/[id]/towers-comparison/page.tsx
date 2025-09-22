import React from "react";
import TowersComparisonPage from "@/components/pages/reports/OneFormReport/TowersComparison";
import { getTowersComparisonServer } from "@/api/reports/reports-endpoints-server";



export const metadata = {
    title: "Reportes - FormManager",
    description: "Página de gestión de reportes",
};

export default async function TowerReportPage({ params }: { params: { id: string } }) {

    const { id } = params
    const initialData = await getTowersComparisonServer(id)

    return <TowersComparisonPage
        params={{ id }}
        initialData={initialData}
    />
}