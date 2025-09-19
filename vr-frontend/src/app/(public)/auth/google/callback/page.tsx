"use client"

import { useEffect, useState } from "react";
import { getBaseUrl } from "../../../utils/url";
import { useRouter, useSearchParams } from "next/navigation";

export default function GoogleCallbackPage() {
    const [message, setMessage] = useState("Processing Google sign-in...");
    const [isError, setIsError] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleGoogleCallback = async () => {
            try {
                const code = searchParams.get('code');
                const state = searchParams.get('state');
                const error = searchParams.get('error');

                // Check for OAuth errors
                if (error) {
                    setMessage(`Google sign-in failed: ${error}`);
                    setIsError(true);
                    setTimeout(() => router.push('/login'), 3000);
                    return;
                }

                // Verify state parameter
                const storedState = sessionStorage.getItem('oauth_state');
                if (!state || state !== storedState) {
                    setMessage("Invalid OAuth state. Please try again.");
                    setIsError(true);
                    setTimeout(() => router.push('/login'), 3000);
                    return;
                }

                // Clear stored state
                sessionStorage.removeItem('oauth_state');

                if (!code) {
                    setMessage("No authorization code received. Please try again.");
                    setIsError(true);
                    setTimeout(() => router.push('/login'), 3000);
                    return;
                }

                // Exchange code for user info via our backend
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/callback`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ 
                        code,
                        redirect_uri: `${getBaseUrl()}/auth/google/callback`
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    setMessage(data.message || "Google sign-in failed. Please try again.");
                    setIsError(true);
                    setTimeout(() => router.push('/login'), 3000);
                    return;
                }

                // Success!
                setMessage("Google sign-in successful! Redirecting to dashboard...");
                setIsError(false);
                setTimeout(() => router.push('/dashboard'), 2000);

            } catch (error) {
                console.error("Google callback error:", error);
                setMessage("An unexpected error occurred. Please try again.");
                setIsError(true);
                setTimeout(() => router.push('/login'), 3000);
            }
        };

        handleGoogleCallback();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50/60 to-white">
            <div className="text-center p-8">
                <div className="mb-4">
                    {!isError ? (
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    ) : (
                        <div className="text-red-500 text-6xl">⚠️</div>
                    )}
                </div>
                <h1 className="text-xl font-semibold mb-2">
                    {isError ? "Sign-in Failed" : "Signing In..."}
                </h1>
                <p className={`text-sm ${isError ? "text-red-600" : "text-gray-600"}`}>
                    {message}
                </p>
            </div>
        </div>
    );
}