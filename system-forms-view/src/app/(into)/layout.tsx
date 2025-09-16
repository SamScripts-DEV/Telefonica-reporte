import { Navbar } from "@/components/pages/navigation/NavBar";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToastProvider>
        <Navbar />
        <main>
          {children}
        </main>
        <Toaster />
      </ToastProvider>
    </>
  );
}