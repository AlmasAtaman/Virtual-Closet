"use client"

import Link from "next/link"
import Image from "next/image"
import { Logo } from "./Logo"
import { Upload, Palette, Heart, ArrowRight, Star } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type FAQItem = { q: string; a: string };
type FAQAccordionProps = { faqs: FAQItem[] };

export default function LandingPage() {
  const faqData = [
    {
      q: "How do I add clothes to my closet?",
      a: "You can upload an image or paste a product URL — we'll auto-fill the details and remove the background."
    },
    {
      q: "Does it recognize clothing types automatically?",
      a: "Yes! Our AI can detect and categorize clothing pieces to save you time."
    },
    {
      q: "Can I remove backgrounds from images?",
      a: "Yep — backgrounds are removed automatically when you upload, keeping your closet clean and aesthetic."
    },
    {
      q: "What's the difference between Closet and Wishlist?",
      a: "Closet is what you own. Wishlist is what you want."
    },
    {
      q: "Can I plan full outfits?",
      a: "Yes — you can mix and match clothing items to build and save complete outfits."
    },
    {
      q: "Can I edit or delete clothing items?",
      a: "Totally. You can change details, replace images, or remove items anytime."
    },
    {
      q: "Is it free to use?",
      a: "100% free to use — no subscription required."
    },
    {
      q: "Is my data and closet private?",
      a: "Yes — your closet is fully private unless you choose to share."
    },
    {
      q: "Can I access my closet from different devices?",
      a: "Definitely — just log in on any device to view or update your closet."
    },
    {
      q: "Do I need to label every field when uploading?",
      a: "No — only the name, type, and image are required. Everything else is optional."
    },
    {
      q: "Can I use it to track prices or purchases?",
      a: "You can manually add price info and notes for budgeting or reminders."
    },
    {
      q: "What if my clothing image isn't recognized correctly?",
      a: "You can manually edit and fix any incorrect details before uploading."
    },
    {
      q: "Can I use it just for wishlist shopping?",
      a: "Absolutely — many users track their dream pieces and style inspo here."
    }
  ];

  return (
    <div id="top" className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur">
        <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Left: Logo */}
          <Link href="#top" className="flex items-center gap-3 min-w-0 cursor-pointer">
            <Logo />
            <span className="text-xl font-bold truncate">VrC</span>
          </Link>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-base font-medium">
            <Link href="#features" className="hover:underline underline-offset-4 transition-colors">Features</Link>
            <Link href="#testimonials" className="hover:underline underline-offset-4 transition-colors">Testimonials</Link>
            <Link href="#about" className="hover:underline underline-offset-4 transition-colors">About</Link>
          </nav>

          {/* Right: Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <button className="relative overflow-hidden rounded-full px-6 py-2 font-semibold border border-black text-black transition-colors duration-200 group bg-white">
                <span className="absolute inset-0 bg-black transition-transform duration-200 scale-x-0 group-hover:scale-x-100 origin-left rounded-full z-0"></span>
                <span className="relative z-10 transition-colors duration-200 group-hover:text-white">Sign In</span>
              </button>
            </Link>
            <Link href="/signup">
              <button className="relative overflow-hidden rounded-full px-6 py-2 font-semibold border border-black text-white bg-black transition-colors duration-200 group">
                <span className="absolute inset-0 bg-orange-100 transition-transform duration-200 scale-x-0 group-hover:scale-x-100 origin-left rounded-full z-0"></span>
                <span className="relative z-10 transition-colors duration-200 group-hover:text-black">Get Started</span>
              </button>
            </Link>
          </div>

          {/* Mobile: Only logo is shown, nav/buttons hidden for now */}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-6 sm:py-10 md:py-14 lg:py-20 xl:py-24 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="grid gap-4 lg:grid-cols-[1fr_350px] lg:gap-8 xl:grid-cols-[1fr_420px] xl:gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col justify-center space-y-3 sm:space-y-4"
              >
                <div className="space-y-4">
                  <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900">
                    Every Outfit. One Place.
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="inline-block bg-orange-100 text-orange-600 font-extrabold text-2xl sm:text-3xl md:text-4xl px-4 py-1 rounded-lg shadow-sm uppercase tracking-wide mt-2 mb-2">
                      Only For Fashion Mandem
                    </span>
                  </div>
                  <p className="max-w-[600px] text-muted-foreground md:text-lg lg:text-xl">
                    Organize, style, and plan your outfits with ease.
                  </p>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row mt-4">
                    <Link href="/signup">
                      <Button size="lg" className="group">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="lg">
                      Learn More
                    </Button>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src="/hero.png"
                  width={340}
                  height={340}
                  alt="Virtual Closet App"
                  className="mx-auto aspect-square overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-20 bg-gradient-to-b from-orange-50/60 to-white">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="flex flex-col items-center text-center mb-14">
              <span className="text-sm font-semibold text-orange-500 tracking-widest mb-2">HOW IT WORKS</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">How Virtual Closet Works</h2>
              <p className="max-w-2xl text-muted-foreground text-lg">From upload to AI-powered style, see how easy it is to digitize and elevate your wardrobe.</p>
            </div>
            <div className="relative flex flex-col gap-8 md:flex-row md:gap-6 md:justify-between items-stretch w-full">
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-orange-100 z-0" style={{transform: 'translateY(-50%)'}} />
              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center bg-white rounded-2xl shadow-lg px-6 py-10 w-full md:w-1/4 mx-auto border border-orange-100">
                <span className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-orange-100 text-orange-600 font-bold text-xl">1</span>
                <div className="flex items-center justify-center mb-5">
                  <Upload className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-extrabold mb-2">Snap & Upload</h3>
                <p className="text-muted-foreground text-base">Quickly add your clothes with a photo or link. Your closet, digitized in seconds.</p>
              </div>
              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center bg-white rounded-2xl shadow-lg px-6 py-10 w-full md:w-1/4 mx-auto border border-orange-100">
                <span className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-orange-100 text-orange-600 font-bold text-xl">2</span>
                <div className="flex items-center justify-center mb-5">
                  <Palette className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-extrabold mb-2">AI Labels & Organizes</h3>
                <p className="text-muted-foreground text-base">Our AI tags, describes, and sorts your items—no manual entry, just magic.</p>
              </div>
              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center bg-white rounded-2xl shadow-lg px-6 py-10 w-full md:w-1/4 mx-auto border border-orange-100">
                <span className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-orange-100 text-orange-600 font-bold text-xl">3</span>
                <div className="flex items-center justify-center mb-5">
                  <Heart className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-extrabold mb-2">Add from Any Link</h3>
                <p className="text-muted-foreground text-base">Paste a URL to auto-import wishlist items—images and details included.</p>
              </div>
              {/* Step 4 */}
              <div className="relative z-10 flex flex-col items-center bg-white rounded-2xl shadow-lg px-6 py-10 w-full md:w-1/4 mx-auto border border-orange-100">
                <span className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-orange-100 text-orange-600 font-bold text-xl">4</span>
                <div className="flex items-center justify-center mb-5">
                  <Star className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-extrabold mb-2">Discover & Style</h3>
                <p className="text-muted-foreground text-base">Get AI outfit ideas and discover new ways to wear what you own.</p>
              </div>
            </div>
            {/* Get Started Button below steps */}
            <div className="flex justify-center mt-12">
              <Link href="/signup">
                <button className="relative overflow-hidden rounded-full px-8 py-3 font-semibold border border-black text-white bg-black transition-colors duration-200 group text-lg shadow-lg">
                  <span className="absolute inset-0 bg-orange-100 transition-transform duration-200 scale-x-0 group-hover:scale-x-100 origin-left rounded-full z-0"></span>
                  <span className="relative z-10 transition-colors duration-200 group-hover:text-black">Get Started</span>
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-8 md:py-14 lg:py-18 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="w-full max-w-none px-4 lg:px-6 xl:px-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">What Our Users Say</h2>
                <p className="max-w-[85%] mx-auto text-muted-foreground md:text-xl">
                  Join thousands of fashion enthusiasts who have transformed their style routine
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col justify-between rounded-lg border p-6 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="fill-yellow-500 h-5 w-5" />
                    <Star className="fill-yellow-500 h-5 w-5" />
                    <Star className="fill-yellow-500 h-5 w-5" />
                    <Star className="fill-yellow-500 h-5 w-5" />
                    <Star className="fill-yellow-500 h-5 w-5" />
                  </div>
                  <p className="text-muted-foreground italic">
                    &quot;Virtual Closet has completely changed how I plan my outfits. I save so much time in the morning and
                    always feel put together!&quot;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <Image
                    src="/placeholder.svg?height=40&width=40"
                    width={40}
                    height={40}
                    alt="User"
                    className="rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">Sophia Chen</p>
                    <p className="text-sm text-muted-foreground">Fashion Blogger</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col justify-between rounded-lg border p-6 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="fill-yellow-500 h-5 w-5" />
                    <Star className="fill-yellow-500 h-5 w-5" />
                    <Star className="fill-yellow-500 h-5 w-5" />
                    <Star className="fill-yellow-500 h-5 w-5" />
                    <Star className="fill-yellow-500 h-5 w-5" />
                  </div>
                  <p className="text-muted-foreground italic">
                    &quot;I&apos;ve stopped buying duplicate items since I can see my entire wardrobe at a glance. This app has
                    saved me money and closet space!&quot;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <Image
                    src="/placeholder.svg?height=40&width=40"
                    width={40}
                    height={40}
                    alt="User"
                    className="rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">Marcus Johnson</p>
                    <p className="text-sm text-muted-foreground">Product Designer</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col justify-between rounded-lg border p-6 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="fill-yellow-500 h-5 w-5" />
                    <Star className="fill-yellow-500 h-5 w-5" />
                    <Star className="fill-yellow-500 h-5 w-5" />
                    <Star className="fill-yellow-500 h-5 w-5" />
                    <Star className="h-5 w-5" />
                  </div>
                  <p className="text-muted-foreground italic">
                    &quot;The outfit planning feature is a game-changer for travel. I can pack exactly what I need and know
                    everything will coordinate perfectly.&quot;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <Image
                    src="/placeholder.svg?height=40&width=40"
                    width={40}
                    height={40}
                    alt="User"
                    className="rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">Olivia Taylor</p>
                    <p className="text-sm text-muted-foreground">Travel Enthusiast</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-14 md:py-20 bg-gradient-to-b from-white to-orange-50/60">
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="flex flex-col items-center text-center mb-10">
              <span className="text-sm font-semibold text-orange-500 tracking-widest mb-2">FAQ</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">Frequently Asked Questions</h2>
              <p className="max-w-2xl text-muted-foreground text-lg">Everything you need to know about Virtual Closet.</p>
            </div>
            <FAQAccordion faqs={faqData} />
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-8 md:py-14 lg:py-18 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="w-full max-w-none px-4 lg:px-6 xl:px-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to Transform Your Wardrobe?</h2>
                <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
                  Join Virtual Closet today and discover a new way to organize, style, and enjoy your clothes.
                </p>
              </div>
              <Link href="/signup">
                <Button size="lg" className="mt-4">
                  Get Started For Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="about" className="w-full border-t bg-gradient-to-r from-blue-50 to-purple-50 py-6 md:py-8">
        <div className="w-full max-w-none flex flex-col items-center justify-between gap-4 md:flex-row px-4 lg:px-6 xl:px-8">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <span className="text-lg font-semibold">Virtual Closet</span>
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-sm hover:underline underline-offset-4">
              About
            </Link>
            <Link href="#" className="text-sm hover:underline underline-offset-4">
              Contact
            </Link>
            <Link href="#" className="text-sm hover:underline underline-offset-4">
              GitHub
            </Link>
            <Link href="#" className="text-sm hover:underline underline-offset-4">
              Privacy Policy
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Virtual Closet. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const bgColors = ["bg-orange-50", "bg-blue-50"];
  return (
    <div className="space-y-4">
      {faqs.map((item: FAQItem, idx: number) => {
        const isOpen = openIdx === idx;
        return (
          <div key={idx}>
            <motion.button
              className={`w-full flex items-center justify-between text-left font-semibold text-lg md:text-xl px-6 py-4 border rounded-xl transition-all shadow-sm ${isOpen ? 'border-orange-300 bg-orange-50' : 'border-orange-100 bg-white hover:bg-orange-50/60'}`}
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              aria-expanded={isOpen}
              whileHover={{ scale: 1.02, boxShadow: "0 4px 24px 0 rgba(255, 186, 73, 0.08)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <span className="truncate">{item.q}</span>
              <span className={`ml-4 text-2xl font-bold transition-transform ${isOpen ? 'text-orange-500 rotate-45' : 'text-gray-400'}`}>{isOpen ? '–' : '+'}</span>
            </motion.button>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.25 }}
                className={`mt-2 mb-2 p-6 border rounded-xl shadow-md ${bgColors[idx % bgColors.length]} border-orange-200 animate-fade-in`}
              >
                <div className="font-bold text-lg md:text-xl mb-2 text-gray-900">{item.q}</div>
                <div className="text-base md:text-lg text-gray-700">{item.a}</div>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
