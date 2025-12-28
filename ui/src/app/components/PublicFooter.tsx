'use client';

import Link from 'next/link';
import Icon, { 
  faTruck, 
  faMapMarkerAlt, 
  faPhone, 
  faEnvelope, 
  faGlobe,
  faArrowRight,
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand & Description */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <Icon icon={faTruck} className="text-primary" size="2x" />
              <span className="text-3xl font-extrabold text-white">TumaNow</span>
            </Link>
            <p className="text-base font-medium text-gray-400 mb-6 max-w-md leading-relaxed">
              Fast, reliable, and secure courier and delivery services across Rwanda. 
              Connect with multiple logistics operators on one unified platform. 
              Track your packages in real-time and experience seamless delivery.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <Icon icon={faPhone} className="text-primary" size="lg" />
                <a href="tel:+250788123456" className="text-base font-semibold text-gray-300 hover:text-primary transition-colors">
                  +250 788 123 456
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Icon icon={faEnvelope} className="text-primary" size="lg" />
                <a href="mailto:info@tumanow.rw" className="text-base font-semibold text-gray-300 hover:text-primary transition-colors">
                  info@tumanow.rw
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Icon icon={faMapMarkerAlt} className="text-primary mt-1" size="lg" />
                <div className="text-base font-semibold text-gray-300">
                  KG 7 Ave, Kigali, Rwanda
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="text-lg font-bold text-white mb-4">Follow Us</h4>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon icon={faFacebook} className="text-gray-300 hover:text-white" size="lg" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon icon={faTwitter} className="text-gray-300 hover:text-white" size="lg" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon icon={faInstagram} className="text-gray-300 hover:text-white" size="lg" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon icon={faLinkedin} className="text-gray-300 hover:text-white" size="lg" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon icon={faYoutube} className="text-gray-300 hover:text-white" size="lg" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon icon={faWhatsapp} className="text-gray-300 hover:text-white" size="lg" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Home
                </Link>
              </li>
              <li>
                <Link href="/create-order" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Create Order
                </Link>
              </li>
              <li>
                <Link href="/track" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Our Services</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/services/same-day" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Same Day Delivery
                </Link>
              </li>
              <li>
                <Link href="/services/express" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Express Delivery
                </Link>
              </li>
              <li>
                <Link href="/services/scheduled" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Scheduled Delivery
                </Link>
              </li>
              <li>
                <Link href="/services/intercity" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Intercity Delivery
                </Link>
              </li>
              <li>
                <Link href="/services/fragile" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Fragile Items
                </Link>
              </li>
              <li>
                <Link href="/services/bulk" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Bulk Delivery
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Support & Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-base font-semibold text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Icon icon={faArrowRight} className="text-primary" size="sm" />
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-gray-800 rounded-lg p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">Subscribe to Our Newsletter</h3>
              <p className="text-base font-medium text-gray-400">
                Get the latest updates on new services, promotions, and delivery tips delivered to your inbox.
              </p>
            </div>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              />
              <button className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-base font-semibold text-gray-400 mb-2">
                © {currentYear} TumaNow. All rights reserved.
              </p>
              <p className="text-sm font-medium text-gray-500">
                Licensed courier and delivery service provider in Rwanda
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Icon icon={faGlobe} className="text-primary" size="sm" />
                <span className="text-sm font-semibold text-gray-400">English</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon={faGlobe} className="text-primary" size="sm" />
                <span className="text-sm font-semibold text-gray-400">Kinyarwanda</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon={faGlobe} className="text-primary" size="sm" />
                <span className="text-sm font-semibold text-gray-400">Français</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

