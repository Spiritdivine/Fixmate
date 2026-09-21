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
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-bold text-[#141A16] uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-[#556259] font-medium">
              <li>
                <a href="#how-it-works" className="hover:text-[#123E2A] transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#trades" className="hover:text-[#123E2A] transition-colors">Verified Trades</a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#123E2A] transition-colors">Dual-Rail Escrow</a>
              </li>
              <li>
                <a href="#trust" className="hover:text-[#123E2A] transition-colors">Proof of Work Vault</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#123E2A] transition-colors">FAQ</a>
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
                <Link to="/register?role=CLIENT" className="hover:text-[#123E2A] transition-colors">Find an Artisan</Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#123E2A] transition-colors">Milestone Guarantees</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#123E2A] transition-colors">Dispute Tribunal</a>
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
                <a href="#for-artisans" className="hover:text-[#123E2A] transition-colors">Vetting Standards</a>
              </li>
              <li>
                <a href="#for-artisans" className="hover:text-[#123E2A] transition-colors">Guaranteed Payouts</a>
              </li>
              <li>
                <a href="#for-artisans" className="hover:text-[#123E2A] transition-colors">Reputation Credit</a>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & Trust */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-bold text-[#141A16] uppercase tracking-wider mb-4">
              Trust &amp; Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-[#556259] font-medium">
              <li>
                <span className="text-stone-400">Terms of Escrow</span>
              </li>
              <li>
                <span className="text-stone-400">Privacy Policy</span>
              </li>
              <li>
                <span className="text-stone-400">Dispute Guidelines</span>
              </li>
              <li>
                <span className="text-stone-400">Smart Contract Audit</span>
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
