import "@/app/globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className="w-full h-full">
        <SidebarProvider>
            <div className="flex w-full h-full">
                <div>
                    <AppSidebar />
                </div>

                <main className="relative flex-grow flex flex-col">
                    <SidebarTrigger className="absolute z-10" />
                    <div className="flex-grow flex justify-center items-center">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
        </body>
        </html>
    );
}
