"use client"

import { useState } from "react";
import Link from "next/link";
import { FaEnvelope } from "react-icons/fa";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || "Failed to send reset link. Please try again.");
                setIsSuccess(false);
            } else {
                setMessage("Check your email for reset link");
                setIsSuccess(true);
                setEmail(""); // Clear the form on success
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            setMessage("An unexpected error occurred. Please try again later.");
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-white px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-10 flex flex-col gap-6">
                {/* Header */}
                <div className="text-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h1>
                    <p className="text-sm text-gray-600">Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="email"
                            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-500 transition"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
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
                        <span className="absolute inset-0 bg-gray-100 transition-transform duration-200 scale-x-0 group-hover:scale-x-100 origin-left rounded-full z-0"></span>
                        <span className="relative z-10 transition-colors duration-200 group-hover:text-black">
                            {loading ? "Sending..." : "Send Reset Link"}
                        </span>
                    </button>
                </form>

                {/* Back to Login */}
                <div className="text-center text-sm">
                    <Link href="/login" className="text-gray-700 hover:underline">
                        Back to Login
                    </Link>
                </div>

                {/* Go Back */}
                <div className="flex justify-center mt-2">
                    <Link href="/" className="inline-block">
                        <button className="rounded-full border border-gray-300 bg-gray-100 px-6 py-2 text-gray-800 font-semibold shadow-sm hover:bg-gray-200 transition">Go Back</button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
