"use client"

import { useState } from "react";
import { getBaseUrl, safeRedirect } from "../../utils/url";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaGoogle, FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

// Google Identity Services global declaration
interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (config: unknown) => void;
      renderButton: (element: HTMLElement, config: unknown) => void;
      prompt: () => void;
    };
  };
}

declare global {
  interface Window {
    google: GoogleIdentityServices;
  }
}


export default function LoginPage(){
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState(""); // New state for feedback messages
    const [isSuccess, setIsSuccess] = useState(false); // New state for message type (success/error)
    const [loading, setLoading] = useState(false); // New state for loading indicator
    const [showPassword, setShowPassword] = useState(false); // New state for password visibility

    const router = useRouter();

    const handleGoogleButtonClick = () => {
        setLoading(true);
        setMessage("");
        setIsSuccess(false);

        // Create the OAuth2 URL manually
        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const redirectUri = encodeURIComponent(`${getBaseUrl()}/auth/google/callback`);
        const scope = encodeURIComponent("openid email profile");
        const responseType = "code";
        const state = Math.random().toString(36).substring(2, 15);

        // Store state in sessionStorage for verification
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('oauth_state', state);
        }

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${googleClientId}&` +
            `redirect_uri=${redirectUri}&` +
            `response_type=${responseType}&` +
            `scope=${scope}&` +
            `state=${state}&` +
            `access_type=offline&` +
            `prompt=select_account`;

        
        // Redirect to Google OAuth
        safeRedirect(googleAuthUrl);
    };

    const checkUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(""); // Clear previous messages
        setIsSuccess(false);
        setLoading(true); // Set loading to true on form submission

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ username, password }),
            });


            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || "Login failed. Please check your credentials.");
                setIsSuccess(false);
            } else {
                setMessage(data.message || `Welcome back, ${username}! Redirecting...`);
                setIsSuccess(true);
                setTimeout(() => {
                    router.push("/dashboard");
                }, 2000); // Redirect after 2 seconds
            }
        } catch (error) {
            console.error("Login error:", error);
            setMessage("An unexpected error occurred. Please try again later.");
            setIsSuccess(false);
        } finally {
            setLoading(false); // Set loading to false after response or error
        }
    }



    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-orange-50/60 to-white px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-10 flex flex-col gap-6">
                {/* Tabs */}
                <div className="flex justify-center gap-6 mb-4 border-b border-gray-200 pb-2">
                    <Link href="/signup" className="text-lg font-semibold text-gray-400 hover:text-orange-500 transition">Sign-Up</Link>
                    <span className="text-lg font-bold text-gray-900 border-b-2 border-orange-500 pb-1">Log In</span>
                </div>
                {/* Social Buttons */}
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleGoogleButtonClick}
                        disabled={loading}
                        className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-lg py-2 font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        <FaGoogle className="text-lg" /> {loading ? "Signing in..." : "Sign in with Google"}
                    </button>
                </div>
                {/* Divider */}
                <div className="flex items-center gap-4 my-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-gray-400 font-semibold text-sm">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>
                {/* Form */}
                <form onSubmit={checkUser} className="flex flex-col gap-4">
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
                        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
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
                    <div className="text-right text-sm">
                        <Link href="/forgot-password" className="text-orange-600 hover:underline">
                            Forgot password?
                        </Link>
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
                        disabled={loading} // Disable button while loading
                    >
                        <span className="absolute inset-0 bg-orange-100 transition-transform duration-200 scale-x-0 group-hover:scale-x-100 origin-left rounded-full z-0"></span>
                        <span className="relative z-10 transition-colors duration-200 group-hover:text-black">
                            {loading ? "Signing In..." : "Sign In"} {/* Change button text based on loading */}
                        </span>
                    </button>
                </form>
                {/* Terms/Privacy */}
                <div className="text-xs text-gray-500 text-center mt-2">
                    By logging in, you agree to the <a href="#" className="underline hover:text-orange-500">Terms of Service</a> and <a href="#" className="underline hover:text-orange-500">Privacy Policy</a>.
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