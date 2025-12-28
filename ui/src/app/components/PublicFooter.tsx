'use client';

import Link from 'next/link';
import Icon, { 
  faTruck, 
  faMapMarkerAlt, 
  faPhone, 
  faEnvelope, 
  faGlobe,
  faFacebook,
  faTwitter,
  faInstagram,
  faLinkedin,
  faYoutube,
  faWhatsapp
} from './Icon';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
          {/* Brand & Description */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-5">
              <Icon icon={faTruck} className="text-primary" size="2x" />
              <span className="text-2xl font-bold text-white">TumaNow</span>
            </Link>
            <p className="text-sm text-gray-400 mb-6 max-w-md leading-relaxed">
              Fast, reliable, and secure courier and delivery services across Rwanda. 
              Connect with multiple logistics operators on one unified platform. 
              Track your packages in real-time and experience seamless delivery.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2.5 mb-6">
              <div className="flex items-center gap-3">
                <Icon icon={faPhone} className="text-primary" size="sm" />
                <a href="tel:+250788123456" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  +250 788 123 456
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Icon icon={faEnvelope} className="text-primary" size="sm" />
                <a href="mailto:info@tumanow.rw" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  info@tumanow.rw
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Icon icon={faMapMarkerAlt} className="text-primary mt-0.5" size="sm" />
                <div className="text-sm text-gray-400">
                  KG 7 Ave, Kigali, Rwanda
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Follow Us</h4>
              <div className="flex items-center gap-3">
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon icon={faFacebook} className="text-gray-400 hover:text-white" size="sm" />
                </a>
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon icon={faTwitter} className="text-gray-400 hover:text-white" size="sm" />
                </a>
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon icon={faInstagram} className="text-gray-400 hover:text-white" size="sm" />
                </a>
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon icon={faLinkedin} className="text-gray-400 hover:text-white" size="sm" />
                </a>
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon icon={faYoutube} className="text-gray-400 hover:text-white" size="sm" />
                </a>
                <a href="#" className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon icon={faWhatsapp} className="text-gray-400 hover:text-white" size="sm" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/create-order" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Create Order
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Our Services</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/services/same-day" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Same Day Delivery
                </Link>
              </li>
              <li>
                <Link href="/services/express" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Express Delivery
                </Link>
              </li>
              <li>
                <Link href="/services/scheduled" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Scheduled Delivery
                </Link>
              </li>
              <li>
                <Link href="/services/intercity" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Intercity Delivery
                </Link>
              </li>
              <li>
                <Link href="/services/fragile" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Fragile Items
                </Link>
              </li>
              <li>
                <Link href="/services/bulk" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Bulk Delivery
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Support & Legal</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-400 mb-1">
                © {currentYear} TumaNow. All rights reserved.
              </p>
              <p className="text-xs text-gray-500">
                Licensed courier and delivery service provider in Rwanda
              </p>
            </div>
            <div className="flex items-center gap-5">
              <button className="text-xs text-gray-400 hover:text-primary transition-colors">
                English
              </button>
              <button className="text-xs text-gray-400 hover:text-primary transition-colors">
                Kinyarwanda
              </button>
              <button className="text-xs text-gray-400 hover:text-primary transition-colors">
                Français
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

