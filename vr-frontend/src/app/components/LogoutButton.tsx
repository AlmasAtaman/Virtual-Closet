"use client"
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";


export default function LogOutButton() {
    const router = useRouter();
    
    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    return <button onClick={handleLogout} className="bg-blue-600 px-4 py-2 rounded">Logout</button>
}