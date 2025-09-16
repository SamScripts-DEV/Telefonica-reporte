import React from "react";
import Head from "next/head";

//import Dashboard from "@/components/pages/dashboard/Dashboard";
import DashboardUnion from "@/components/pages/dashboard/Dashboard.union";


export const metadata = {
    title: 'Dashboard',
    description: 'Dashboard Page',
};

const DashboardPage = () => {
    return (
        <>
            <Head>
                <title>{metadata.title}</title>
                <meta name="description" content={metadata.description} />
            </Head>
            <DashboardUnion />
        </>
    );

}

export default DashboardPage;