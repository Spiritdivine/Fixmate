import React from 'react';
import { Link } from 'react-router-dom';

export const EditorialFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#FAF7F0] border-t border-stone-300/70 pt-16 pb-8 text-[#141A16] relative">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 5-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-stone-200/80">
          
          {/* Col 1: Brand & Identity */}
          <div className="col-span-2 md:col-span-4 flex flex-col items-start pr-0 lg:pr-6">
            <Link to="/v2" className="flex items-center group select-none mb-4" aria-label="Artifix Home">
              <img
                src="/brand/logo1.png"
                alt="Artifix"
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            <p className="text-xs sm:text-[13px] text-[#556259] leading-relaxed mb-6 font-normal">
              Decentralized trust, escrow, and identity infrastructure for Africa’s informal service economy. Guaranteeing zero-dispute settlements for homeowners and verified craftsmen.
            </p>

            
          </div>

          {/* Col 2: Platform */}
          {/* Col 2: Platform */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-bold text-[#141A16] uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-[#556259] font-medium">
              <li>
                <Link to="/artisans" className="hover:text-[#123E2A] transition-colors">Artisan Directory</Link>
              </li>
              <li>
                <Link to="/trades" className="hover:text-[#123E2A] transition-colors">Trades &amp; Pricing</Link>
              </li>
              <li>
                <Link to="/jobs" className="hover:text-[#123E2A] transition-colors">Jobs Marketplace</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-[#123E2A] transition-colors">Escrow Fee Model</Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-[#123E2A] transition-colors">Security &amp; Audit</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: For Clients */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-bold text-[#141A16] uppercase tracking-wider mb-4">
              For Clients
            </h4>
            <ul className="space-y-2.5 text-xs text-[#556259] font-medium">
              <li>
                <Link to="/register?role=CLIENT" className="hover:text-[#123E2A] transition-colors">Post a Project</Link>
              </li>
              <li>
                <Link to="/artisans" className="hover:text-[#123E2A] transition-colors">Find an Artisan</Link>
              </li>
              <li>
                <Link to="/guarantee" className="hover:text-[#123E2A] transition-colors">Deliverable Guarantee</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-[#123E2A] transition-colors">Fee Calculator</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: For Artisans */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-bold text-[#141A16] uppercase tracking-wider mb-4">
              For Artisans
            </h4>
            <ul className="space-y-2.5 text-xs text-[#556259] font-medium">
              <li>
                <Link to="/register?role=ARTISAN" className="hover:text-[#123E2A] transition-colors">Apply as Artisan</Link>
              </li>
              <li>
                <Link to="/jobs" className="hover:text-[#123E2A] transition-colors">Browse Live Jobs</Link>
              </li>
              <li>
                <Link to="/guarantee" className="hover:text-[#123E2A] transition-colors">Payment Protection</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#123E2A] transition-colors">Artisan Support Desk</Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Company & Legal */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-bold text-[#141A16] uppercase tracking-wider mb-4">
              Company &amp; Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-[#556259] font-medium">
              <li>
                <Link to="/about" className="hover:text-[#123E2A] transition-colors">Our Story &amp; Hubs</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#123E2A] transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link to="/guarantee" className="hover:text-[#123E2A] transition-colors">Dispute Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#123E2A] transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#123E2A] transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Sub-Footer Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            Artifix Technologies &copy; {new Date().getFullYear()} &bull; All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <span>Handcrafted with pride for</span>
            <span className="text-[#123E2A] font-bold">Nigeria's Informal Economy</span>
            <span>&bull;</span>
            <span className="text-[#836EF9] font-bold">Powered by Monad</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default EditorialFooter;
