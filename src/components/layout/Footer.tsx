import React from "react";
import Link from "next/link";
import { ShieldCheck, Star, Users, Heart } from "lucide-react";
import { AppLogo } from "@/ui/AppLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="hidden md:block bg-white border-t border-slate-200/90 text-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-flex items-center">
              <AppLogo size="md" />
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              The trusted marketplace connecting vetted, skilled trade & digital service
              professionals with quality clients.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Vetted Workers
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500" /> Verified Reviews
              </span>
            </div>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3">
              For Clients
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/workers" className="hover:text-primary-600 transition-colors">
                  Find Workers
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Home+Services" className="hover:text-primary-600 transition-colors">
                  Home Services
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Cleaning" className="hover:text-primary-600 transition-colors">
                  Cleaning Services
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Repairs" className="hover:text-primary-600 transition-colors">
                  Repairs & Maintenance
                </Link>
              </li>
              <li>
                <Link href="/client/bookings" className="hover:text-primary-600 transition-colors">
                  Manage Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* For Workers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3">
              For Workers
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/signup?role=worker" className="hover:text-primary-600 transition-colors">
                  Join as a Pro
                </Link>
              </li>
              <li>
                <Link href="/worker" className="hover:text-primary-600 transition-colors">
                  Worker Dashboard
                </Link>
              </li>
              <li>
                <Link href="/worker/services" className="hover:text-primary-600 transition-colors">
                  Manage Services
                </Link>
              </li>
              <li>
                <Link href="/worker/earnings" className="hover:text-primary-600 transition-colors">
                  Track Earnings
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3">
              Trust & Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <Link href="/#how-it-works" className="hover:text-primary-600 transition-colors">
                  How WorkLink Works
                </Link>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">Privacy Policy</span>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">Terms of Service</span>
              </li>
              <li>
                <span className="text-slate-400 cursor-not-allowed">Trust & Safety Guarantee</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} WorkLink Platform Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with modern precision for clients & skilled workers.
          </p>
        </div>
      </div>
    </footer>
  );
};
