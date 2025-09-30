"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, ChevronDown, ShirtIcon } from "lucide-react";

// Logo component
function Logo({ isDark = false, withText = false }: { isDark?: boolean; withText?: boolean }) {
  if (withText) {
    return (
      <div className="flex items-center gap-2.5">
        <Image
          src={isDark ? "/VestkoWhite.png" : "/VestkoBlack.png"}
          alt="Vestko"
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
        <div className="h-6 w-px" style={{ backgroundColor: isDark ? '#6b6b6b' : '#d0d0d0' }}></div>
        <span className="text-lg font-normal" style={{ color: isDark ? 'white' : '#1a1a1a' }}>Vestko</span>
      </div>
    );
  }

  return (
    <Image
      src={isDark ? "/VestkoWhite.png" : "/VestkoBlack.png"}
      alt="Vestko Logo"
      width={120}
      height={40}
      className="h-10 w-auto object-contain"
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
      q: "How does AI labelling work?",
      a: "Our AI automatically recognizes clothing items from photos and categorizes them by type, color, brand, and style, making organization effortless."
    },
    {
      q: "Do I need to manually add all my clothes?",
      a: "No, simply take photos of your items and our AI will automatically categorize, tag, and organize them for you."
    },
    {
      q: "Can I use it to track prices or purchases?",
      a: "Yes, you can manually add price information and notes for budgeting, shopping lists, and wardrobe planning."
    },
    {
      q: "What if my clothing image isn't recongized correctly?",
      a: "You can easily edit and fix any incorrect details. The AI gets better over time as it learns from your corrections."
    },
    {
      q: "Can I use it for outfit planning and wishlist?",
      a: "Absolutely, plan outfits in advance, create wishlists, and track your dream pieces and style inspiration."
    }
  ];

  return (
    <div id="top" className="flex min-h-screen flex-col" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur border-b" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#e8e8e8' }}>
        <div className="max-w-[1400px] mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
          {/* Left: Logo */}
          <Link href="#top" className="flex items-center cursor-pointer">
            <Logo withText={true} />
          </Link>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link
              href="#about"
              style={{ color: '#6b6b6b' }}
              className="relative hover:text-black transition-colors group"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full" style={{ bottom: '-4px' }}></span>
            </Link>
            <Link
              href="#features"
              style={{ color: '#6b6b6b' }}
              className="relative hover:text-black transition-colors group"
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full" style={{ bottom: '-4px' }}></span>
            </Link>
            <Link
              href="#faq"
              style={{ color: '#6b6b6b' }}
              className="relative hover:text-black transition-colors group"
            >
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full" style={{ bottom: '-4px' }}></span>
            </Link>
          </nav>

          {/* Right: Sign Up button */}
          <div className="flex items-center">
            <Link href="/signup">
              <button
                className="px-5 py-2 rounded-full text-sm transition-all hover:scale-105"
                style={{
                  border: '1px solid #d0d0d0',
                  color: '#1a1a1a',
                  backgroundColor: 'white'
                }}
              >
                Sign Up →
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-28 lg:py-36 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 50%, #ececec 100%)' }}>
          {/* Floating clothing items background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Top left - shirt icon */}
            <motion.div
              className="absolute opacity-[0.05]"
              style={{ top: '10%', left: '8%' }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <ShirtIcon className="w-32 h-32" style={{ color: '#2b2b2b' }} />
            </motion.div>

            {/* Top right - hanger */}
            <motion.div
              className="absolute opacity-[0.06]"
              style={{ top: '15%', right: '12%' }}
              animate={{
                y: [0, 15, 0],
                rotate: [0, -3, 0]
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <svg className="w-28 h-28" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2b2b2b' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10" />
              </svg>
            </motion.div>

            {/* Bottom left - tag */}
            <motion.div
              className="absolute opacity-[0.07]"
              style={{ bottom: '20%', left: '15%' }}
              animate={{
                y: [0, -12, 0],
                rotate: [0, 8, 0]
              }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2b2b2b' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </motion.div>

            {/* Bottom right - shopping bag */}
            <motion.div
              className="absolute opacity-[0.06]"
              style={{ bottom: '15%', right: '10%' }}
              animate={{
                y: [0, 18, 0],
                rotate: [0, -5, 0]
              }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <svg className="w-30 h-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2b2b2b' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </motion.div>

            {/* Center scattered items */}
            <motion.div
              className="absolute opacity-[0.05]"
              style={{ top: '40%', left: '5%' }}
              animate={{
                y: [0, -10, 0],
                x: [0, 5, 0]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2b2b2b' }}>
                <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
              </svg>
            </motion.div>

            <motion.div
              className="absolute opacity-[0.05]"
              style={{ top: '35%', right: '8%' }}
              animate={{
                y: [0, 12, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
            >
              <ShirtIcon className="w-24 h-24" style={{ color: '#2b2b2b' }} />
            </motion.div>
          </div>

          <div className="max-w-[900px] mx-auto px-8 lg:px-12 relative z-10">
            {/* Hero Text - Centered */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                <span style={{ color: '#b0b0b0' }}>Your Style,</span>
                <br />
                <span style={{ color: '#2b2b2b' }}>Digitized</span>
              </h1>
              <p className="max-w-xl text-base sm:text-lg md:text-xl leading-relaxed" style={{ color: '#5a5a5a' }}>
                Vestko is a digital closet that organizes your clothes and shows you endless outfit combinations instantly.
              </p>

              <div className="pt-4">
                <Link href="/signup">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 rounded-full text-base font-medium transition-all shadow-lg"
                    style={{
                      backgroundColor: '#2b2b2b',
                      color: 'white'
                    }}
                  >
                    Start Now →
                  </motion.button>
                </Link>
              </div>
            </motion.div>

          </div>
        </section>

        {/* Outfit Creation Screenshot Section */}
        <section id="about" className="w-full py-24 md:py-32" style={{ backgroundColor: '#f5f5f5' }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center" style={{ color: '#2b2b2b' }}>
                Create And Save All Your Outfits!
              </h2>

              {/* Video with hover effect */}
              <div className="flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-xl cursor-pointer"
                  style={{ backgroundColor: '#a0a0a0' }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto"
                  >
                    <source src="/VestkoCreateSaveOutfitVid.mp4" type="video/mp4" />
                  </video>
                </motion.div>
              </div>

              {/* Subtitle text */}
              <p className="text-center text-lg md:text-xl max-w-3xl mx-auto" style={{ color: '#5a5a5a' }}>
                Vestko helps you make the most of your wardrobe with intelligent recommendations and seamless organization.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Smart Wardrobe Organization Section */}
        <section id="features" className="w-full py-24 md:py-32" style={{ backgroundColor: '#ffffff' }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center"
            >
              {/* Image */}
              <div className="relative rounded-3xl overflow-hidden">
                <Image
                  src="/organizeClothes.png"
                  alt="Smart Wardrobe Organization"
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Content */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <ShirtIcon className="h-6 w-6" style={{ color: '#2b2b2b' }} />
                  <span className="text-base" style={{ color: '#6b6b6b' }}>The Perfect Outfit, Anywhere</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold" style={{ color: '#2b2b2b' }}>
                  Smart Wardrobe Organization
                </h2>
                <p className="text-lg md:text-xl leading-relaxed" style={{ color: '#4a4a4a' }}>
                  Automatically categorize and tag you clothes. Our AI recognizes colors, styles, and occasions to keep everything perfectly organized.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Outfit Creation Section */}
        <section className="w-full py-24 md:py-32" style={{ backgroundColor: '#f5f5f5' }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center"
            >
              {/* Content */}
              <div className="space-y-6 md:order-1">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2b2b2b' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-base" style={{ color: '#6b6b6b' }}>An outfit for everyday!</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold" style={{ color: '#2b2b2b' }}>
                  Outfit Creation
                </h2>
                <p className="text-lg md:text-xl leading-relaxed" style={{ color: '#4a4a4a' }}>
                  Create and Save your outfits straight on your computer!
                </p>
              </div>

              {/* Video - outfit creation */}
              <div className="relative md:order-2">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto object-contain rounded-2xl"
                >
                  <source src="/OutfitCreationVid.mp4" type="video/mp4" />
                </video>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Organize Your Outfits Section */}
        <section className="w-full py-24 md:py-32" style={{ backgroundColor: '#ffffff' }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center"
            >
              {/* Lifestyle Image */}
              <div className="relative rounded-3xl overflow-hidden">
                <Image
                  src="/SmartWardrobeOrganization.png"
                  alt="Organize Your Outfits"
                  width={600}
                  height={700}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Content */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#2b2b2b' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span className="text-base" style={{ color: '#6b6b6b' }}>Something for every Occasion</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold" style={{ color: '#2b2b2b' }}>
                  Organize Your Outfits
                </h2>
                <p className="text-lg md:text-xl leading-relaxed" style={{ color: '#4a4a4a' }}>
                  Create Various Occasion folders where you can play and organize your outfits!
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-24 md:py-32" style={{ backgroundColor: '#f5f5f5' }}>
          <div className="max-w-[1200px] mx-auto px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-16"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b6b6b' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span className="text-base" style={{ color: '#6b6b6b' }}>Why us?</span>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold" style={{ color: '#2b2b2b' }}>
                  Loved by People around The World,
                </h2>
              </div>

              {/* Testimonials Grid */}
              <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex flex-col space-y-6"
                >
                  <div className="flex gap-1">
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                  </div>
                  <p className="text-lg leading-relaxed font-serif italic" style={{ color: '#2b2b2b' }}>
                    "No more 'I have nothing to wear' moments when I can literally see my entire closet on one screen."
                  </p>
                  <div className="flex items-center gap-4">
                    <Image
                      src="/reviewPic1.jpg"
                      alt="Kevin Yashar Alim"
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium" style={{ color: '#2b2b2b' }}>Kevin Yashar Alim</p>
                      <p className="text-sm" style={{ color: '#6b6b6b' }}>Sydney, Australia</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="flex flex-col space-y-6"
                >
                  <div className="flex gap-1">
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                  </div>
                  <p className="text-lg leading-relaxed font-serif italic" style={{ color: '#2b2b2b' }}>
                    "The outfit combination feature is brilliant. I've discovered so many new looks from clothes I already own."
                  </p>
                  <div className="flex items-center gap-4">
                    <Image
                      src="/reviewPic2.jpg"
                      alt="Wedat Abdurixit"
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium" style={{ color: '#2b2b2b' }}>Wedat Abdurixit</p>
                      <p className="text-sm" style={{ color: '#6b6b6b' }}>Bern, Switzerland</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="flex flex-col space-y-6"
                >
                  <div className="flex gap-1">
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                    <Star className="h-8 w-8" style={{ fill: '#FFD700', color: '#FFD700' }} />
                  </div>
                  <p className="text-lg leading-relaxed font-serif italic" style={{ color: '#2b2b2b' }}>
                    "I love keeping my Wishlist right next my actual closet. It helps me make smarter shopping decisions."
                  </p>
                  <div className="flex items-center gap-4">
                    <Image
                      src="/reviewPic3.jpg"
                      alt="Aykut Yunusoglu"
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium" style={{ color: '#2b2b2b' }}>Aykut Yunusoglu</p>
                      <p className="text-sm" style={{ color: '#6b6b6b' }}>Indiana, America</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-24 md:py-32" style={{ backgroundColor: '#ffffff' }}>
          <div className="max-w-[1000px] mx-auto px-8 lg:px-12">
            <div className="grid md:grid-cols-[350px_1fr] gap-12 lg:gap-20">
              {/* Left - Title */}
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: '#2b2b2b' }}>
                  About Vestko
                </h2>
              </div>

              {/* Right - FAQ Items */}
              <div>
                <FAQAccordion faqs={faqs} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* CTA Section */}
      <section className="w-full py-20 md:py-28" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-[1200px] mx-auto px-8 lg:px-12 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold" style={{ color: '#2b2b2b' }}>
              Try out Vestko now!
            </h2>
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-full text-base font-medium transition-all"
                style={{
                  backgroundColor: '#2b2b2b',
                  color: 'white'
                }}
              >
                Start Now →
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 md:py-16" style={{ backgroundColor: '#2b2b2b' }}>
        <div className="max-w-[1200px] mx-auto px-8 lg:px-12">
          <div className="grid md:grid-cols-[1fr_auto_auto] gap-12 md:gap-20">
            {/* Logo and Tagline */}
            <div className="space-y-3">
              <Logo isDark={true} />
              <p className="text-sm" style={{ color: '#a0a0a0' }}>
                The Perfect Outfit, Anywhere
              </p>
            </div>

            {/* Company Links */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold" style={{ color: 'white' }}>Company</h4>
              <nav className="flex flex-col gap-2">
                <Link href="mailto:contact@vestko.com" className="text-sm transition-colors hover:text-white" style={{ color: '#a0a0a0' }}>
                  Email
                </Link>
              </nav>
            </div>

            {/* Social Media */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold" style={{ color: 'white' }}>Social Media</h4>
              <nav className="flex flex-col gap-2">
                <Link href="https://www.instagram.com/vestko.clo/" target="_blank" rel="noopener noreferrer" className="text-sm transition-colors hover:text-white" style={{ color: '#a0a0a0' }}>
                  Instagram
                </Link>
                <Link href="https://www.linkedin.com/company/vestko/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="text-sm transition-colors hover:text-white" style={{ color: '#a0a0a0' }}>
                  Linkedin
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-1">
      {faqs.map((item: FAQItem, idx: number) => {
        const isOpen = openIdx === idx;
        return (
          <motion.div
            key={idx}
            initial={false}
            className="border-b overflow-hidden"
            style={{ borderColor: '#e5e7eb' }}
          >
            <motion.button
              className="w-full flex items-center justify-between text-left py-6 transition-colors group"
              style={{
                color: '#2b2b2b'
              }}
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              aria-expanded={isOpen}
            >
              <span className="text-lg md:text-xl font-normal pr-8">{item.q}</span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="h-6 w-6" style={{ color: '#6b6b6b' }} />
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
              <div className="pb-6 pr-12 text-base md:text-lg leading-relaxed" style={{ color: '#6b6b6b' }}>
                {item.a}
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}