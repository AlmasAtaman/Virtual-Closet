"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const tokenParam = searchParams.get("token");
        if (!tokenParam) {
            setMessage("Invalid or missing reset token. Please request a new password reset link.");
            setIsSuccess(false);
        } else {
            setToken(tokenParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setIsSuccess(false);

        // Validate passwords match
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            setIsSuccess(false);
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setMessage("Password must be at least 6 characters long.");
            setIsSuccess(false);
            return;
        }

        if (!token) {
            setMessage("Invalid or missing reset token. Please request a new password reset link.");
            setIsSuccess(false);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || "Failed to reset password. Please try again.");
                setIsSuccess(false);
            } else {
                setMessage(data.message || "Password reset successful! Redirecting to login...");
                setIsSuccess(true);
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            }
        } catch {
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
                    <p className="text-sm text-gray-600">Enter your new password below.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full rounded-lg border border-gray-200 pl-10 pr-10 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-500 transition"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                            disabled={!token}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            disabled={!token}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    <div className="relative">
                        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="w-full rounded-lg border border-gray-200 pl-10 pr-10 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-500 transition"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                            disabled={!token}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            disabled={!token}
                        >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
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
                        disabled={loading || !token}
                    >
                        <span className="absolute inset-0 bg-gray-100 transition-transform duration-200 scale-x-0 group-hover:scale-x-100 origin-left rounded-full z-0"></span>
                        <span className="relative z-10 transition-colors duration-200 group-hover:text-black">
                            {loading ? "Resetting Password..." : "Reset Password"}
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
