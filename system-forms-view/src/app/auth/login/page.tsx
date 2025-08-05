import LoginPage from "@/components/pages/auth/Login";
import { title } from "process";

export const metadata = {
    title: "Login",
    description: "login Page - Iniciar sesión en el sistema de gestión de formularios",
}

export default function Loginpage() {
    return <LoginPage />

}