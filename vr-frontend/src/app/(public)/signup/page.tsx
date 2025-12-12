"use client"

import Link from "next/link";
import Image from "next/image";


export default function SignUp(){
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-white px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-10 flex flex-col gap-6 text-center">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                    <Image
                        src="/VestkoBlack.png"
                        alt="Vestko Logo"
                        width={180}
                        height={60}
                        className="object-contain"
                        priority
                    />
                </div>

                {/* Main Message */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Testing Currently Closed
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        We&apos;re not accepting new signups at this moment. Please check back soon!
                    </p>
                </div>

                {/* Decorative divider */}
                <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-gray-400 text-sm">•</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Back to Home Button */}
                <div className="flex justify-center mt-4">
                    <Link href="/" className="inline-block w-full">
                        <button className="w-full rounded-full border border-black bg-black px-8 py-3 text-white font-semibold shadow-lg hover:bg-gray-800 transition-colors duration-200 text-lg">
                            Back to Home
                        </button>
                    </Link>
                </div>

                {/* Additional Info */}
                <div className="text-xs text-gray-500 mt-2">
                    Already have an account? <Link href="/login" className="underline hover:text-black font-semibold">Log In</Link>
                </div>
            </div>
        </div>
    );
}