"use client"

import { useState, useEffect } from "react"
import { getBaseUrl, safeRedirect } from "../../utils/url"

export default function TestGooglePage() {
    const [baseUrl, setBaseUrl] = useState<string>("")
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        // This runs only on the client side
        setIsClient(true)
        setBaseUrl(getBaseUrl())
    }, [])

    const testGoogleOAuth = () => {
        if (!isClient) return

        const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const redirectUri = encodeURIComponent(`${baseUrl}/auth/google/callback`);
        const scope = encodeURIComponent("openid email profile");
        
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${googleClientId}&` +
            `redirect_uri=${redirectUri}&` +
            `response_type=code&` +
            `scope=${scope}&` +
            `access_type=offline&` +
            `prompt=select_account`;

        safeRedirect(googleAuthUrl);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">Google OAuth Test</h1>
                <div className="mb-4">
                    <p><strong>Client ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}</p>
                    <p><strong>Redirect URI:</strong> {isClient ? `${baseUrl}/auth/google/callback` : 'Loading...'}</p>
                </div>
                <button 
                    onClick={testGoogleOAuth}
                    disabled={!isClient}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                    Test Google OAuth
                </button>
                <div className="mt-4 text-sm text-gray-600">
                    <p>If this fails with &quot;redirect_uri_mismatch&quot;, then the URI is not properly configured in Google Cloud Console.</p>
                </div>
            </div>
        </div>
    );
}