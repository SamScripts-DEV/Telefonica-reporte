import React from "react";
import Head from "next/head";
import ReportsPage from "@/components/pages/reports/Reports";
import { getReportFormListServer } from "@/api/reports/reports-endpoints-server";



export const metadata = {
  title: "Reportes - FormManager",
  description: "Página de gestión de reportes",
};

export default async function ReportAnalyticsPage() {

  const formsData = await getReportFormListServer();

  if (!formsData) {
    return <ReportsPage />
  }
  return <ReportsPage initialData={formsData} />
}