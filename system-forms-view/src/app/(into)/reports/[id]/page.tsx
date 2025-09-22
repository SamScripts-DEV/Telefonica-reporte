import React from "react";

import { getReportFormDashboardServer } from "@/api/reports/reports-endpoints-server";
import FormDashboardPage from "@/components/pages/reports/OneFormReport/OneFormReport";




export const metadata = {
    title: "Reportes - FormManager",
    description: "Página de gestión de reportes",
};

export default async function DashboardReportFormPage({ params }: { params: { id: string } }) {

    const { id } = params

    const initialData = await getReportFormDashboardServer(id)

    return <FormDashboardPage
        params={{ id }}
        initialData={initialData}
    />
}