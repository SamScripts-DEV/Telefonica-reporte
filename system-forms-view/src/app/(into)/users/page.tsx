import React from "react";
import Head from "next/head";
import UserManagement from "@/components/pages/users/User";

export const metadata = {
  title: "Usuarios",
  description: "Página de gestión de usuarios",
};

export default function UserPage() {
  return (
    <>
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </Head>
      <UserManagement />
    </>
  );
}