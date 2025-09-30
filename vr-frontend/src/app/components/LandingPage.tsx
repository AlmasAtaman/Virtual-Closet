"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Palette, Star, ChevronDown, Sparkles, TrendingUp, Camera, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";

// Logo component
function Logo() {
  return (
    <Image
      src="/VestkoBlack.png"
      alt="Vestko Logo"
      width={120}
      height={40}
      className="h-10 w-auto"
    />
  );
}

interface FAQItem {
  q: string;
  a: string;
}

interface FAQAccordionProps {
  faqs: FAQItem[];
}

export default function LandingPage() {
  const faqs = [
    {
      q: "How does the AI outfit recommendation work?",
      a: "Our AI analyzes your wardrobe, considers weather conditions, and learns from your style preferences to suggest perfect outfits for any occasion."
    },
    {
      q: "Do I need to manually add all my clothes?",
      a: "No — simply take photos of your items and our AI will automatically categorize, tag, and organize them for you."
    },
    {
      q: "Can I use it to track prices or purchases?",
      a: "You can manually add price info and notes for budgeting, shopping lists, and wardrobe planning."
    },
    {
      q: "What if my clothing image isn't recognized correctly?",
      a: "You can easily edit and fix any incorrect details. The AI gets better over time as it learns from your corrections."
    },
    {
      q: "Can I use it for outfit planning and wishlist?",
      a: "Absolutely — plan outfits in advance, create wishlists, and track your dream pieces and style inspiration."
    }
  ];

  return (
    <div id="top" className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-white/60" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
        <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Left: Logo */}
          <Link href="#top" className="flex items-center min-w-0 cursor-pointer">
            <Logo />
          </Link>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-base font-medium">
            <Link href="#features" style={{ color: '#6b7280' }} className="hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#testimonials" style={{ color: '#6b7280' }} className="hover:text-blue-600 transition-colors">Testimonials</Link>
            <Link href="#faq" style={{ color: '#6b7280' }} className="hover:text-blue-600 transition-colors">FAQ</Link>
          </nav>

          {/* Right: Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <button 
                className="font-semibold px-4 py-2 rounded-md transition-colors"
                style={{ 
                  color: '#374151',
                  backgroundColor: 'transparent'
                }}
              >
                Sign In
              </button>
            </Link>
            <Link href="/signup">
              <button 
                className="font-semibold text-white border-0 px-4 py-2 rounded-md transition-colors"
                style={{ 
                  background: '#1e40af',
                  color: 'white'
                }}
              >
                Get Started
              </button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Link href="/signup">
              <button 
                className="px-3 py-1 text-sm rounded-md"
                style={{ background: '#1e40af', color: 'white' }}
              >
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48" style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%)' }}>
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            {/* Hero Text - Centered */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-6 mb-16"
            >
              <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none max-w-4xl" style={{ color: '#111827' }}>
                Your{" "}
                <span style={{ color: '#1e40af' }}>
                  AI-Powered
                </span>{" "}
                Style Assistant
              </h1>
              <p className="max-w-3xl text-xl md:text-2xl" style={{ color: '#6b7280' }}>
                Transform your wardrobe into a smart, organized digital closet. Get personalized outfit recommendations, track your style, and never wonder &quot;what to wear&quot; again.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/signup">
                  <button 
                    className="text-xl px-10 py-5 rounded-full text-white border-0 transition-all hover:shadow-lg hover:scale-105"
                    style={{ 
                      background: '#1e40af',
                      color: 'white'
                    }}
                  >
                    Get Started Free
                  </button>
                </Link>
                <button 
                  className="text-xl px-10 py-5 rounded-full border-2 transition-all hover:shadow-lg hover:scale-105"
                  style={{ 
                    borderColor: '#d1d5db',
                    color: '#374151',
                    backgroundColor: 'white'
                  }}
                >
                  Watch Demo
                </button>
              </div>
            </motion.div>

            {/* Desktop Computer Mockup - Below Text */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              className="flex justify-center"
            >
              <div className="relative">
                {/* Large Desktop Monitor */}
                <div className="w-[800px] h-[500px] rounded-2xl shadow-2xl" style={{ backgroundColor: '#1f2937' }}>
                  {/* Monitor bezel */}
                  <div className="w-full h-full p-4 rounded-2xl" style={{ backgroundColor: '#374151' }}>
                    {/* Screen */}
                    <div className="w-full h-full rounded-xl overflow-hidden relative" style={{ backgroundColor: '#ffffff' }}>
                      {/* Desktop App Header */}
                      <div className="h-12 flex items-center px-6 gap-3" style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                        <div className="flex gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="text-sm font-semibold" style={{ color: '#374151' }}>VirtualCloset - Your Digital Wardrobe</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded bg-gray-200"></div>
                          <div className="w-6 h-6 rounded bg-gray-200"></div>
                        </div>
                      </div>
                      
                      {/* App Content */}
                      <div className="p-8 h-full">
                        <div className="grid grid-cols-3 gap-8 h-full">
                          {/* Left Panel - Today's Outfit */}
                          <div className="space-y-6">
                            <div className="text-center">
                              <h3 className="font-bold text-2xl mb-2" style={{ color: '#111827' }}>Today&apos;s Outfit</h3>
                              <p className="text-sm" style={{ color: '#6b7280' }}>Perfect for 72°F sunny weather</p>
                            </div>
                            
                            <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' }}>
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="aspect-square rounded-xl" style={{ background: '#1e40af' }}></div>
                                <div className="aspect-square rounded-xl" style={{ background: '#374151' }}></div>
                                <div className="aspect-square rounded-xl" style={{ background: '#ffffff', border: '3px solid #e5e7eb' }}></div>
                              </div>
                              <p className="text-sm font-semibold" style={{ color: '#111827' }}>Blue Shirt • Dark Jeans • White Sneakers</p>
                            </div>
                          </div>
                          
                          {/* Center Panel - Wardrobe Grid */}
                          <div className="space-y-4">
                            <h3 className="font-bold text-lg" style={{ color: '#111827' }}>Your Wardrobe</h3>
                            <div className="grid grid-cols-4 gap-3">
                              <div className="aspect-square rounded-lg" style={{ background: '#3b82f6' }}></div>
                              <div className="aspect-square rounded-lg" style={{ background: '#ef4444' }}></div>
                              <div className="aspect-square rounded-lg" style={{ background: '#10b981' }}></div>
                              <div className="aspect-square rounded-lg" style={{ background: '#f59e0b' }}></div>
                              <div className="aspect-square rounded-lg" style={{ background: '#8b5cf6' }}></div>
                              <div className="aspect-square rounded-lg" style={{ background: '#ec4899' }}></div>
                              <div className="aspect-square rounded-lg" style={{ background: '#6b7280' }}></div>
                              <div className="aspect-square rounded-lg" style={{ background: '#14b8a6' }}></div>
                            </div>
                          </div>
                          
                          {/* Right Panel - AI Features */}
                          <div className="space-y-4">
                            <h3 className="font-bold text-lg" style={{ color: '#111827' }}>AI Features</h3>
                            <div className="space-y-3">
                              <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#fff7ed' }}>
                                <Sparkles className="h-5 w-5" style={{ color: '#ea580c' }} />
                                <span className="text-sm font-medium" style={{ color: '#111827' }}>Smart Suggestions</span>
                              </div>
                              <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#f0fdf4' }}>
                                <Cloud className="h-5 w-5" style={{ color: '#16a34a' }} />
                                <span className="text-sm font-medium" style={{ color: '#111827' }}>Weather Sync</span>
                              </div>
                              <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#eff6ff' }}>
                                <Camera className="h-5 w-5" style={{ color: '#2563eb' }} />
                                <span className="text-sm font-medium" style={{ color: '#111827' }}>Auto Organization</span>
                              </div>
                              <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#fdf4ff' }}>
                                <TrendingUp className="h-5 w-5" style={{ color: '#a855f7' }} />
                                <span className="text-sm font-medium" style={{ color: '#111827' }}>Style Analytics</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Monitor Stand */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className="w-20 h-6 rounded-b-xl" style={{ backgroundColor: '#374151' }}></div>
                  <div className="w-32 h-3 mt-2 rounded-full mx-auto" style={{ backgroundColor: '#6b7280' }}></div>
                </div>
                
                {/* Floating Elements */}
                <motion.div
                  className="absolute -bottom-12 -right-6 px-4 py-2 rounded-full text-sm font-bold shadow-lg"
                  style={{ backgroundColor: '#1e40af', color: 'white' }}
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                >
                  AI-Powered Style
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32" style={{ backgroundColor: '#ffffff' }}>
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl" style={{ color: '#111827' }}>
                  Everything You Need for Perfect Style
                </h2>
                <p className="max-w-[900px] text-xl md:text-2xl" style={{ color: '#6b7280' }}>
                  Powered by advanced AI, VirtualCloset helps you make the most of your wardrobe with intelligent recommendations and seamless organization.
                </p>
              </div>
            </div>

            {/* Demo Video Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-20"
            >
              <div className="relative max-w-4xl mx-auto">
                {/* Video Placeholder */}
                <div 
                  className="w-full h-[400px] rounded-3xl shadow-2xl flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1' }}
                >
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: '#1e40af' }}>
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold" style={{ color: '#374151' }}>Demo Video Coming Soon</h3>
                      <p className="text-sm" style={{ color: '#9ca3af' }}>Watch VirtualCloset in action</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Features Grid - Cluely Style */}
            <div className="grid gap-8 md:gap-12 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#1e40af' }}>
                      <Sparkles className="h-8 w-8" style={{ color: 'white' }} />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold" style={{ color: '#111827' }}>
                      Smart Wardrobe Organization
                    </h3>
                    <p className="text-lg leading-relaxed" style={{ color: '#6b7280' }}>
                      Automatically categorize and tag your clothes. Our AI recognizes colors, styles, and occasions to keep everything perfectly organized.
                    </p>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ backgroundColor: '#1e40af' }}></div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#1e40af' }}>
                      <TrendingUp className="h-8 w-8" style={{ color: 'white' }} />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold" style={{ color: '#111827' }}>
                      AI Outfit Recommendations
                    </h3>
                    <p className="text-lg leading-relaxed" style={{ color: '#6b7280' }}>
                      Get personalized outfit suggestions based on weather, occasion, and your style preferences. Never have a "nothing to wear" moment again.
                    </p>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ backgroundColor: '#1e40af' }}></div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#1e40af' }}>
                      <Cloud className="h-8 w-8" style={{ color: 'white' }} />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold" style={{ color: '#111827' }}>
                      Weather Integration
                    </h3>
                    <p className="text-lg leading-relaxed" style={{ color: '#6b7280' }}>
                      Outfit suggestions automatically adjust based on real-time weather data, ensuring you're always dressed appropriately.
                    </p>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300" style={{ backgroundColor: '#1e40af' }}></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)' }}>
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl" style={{ color: '#111827' }}>
                  Loved by Fashion Enthusiasts
                </h2>
                <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed" style={{ color: '#6b7280' }}>
                  See what our users are saying about their VirtualCloset experience.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col justify-between rounded-lg border p-6 shadow-sm"
                style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                  </div>
                  <p className="italic" style={{ color: '#6b7280' }}>
                    &quot;VirtualCloset completely changed how I approach getting dressed. The AI recommendations are spot-on and I&apos;ve discovered so many new outfit combinations!&quot;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: '#ec4899' }}>
                    S
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#111827' }}>Sarah Chen</p>
                    <p className="text-sm" style={{ color: '#6b7280' }}>Fashion Blogger</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col justify-between rounded-lg border p-6 shadow-sm"
                style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                  </div>
                  <p className="italic" style={{ color: '#6b7280' }}>
                    &quot;As someone who travels frequently, the weather-based outfit suggestions have been a game-changer. This app has saved me money and closet space!&quot;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: '#3b82f6' }}>
                    M
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#111827' }}>Marcus Johnson</p>
                    <p className="text-sm" style={{ color: '#6b7280' }}>Product Designer</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex flex-col justify-between rounded-lg border p-6 shadow-sm"
                style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <Star className="h-5 w-5" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <Star className="h-5 w-5" style={{ color: '#d1d5db' }} />
                  </div>
                  <p className="italic" style={{ color: '#6b7280' }}>
                    &quot;The outfit planning feature is perfect for busy mornings. I can plan my whole week&apos;s outfits in advance and never stress about what to wear.&quot;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: '#10b981' }}>
                    A
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#111827' }}>Alex Rivera</p>
                    <p className="text-sm" style={{ color: '#6b7280' }}>Marketing Manager</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-12 md:py-24 lg:py-32" style={{ backgroundColor: '#ffffff' }}>
          <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl" style={{ color: '#111827' }}>
                  Frequently Asked Questions
                </h2>
                <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed" style={{ color: '#6b7280' }}>
                  Everything you need to know about VirtualCloset.
                </p>
              </div>
            </div>
            <div className="mx-auto py-12">
              <FAQAccordion faqs={faqs} />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-8" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
        <div className="w-full max-w-none flex flex-col items-center justify-between gap-4 md:flex-row px-4 lg:px-6 xl:px-8">
          <div className="flex items-center">
            <Logo />
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-sm transition-colors" style={{ color: '#6b7280' }}>
              About
            </Link>
            <Link href="#" className="text-sm transition-colors" style={{ color: '#6b7280' }}>
              Contact
            </Link>
            <Link href="#" className="text-sm transition-colors" style={{ color: '#6b7280' }}>
              GitHub
            </Link>
            <Link href="#" className="text-sm transition-colors" style={{ color: '#6b7280' }}>
              Privacy Policy
            </Link>
          </nav>
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            &copy; {new Date().getFullYear()} VirtualCloset. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  
  return (
    <div className="space-y-4">
      {faqs.map((item: FAQItem, idx: number) => {
        const isOpen = openIdx === idx;
        return (
          <motion.div
            key={idx}
            initial={false}
            animate={{ backgroundColor: isOpen ? "#eff6ff" : "#ffffff" }}
            className="border rounded-lg overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            <motion.button
              className="w-full flex items-center justify-between text-left font-semibold text-lg px-6 py-4 transition-colors"
              style={{ 
                backgroundColor: isOpen ? '#eff6ff' : 'white',
                color: '#111827'
              }}
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              aria-expanded={isOpen}
            >
              <span>{item.q}</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-5 w-5" style={{ color: '#6b7280' }} />
              </motion.div>
            </motion.button>
            <motion.div
              initial={false}
              animate={{
                height: isOpen ? "auto" : 0,
                opacity: isOpen ? 1 : 0
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-4" style={{ color: '#6b7280' }}>
                {item.a}
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}