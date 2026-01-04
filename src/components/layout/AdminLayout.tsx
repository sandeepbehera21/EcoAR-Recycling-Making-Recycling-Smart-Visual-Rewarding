import { ReactNode } from "react";
import { AdminNavbar } from "./AdminNavbar";

interface AdminLayoutProps {
    children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    return (
        <div className="min-h-screen flex flex-col bg-slate-900">
            <AdminNavbar />
            <main className="flex-1">{children}</main>
        </div>
    );
};
