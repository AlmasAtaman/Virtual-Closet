"use client"
import { useRouter } from "next/navigation";
// import { signOut } from "next-auth/react";
import axios from 'axios';


export default function LogOutButton() {
    const router = useRouter();
    
    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:8000/api/auth/signout', {}, { withCredentials: true });
        } catch (error) {
            console.error("Error signing out on backend:", error);
        }
        // await signOut({ callbackUrl: '/login' });
        router.push('/login');
    };

    return <button onClick={handleLogout} className="bg-blue-600 px-4 py-2 rounded">Logout</button>
}