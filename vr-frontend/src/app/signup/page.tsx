"use client"

import Link from "next/link";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { FaGoogle, FaFacebookF, FaApple, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { signIn } from "next-auth/react";


type User = {
    id: string;
    username: string;
    email: string;
    password: string;
};

export default function SignUp(){
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();

    const addUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8000/api/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            if (res.ok){
                setMessage(data.message || `Account for ${username} created successfully! Redirecting...`);
                setIsSuccess(true);
                console.log(`Registered User ${username}`);
                setTimeout(() => {
                    router.push("/dashboard");
                }, 2000);
            } else {
                setMessage(data.message || "Signup failed. Please try again.");
                setIsSuccess(false);
            }
        } catch (error) {
            console.error("Signup error:", error);
            setMessage("An unexpected error occurred. Please try again later.");
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-orange-50/60 to-white px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-10 flex flex-col gap-6">
                {/* Tabs */}
                <div className="flex justify-center gap-6 mb-4 border-b border-gray-200 pb-2">
                    <span className="text-lg font-bold text-gray-900 border-b-2 border-orange-500 pb-1">Sign-Up</span>
                    <Link href="/login" className="text-lg font-semibold text-gray-400 hover:text-orange-500 transition">Log In</Link>
                </div>
                {/* Social Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                        className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-lg py-2 font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                        <FaGoogle className="text-lg" /> Sign in with Google
                    </button>
                </div>
                {/* Divider */}
                <div className="flex items-center gap-4 my-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-gray-400 font-semibold text-sm">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>
                {/* Form */}
                <form onSubmit={addUser} className="flex flex-col gap-4">
                    <div className="relative">
                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div className="relative">
                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="email"
                            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>
                    <div className="relative">
                        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                    {/* Display feedback message */}
                    {message && (
                        <p className={`text-center text-sm ${isSuccess ? "text-green-600" : "text-red-600"}`}>
                            {message}
                        </p>
                    )}
                    <button
                        type="submit"
                        className="relative overflow-hidden rounded-full px-8 py-3 font-semibold border border-black text-white bg-black transition-colors duration-200 group text-lg shadow-lg mt-2"
                        disabled={loading}
                    >
                        <span className="absolute inset-0 bg-orange-100 transition-transform duration-200 scale-x-0 group-hover:scale-x-100 origin-left rounded-full z-0"></span>
                        <span className="relative z-10 transition-colors duration-200 group-hover:text-black">
                            {loading ? "Signing Up..." : "Sign Up"}
                        </span>
                    </button>
                </form>
                {/* Terms/Privacy */}
                <div className="text-xs text-gray-500 text-center mt-2">
                    By signing up, you agree to the <a href="#" className="underline hover:text-orange-500">Terms of Service</a> and <a href="#" className="underline hover:text-orange-500">Privacy Policy</a>.
                </div>
                {/* Go Back */}
                <div className="flex justify-center mt-2">
                    <Link href="/" className="inline-block">
                        <button className="rounded-full border border-orange-200 bg-orange-50 px-6 py-2 text-orange-700 font-semibold shadow-sm hover:bg-orange-100 transition">Go Back</button>
                    </Link>
                </div>
            </div>
        </div>
    );
};