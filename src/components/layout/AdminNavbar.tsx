import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, History, Trophy, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

const adminNavLinks = [
    { name: "Scan History", path: "/history", icon: History },
    { name: "Achievements", path: "/achievements", icon: Trophy },
];

export const AdminNavbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate("/login");
    };

    const userInitials = user?.name?.slice(0, 2).toUpperCase() || "AD";

    return (
        <header className="sticky top-0 z-50 w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50" />
            <nav className="container relative flex h-16 items-center justify-between">
                {/* Logo */}
                <Link to="/admin" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg group-hover:bg-red-500/30 transition-colors" />
                        <div className="relative p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-white">EcoAR Admin</span>
                        <span className="text-xs text-slate-400">Control Panel</span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                    {adminNavLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${location.pathname === link.path
                                    ? "bg-white/10 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 h-10 px-2 hover:bg-white/10">
                                <Avatar className="h-8 w-8 border-2 border-red-500/30">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                                    <AvatarFallback className="bg-red-500/20 text-red-400">{userInitials}</AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:flex flex-col items-start">
                                    <span className="text-sm font-medium text-white">{user?.name || 'Admin'}</span>
                                    <span className="text-xs text-slate-400">Administrator</span>
                                </div>
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
                            <DropdownMenuItem asChild>
                                <Link to="/history" className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                                    <History className="h-4 w-4" />
                                    Scan History
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to="/achievements" className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                                    <Trophy className="h-4 w-4" />
                                    Achievements
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-red-400 cursor-pointer hover:text-red-300"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </nav>
        </header>
    );
};
