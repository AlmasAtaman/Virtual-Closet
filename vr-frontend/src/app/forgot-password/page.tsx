"use client"

import { useState } from "react";
import Link from "next/link";
import { FaEnvelope } from "react-icons/fa";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(""); // Clear previous messages
        setIsSuccess(false);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || "If an account with that email exists, a password reset link has been sent.");
                setIsSuccess(true);
            } else {
                setMessage(data.message || "Failed to send reset link. Please try again.");
                setIsSuccess(false);
            }
        } catch (error) {
            console.error("Error during forgot password request:", error);
            setMessage("An unexpected error occurred. Please try again later.");
            setIsSuccess(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-orange-50/60 to-white px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-10 flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-center text-gray-900">Forgot Password</h2>
                <p className="text-center text-gray-600">Enter your email address to receive a password reset link.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="email"
                            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    {message && (
                        <p className={`text-center text-sm ${isSuccess ? "text-green-600" : "text-red-600"}`}>
                            {message}
                        </p>
                    )}
                    <button
                        type="submit"
                        className="relative overflow-hidden rounded-full px-8 py-3 font-semibold border border-black text-white bg-black transition-colors duration-200 group text-lg shadow-lg mt-2"
                    >
                        <span className="absolute inset-0 bg-orange-100 transition-transform duration-200 scale-x-0 group-hover:scale-x-100 origin-left rounded-full z-0"></span>
                        <span className="relative z-10 transition-colors duration-200 group-hover:text-black">Send Reset Link</span>
                    </button>
                </form>

                <div className="flex justify-center mt-2">
                    <Link href="/login" className="inline-block">
                        <button className="rounded-full border border-orange-200 bg-orange-50 px-6 py-2 text-orange-700 font-semibold shadow-sm hover:bg-orange-100 transition">Back to Login</button>
                    </Link>
                </div>
            </div>
        </div>
    );
} 