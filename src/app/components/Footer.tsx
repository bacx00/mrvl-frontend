// src/components/Footer.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ROUTES, SOCIAL_LINKS, BRAND } from '@/lib/constants';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsNewsletterSubmitting(true);
    
    try {
      // Newsletter subscription logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setNewsletterMessage('Thanks for subscribing!');
      setEmail('');
    } catch (error) {
      setNewsletterMessage('Something went wrong. Please try again.');
    } finally {
      setIsNewsletterSubmitting(false);
      setTimeout(() => setNewsletterMessage(''), 3000);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a2332] border-t border-[#2b3d4d] mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand & Newsletter */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <Link href={ROUTES.HOME} className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-[#fa4454] rounded flex items-center justify-center">
                  <span className="text-white font-black text-sm">M</span>
                </div>
                <span className="text-[#fa4454] font-bold text-xl">MRVL</span>
              </Link>
              <p className="text-[#768894] text-sm mb-4">
                {BRAND.TAGLINE}
              </p>
            </div>

            {/* Newsletter Signup */}
            <div className="mb-6">
              <h4 className="text-white text-sm font-semibold mb-3">Stay Updated</h4>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-[#0f1419] border border-[#2b3d4d] rounded-l-md px-3 py-2 text-white text-sm placeholder-[#768894] focus:outline-none focus:border-[#fa4454]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isNewsletterSubmitting}
                    className="px-4 py-2 bg-[#fa4454] hover:bg-[#e03e4e] text-white text-sm font-medium rounded-r-md transition-colors disabled:opacity-50"
                  >
                    {isNewsletterSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </div>
                {newsletterMessage && (
                  <p className={`text-xs ${newsletterMessage.includes('Thanks') ? 'text-[#4ade80]' : 'text-[#ef4444]'}`}>
                    {newsletterMessage}
                  </p>
                )}
              </form>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <SocialLink 
                href={SOCIAL_LINKS.TWITTER} 
                label="Twitter"
                icon={<TwitterIcon />}
              />
              <SocialLink 
                href={SOCIAL_LINKS.DISCORD} 
                label="Discord"
                icon={<DiscordIcon />}
              />
              <SocialLink 
                href={SOCIAL_LINKS.YOUTUBE} 
                label="YouTube"
                icon={<YouTubeIcon />}
              />
              <SocialLink 
                href={SOCIAL_LINKS.TWITCH} 
                label="Twitch"
                icon={<TwitchIcon />}
              />
            </div>
          </div>

          {/* Site Links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Site</h4>
            <ul className="space-y-2">
              <FooterLink href="/about">About MRVL.net</FooterLink>
              <FooterLink href="/contact">Contact Us</FooterLink>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/cookies">Cookie Policy</FooterLink>
              <FooterLink href="/advertise">Advertise</FooterLink>
            </ul>
          </div>

          {/* Content Links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Content</h4>
            <ul className="space-y-2">
              <FooterLink href={ROUTES.MATCHES}>Live Matches</FooterLink>
              <FooterLink href={ROUTES.EVENTS}>Tournaments</FooterLink>
              <FooterLink href={ROUTES.RANKINGS}>Team Rankings</FooterLink>
              <FooterLink href={ROUTES.STATS}>Statistics</FooterLink>
              <FooterLink href={ROUTES.NEWS}>Latest News</FooterLink>
              <FooterLink href="/calendar">Event Calendar</FooterLink>
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Community</h4>
            <ul className="space-y-2">
              <FooterLink href={ROUTES.FORUMS}>Discussion Forums</FooterLink>
              <FooterLink href="/forums/competitive">Competitive Talk</FooterLink>
              <FooterLink href="/forums/general">General Discussion</FooterLink>
              <FooterLink href="/leaderboards">Player Leaderboards</FooterLink>
              <FooterLink href="/tournaments/amateur">Amateur Tournaments</FooterLink>
              <FooterLink href="/guides">Strategy Guides</FooterLink>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2b3d4d] mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-[#768894] text-xs">
                © {currentYear} {BRAND.NAME}. All rights reserved.
              </p>
              <p className="text-[#768894] text-xs mt-1">
                Marvel Rivals and all related content © Marvel Entertainment, LLC & NetEase Games
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center md:justify-end items-center space-x-4 text-xs">
              <Link href="/sitemap" className="text-[#768894] hover:text-white transition-colors">
                Sitemap
              </Link>
              <Link href="/rss" className="text-[#768894] hover:text-white transition-colors">
                RSS Feed
              </Link>
              <Link href="/api-docs" className="text-[#768894] hover:text-white transition-colors">
                API Docs
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 pt-6 border-t border-[#2b3d4d] text-center">
            <p className="text-[#768894] text-xs leading-relaxed max-w-4xl mx-auto">
              <strong className="text-white">Disclaimer:</strong> {BRAND.NAME} is an independent fan-created website 
              dedicated to the Marvel Rivals esports community. We are not affiliated with, endorsed by, or 
              officially connected to Marvel Entertainment, LLC, NetEase Games, or any of their subsidiaries 
              or affiliates. All game content, characters, logos, and trademarks are the property of their 
              respective owners. Match data, statistics, and tournament information are provided for 
              informational and entertainment purposes only.
            </p>
          </div>

          {/* Performance & Status */}
          <div className="mt-4 text-center">
            <div className="flex justify-center items-center space-x-4 text-xs text-[#768894]">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-[#4ade80] rounded-full mr-1"></span>
                All Systems Operational
              </span>
              <span>•</span>
              <Link href="/status" className="hover:text-white transition-colors">
                System Status
              </Link>
              <span>•</span>
              <span>
                Made with ❤️ for the Marvel Rivals community
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Footer Link Component
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link 
        href={href} 
        className="text-[#768894] hover:text-white text-xs transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}

// Social Link Component
function SocialLink({ 
  href, 
  label, 
  icon 
}: { 
  href: string; 
  label: string; 
  icon: React.ReactNode; 
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#768894] hover:text-white transition-colors p-2 hover:bg-[#20303d] rounded"
      aria-label={label}
    >
      {icon}
    </a>
  );
}

// Social Media Icons
function TwitterIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function TwitchIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
    </svg>
  );
}
