import React from 'react';

export interface PriceBenchmark {
  task: string;
  priceRange: string;
  estimatedDays: string;
  scopeNotes: string;
}

export interface TradeCategoryData {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  averageBudgetRange: string;
  typicalDuration: string;
  activeSpecialistsCount: number;
  popularSkills: string[];
  priceBenchmarks: PriceBenchmark[];
  commonScopes: string[];
  materialsSuppliedByClient: string[];
  materialsSuppliedByArtisan: string[];
  inspectionChecklist: string[];
  faq: { question: string; answer: string }[];
}

export const TRADE_CATALOG: Record<string, TradeCategoryData> = {
  'solar-and-inverters': {
    slug: 'solar-and-inverters',
    name: 'Solar & Clean Energy',
    tagline: 'Certified Solar Installers & Inverter Engineers',
    description: 'Rooftop solar panel mounting, hybrid inverter synchronization, lithium iron phosphate (LiFePO4) storage setup, and automated grid failover audits for residential and commercial facilities.',
    averageBudgetRange: '₦80,000 – ₦650,000',
    typicalDuration: '1 – 3 Days',
    activeSpecialistsCount: 142,
    popularSkills: ['Inverter Installation', 'Solar Panel Wiring', 'Lithium Battery Bank Sizing', 'Surge Audits', 'Load Balancing', 'Hybrid Synchronization'],
    priceBenchmarks: [
      {
        task: '1kVA – 2.5kVA Basic Inverter & Battery Installation',
        priceRange: '₦35,000 – ₦55,000',
        estimatedDays: '1 Day',
        scopeNotes: 'Mounting inverter, DC battery cabling, changeover switch integration, and dedicated essential load circuit separation.',
      },
      {
        task: '5kVA Hybrid Inverter & Rooftop Solar Setup (4-8 Panels)',
        priceRange: '₦85,000 – ₦180,000',
        estimatedDays: '2 Days',
        scopeNotes: 'Aluminium rail roof mounting, MPPT charge controller configuration, DC surge protection, and earthing installation.',
      },
      {
        task: '10kVA – 15kVA Commercial / Multi-Family Solar Microgrid',
        priceRange: '₦250,000 – ₦550,000',
        estimatedDays: '3 – 5 Days',
        scopeNotes: 'High-voltage DC combiner box, 3-phase synchronization, lithium BMS communication, and automatic generator auto-start relay.',
      },
      {
        task: 'Battery Bank Overhaul & Cell Capacity Equalization',
        priceRange: '₦25,000 – ₦45,000',
        estimatedDays: 'Same Day',
        scopeNotes: 'Terminal desulfation/cleaning, specific gravity testing, BMS recalibration, and thermal runaway prevention check.',
      },
    ],
    commonScopes: [
      'Comprehensive pre-installation load audit and energy consumption assessment',
      'Structural roof inspection and angle orientation for maximum Nigerian solar irradiance',
      'Separation of heavy inductive loads (pumping machines, heavy ACs) from inverter backup lines',
      'Installation of DC surge arresters, AC bypass breaker, and dedicated earthing rod',
      'Client onboarding on inverter display codes, battery depth-of-discharge (DoD), and maintenance',
    ],
    materialsSuppliedByClient: [
      'Solar panels (Monocrystalline / Polycrystalline)',
      'Pure sine wave or hybrid inverter unit',
      'Lithium LiFePO4 or Deep Cycle Tubular/Gel batteries',
      'Main DC battery breakers and heavy gauge solar cables (16mm² / 25mm²)',
    ],
    materialsSuppliedByArtisan: [
      'Aluminium roof mounting brackets, Z-clamps, and stainless bolts',
      'Heavy-duty hydraulic cable crimpers and heat shrink tubing',
      'Digital multi-meter, clamp meter, and solar irradiance tester',
      'Conduit pipes, cable clips, saddle clamps, and insulation tapes',
    ],
    inspectionChecklist: [
      'Verify inverter produces clean 220V–230V 50Hz pure sine wave under load',
      'Check all solar panel joints are waterproofed with MC4 connectors (no bare twisted wires)',
      'Confirm battery cables are crimped with copper lugs and tightly bolted to prevent thermal sparking',
      'Test automatic grid failover: disconnect NEPA/grid power and verify lights do not flicker or drop',
      'Ensure earthing resistance is tested and bonded properly to protect sensitive electronics',
    ],
    faq: [
      {
        question: 'How do milestone escrow payments work for solar projects?',
        answer: 'Funds are held in smart escrow. Typical milestones: 40% after roof mounting & panel string cabling, 40% upon inverter synchronization and initial power-up, and 20% after a 48-hour continuous load testing approval.',
      },
      {
        question: 'Are the solar engineers certified?',
        answer: 'Yes, artisans in this category undergo credential verification including COREN, NEMSA, or accredited renewable energy technician certifications.',
      },
    ],
  },

  'electrical-and-wiring': {
    slug: 'electrical-and-wiring',
    name: 'Electrical & Wiring',
    tagline: 'Master Electricians & 3-Phase Power Technicians',
    description: 'Residential conduit wiring, commercial distribution board overhauls, 3-phase load balancing, industrial surge arresters, and fault troubleshooting with zero fire hazards.',
    averageBudgetRange: '₦40,000 – ₦350,000',
    typicalDuration: '1 – 3 Days',
    activeSpecialistsCount: 185,
    popularSkills: ['House Wiring', 'Conduit Piping', 'Distribution Board Overhaul', '3-Phase Balancing', 'Fault Finding', 'Surge Arresters', 'Generator Changeover'],
    priceBenchmarks: [
      {
        task: 'Concealed Conduit Piping & Box Chipping (per room)',
        priceRange: '₦15,000 – ₦30,000',
        estimatedDays: '1 – 2 Days',
        scopeNotes: 'Wall cutting, PVC conduit pipe embedding, backbox alignment, and plaster patching.',
      },
      {
        task: 'Distribution Board (DB) Upgrade & Breaker Rewiring',
        priceRange: '₦45,000 – ₦85,000',
        estimatedDays: '1 Day',
        scopeNotes: 'Melted breaker replacement, clean copper busbar cabling, labeled circuit separation, and surge protection.',
      },
      {
        task: 'Complete 3-Bedroom Flat Rewiring & Cable Pulling',
        priceRange: '₦120,000 – ₦250,000',
        estimatedDays: '3 – 5 Days',
        scopeNotes: 'Complete pulling of pure copper cables (1.5mm², 2.5mm², 4mm², 6mm²), switch/socket termination, and earthing.',
      },
      {
        task: 'Automatic Generator Changeover Switch (ATS) Installation',
        priceRange: '₦35,000 – ₦70,000',
        estimatedDays: 'Same Day',
        scopeNotes: 'Motorized ATS or contactor-based automatic mains failover unit wiring and safety interlock.',
      },
    ],
    commonScopes: [
      'Comprehensive megger insulation testing to eliminate ground leakage and high electricity bills',
      'Correct cable rating matching: 1.5mm² lighting, 2.5mm² ring circuits, 4mm²/6mm² air conditioners and water heaters',
      'Clean labeling of each miniature circuit breaker (MCB) on the distribution board',
      'Copper earth rod driving with chemical earthing compound to achieve under 5 ohms ground resistance',
    ],
    materialsSuppliedByClient: [
      'Nigercable or Coleman pure copper single-core cables',
      'Distribution board enclosure and miniature circuit breakers (Schneider, ABB, or Havells)',
      'Wall sockets, light switches, and designer luminaires',
    ],
    materialsSuppliedByArtisan: [
      'Wall chaser, SDS hammer drill, and fish tape / cable draw wire',
      'Digital multi-meter, phase rotation meter, and insulation tester',
      'Consumables: rawl plugs, screws, insulation tapes, and cable ties',
    ],
    inspectionChecklist: [
      'Ensure no undersized cables are used for heavy appliances (ACs must have independent 4mm² lines)',
      'Confirm residual current device (RCD / Earth Leakage) trips when test button is pressed',
      'Inspect DB panel: all wires must be neatly dressed with no exposed bare copper conductors',
      'Verify 3-phase voltage is balanced (approx 400V phase-to-phase and 230V phase-to-neutral)',
    ],
    faq: [
      {
        question: 'Why do you test for earth leakage?',
        answer: 'Earth leakage causes prepaid meters to drain electricity rapidly and poses electrocution risks. Our verified electricians test and eliminate leakage before escrow release.',
      },
      {
        question: 'Can the electrician source certified pure copper cables?',
        answer: 'Yes, if you choose the material-inclusive contract option, the electrician will provide receipts and manufacturer warranty certificates from verified distributors.',
      },
    ],
  },

  'plumbing-and-pipefitting': {
    slug: 'plumbing-and-pipefitting',
    name: 'Plumbing & Pipefitting',
    tagline: 'PPR Welders & Sanitary Engineers',
    description: 'Acoustic leak detection, PPR hot/cold water distribution, borehole submersible pump installation, automated pressure booster pumps, and luxury bathroom sanitary ware fitting.',
    averageBudgetRange: '₦30,000 – ₦280,000',
    typicalDuration: '1 – 2 Days',
    activeSpecialistsCount: 160,
    popularSkills: ['PPR Pipe Welding', 'Concealed Leaks', 'Borehole Pumping Machine', 'Bathroom Sanitary Fitting', 'Water Heater Installation', 'Pressure Booster Pump'],
    priceBenchmarks: [
      {
        task: 'Concealed Pipe Leak Detection & PPR Bypass Repair',
        priceRange: '₦35,000 – ₦75,000',
        estimatedDays: '1 Day',
        scopeNotes: 'Acoustic/pressure testing to pinpoint underground leak, careful tile removal, PPR welding, and pressure re-test.',
      },
      {
        task: '1HP – 1.5HP Automated Water Booster Pump Installation',
        priceRange: '₦25,000 – ₦45,000',
        estimatedDays: 'Same Day',
        scopeNotes: 'Pump base bolting, non-return check valves, automatic electronic pressure controller, and union joints.',
      },
      {
        task: 'Complete Luxury Bathroom Sanitary Overhaul',
        priceRange: '₦60,000 – ₦140,000',
        estimatedDays: '2 Days',
        scopeNotes: 'Wall-hung or floor toilet installation, concealed cistern, glass shower mixer, basin vanity, and water heater.',
      },
      {
        task: 'Submersible Borehole Pump Installation & Control Panel',
        priceRange: '₦50,000 – ₦110,000',
        estimatedDays: '1 – 2 Days',
        scopeNotes: 'Lowering pump with safety cable, PVC riser pipes, float switch sensor wiring, and dry-run protector.',
      },
    ],
    commonScopes: [
      'Hydraulic pressure testing of all welded PPR water conduits at 10 bar before tiling or wall closure',
      'Dual supply lines (hot and cold water) with proper thermal insulation where required',
      'Installation of ball valves at key branch nodes so individual bathrooms can be shut off for maintenance',
      'Slope alignment of drain pipes (minimum 1:50 fall) to ensure self-cleansing velocity and zero odors',
    ],
    materialsSuppliedByClient: [
      'PPR pipes & fittings (PN20 rated for hot water lines)',
      'Water pump unit (Pedrollo, Grundfos, or Leo)',
      'Sanitary appliances (toilets, faucets, sinks, shower systems, water heaters)',
    ],
    materialsSuppliedByArtisan: [
      'Digital thermostatic PPR pipe welding machine with Teflon heating dies',
      'Manual hydraulic pressure test pump with glycerin gauge',
      'Pipe thread sealants, PTFE Teflon tape, and heavy pipe wrenches',
    ],
    inspectionChecklist: [
      'Verify water pressure remains steady with zero pressure gauge drop over 2 hours of hydraulic testing',
      'Check all waste traps have deep water seals to prevent sewer gases from entering living areas',
      'Test booster pump auto-cutoff: pump must immediately shut off when all taps are closed',
      'Inspect toilet cistern flushing and check for silent leaks into the toilet bowl',
    ],
    faq: [
      {
        question: 'Do you break all bathroom tiles to find a leak?',
        answer: 'No. Our verified plumbers utilize acoustic listening and pressure isolation to target the exact tile or pipe segment, minimizing disruption and tiling replacement costs.',
      },
      {
        question: 'What is the warranty on PPR welds?',
        answer: 'When performed with certified PN20 PPR and calibrated dies, welds become a homogenous permanent fusion backed by our 6-month workmanship warranty.',
      },
    ],
  },

  'carpentry-and-woodwork': {
    slug: 'carpentry-and-woodwork',
    name: 'Carpentry & Woodwork',
    tagline: 'Master Joiners, Cabinet Makers & Roof Truss Carpenters',
    description: 'Bespoke high-gloss kitchen cabinets, hardwood door frames, walk-in closets, hardwood roof trusses, and precision furniture restoration.',
    averageBudgetRange: '₦60,000 – ₦850,000',
    typicalDuration: '3 – 7 Days',
    activeSpecialistsCount: 118,
    popularSkills: ['Kitchen Cabinet Making', 'Roof Truss Construction', 'Door Frame Installation', 'Wardrobe Crafting', 'Bespoke Furniture', 'High-Gloss Joinery'],
    priceBenchmarks: [
      {
        task: 'Solid Wood Security Door & Architrave Installation (per door)',
        priceRange: '₦18,000 – ₦35,000',
        estimatedDays: 'Same Day',
        scopeNotes: 'Hardwood jamb squaring, mortise lock chiseling, heavy-duty ball bearing hinges, and architraves.',
      },
      {
        task: 'Modern High-Gloss Kitchen Cabinetry (per linear meter)',
        priceRange: '₦75,000 – ₦160,000',
        estimatedDays: '4 – 7 Days',
        scopeNotes: 'Marine HDF carcasses, acrylic/gloss shutters, soft-close Blum hinges, and granite counter fitting.',
      },
      {
        task: 'Walk-In Closet & Fitted Bedroom Wardrobe',
        priceRange: '₦180,000 – ₦450,000',
        estimatedDays: '3 – 6 Days',
        scopeNotes: 'Full height wardrobe with shoe racks, soft-close drawers, trouser pull-outs, and integrated LED rails.',
      },
      {
        task: 'Residential Timber Roof Truss Fabrication (per building)',
        priceRange: '₦250,000 – ₦650,000',
        estimatedDays: '5 – 10 Days',
        scopeNotes: 'Hardwood timber treating, king post / tie beam assembly, purlin alignment, and fascia board fixing.',
      },
    ],
    commonScopes: [
      'Moisture-resistant core board selection (Marine Ply or HDF) to withstand Nigerian humidity',
      'Laser level alignment ensuring all cabinet doors, drawers, and countertops are 100% plumb and level',
      'Application of anti-termite wood preservative treatment on all concealed timber framing',
      'Use of commercial-grade soft-close hardware tested for minimum 50,000 cycles',
    ],
    materialsSuppliedByClient: [
      'HDF/MDF boards, laminates, or solid hardwoods (Iroko, Teak, Mahogany)',
      'Cabinet handles, drawer slides, and hinges',
      'Granite or quartz worktops',
    ],
    materialsSuppliedByArtisan: [
      'Track saws, plunge routers, biscuit joiners, and laser levels',
      'Pneumatic brad nailers, clamps, and pocket hole jigs',
      'Fast-acting wood adhesives, wood fillers, and abrasives',
    ],
    inspectionChecklist: [
      'Verify all cabinet doors have consistent 2mm gaps with zero rubbing or sagging',
      'Test all soft-close drawers: must pull smoothly without binding under full load',
      'Inspect edge banding: no exposed board substrate or glue squeeze-out along seams',
      'Check door frames: doors must stay stationary at 45 degrees without swinging shut or open on their own',
    ],
    faq: [
      {
        question: 'Do you build on-site or in the workshop?',
        answer: 'Cabinets are fabricated, precision-cut, and edge-banded in the artisan’s workshop, then transported and assembled on-site in 1–2 days to minimize household dust and disruption.',
      },
    ],
  },

  'painting-and-pop': {
    slug: 'painting-and-pop',
    name: 'Painting & POP Ceiling',
    tagline: 'POP Designers, Screeders & Decorative Painters',
    description: 'Mirror-finish wall screeding, suspended POP plaster ceiling designs with shadow gaps, 3D wall panels, washable silk emulsion, and epoxy industrial flooring.',
    averageBudgetRange: '₦50,000 – ₦400,000',
    typicalDuration: '2 – 5 Days',
    activeSpecialistsCount: 135,
    popularSkills: ['POP Ceiling Design', 'Emulsion Painting', 'Screeding & Sanding', '3D Wall Panel Fitting', 'Epoxy Flooring', 'Waterproofing'],
    priceBenchmarks: [
      {
        task: 'Full Wall Screeding & Sanding (Mirror Finish, per room)',
        priceRange: '₦25,000 – ₦45,000',
        estimatedDays: '1 – 2 Days',
        scopeNotes: '2 coats of white screeding paste, mechanical orbital sanding, primer coat, and zero brush marks.',
      },
      {
        task: 'Suspended POP Ceiling Design & Casting (per room)',
        priceRange: '₦65,000 – ₦130,000',
        estimatedDays: '2 – 3 Days',
        scopeNotes: 'Iron rod suspension grid, fiberglass reinforcement, POP plaster casting, spotlights cutouts, and cove lighting recess.',
      },
      {
        task: 'Interior Repainting (Washable Satin/Silk Emulsion, 3-Bed Flat)',
        priceRange: '₦120,000 – ₦220,000',
        estimatedDays: '3 – 4 Days',
        scopeNotes: 'Surface cleaning, minor crack filling, masking tape protection, and 2 finish coats with Dulux or Meyer.',
      },
      {
        task: 'Damp Proofing & Anti-Fungal Wall Treatment',
        priceRange: '₦35,000 – ₦80,000',
        estimatedDays: '1 – 2 Days',
        scopeNotes: 'Scraping peeling paint, penetrating damp sealer application, epoxy barrier coat, and breathable topcoat.',
      },
    ],
    commonScopes: [
      'Complete masking tape and drop sheet floor covering to protect tiles and furniture from paint splatters',
      'Cross-lighting flashlight inspection on screeded walls to detect and eliminate any micro-imperfections',
      'Use of authentic POP cement and fiberglass mesh to prevent ceiling cracks or sagging over time',
      'Thorough spot cleanup and waste disposal after job completion',
    ],
    materialsSuppliedByClient: [
      'Paints (Dulux, Meyer, Berger, or fine acrylic silk/satin emulsion)',
      'POP cement bags, plaster of Paris, and fiberglass roving',
      'Masking tapes and drop sheets',
    ],
    materialsSuppliedByArtisan: [
      'Screeding trowels, mechanical drywall sanders with vacuum extractor',
      'Pro roller brushes, sash brushes, cutting-in tools, and scaffolding ladders',
      'Laser line projectors for perfectly straight ceiling level casting',
    ],
    inspectionChecklist: [
      'Inspect walls with angled light: surface must be glass-smooth with zero pits, ridges, or brush marks',
      'Verify straight, crisp paint lines along skirting boards, ceilings, and architraves',
      'Check POP ceiling level: ceiling must not bow or vibrate when doors are closed',
      'Confirm paint is fully cured with zero chalking or peeling when lightly rubbed with a damp cloth',
    ],
    faq: [
      {
        question: 'How do you handle rising dampness on lower wall sections?',
        answer: 'We scrape back to bare plaster, apply an alkaline damp sealer and hydrophobic barrier before screeding, ensuring moisture cannot push the paint off.',
      },
    ],
  },

  'hvac-and-ac-repair': {
    slug: 'hvac-and-ac-repair',
    name: 'HVAC & Air Conditioning',
    tagline: 'Certified Refrigeration Engineers & Split AC Specialists',
    description: 'Split and standing inverter AC installations, deep chemical coil descaling, compressor diagnostics, R410a/R32 gas refills, and chiller plant servicing.',
    averageBudgetRange: '₦15,000 – ₦180,000',
    typicalDuration: 'Same Day – 2 Days',
    activeSpecialistsCount: 125,
    popularSkills: ['AC Gas Refill', 'Compressor Replacement', 'Split Unit Servicing', 'Inverter AC Diagnostics', 'Chiller Installation', 'Copper Flare Piping'],
    priceBenchmarks: [
      {
        task: 'Deep Chemical Coil Pressure Washing & Servicing (per unit)',
        priceRange: '₦8,000 – ₦15,000',
        estimatedDays: 'Same Day',
        scopeNotes: 'Blower fan removal, indoor evaporator coil pressure wash, outdoor condenser flush, drain pipe unclogging.',
      },
      {
        task: 'New Split Unit AC Installation & Core Hole Drilling',
        priceRange: '₦18,000 – ₦35,000',
        estimatedDays: 'Same Day',
        scopeNotes: 'Indoor bracket mounting, 65mm core drill, copper piping flare connection, nitrogen leak test, and vacuuming.',
      },
      {
        task: 'Refrigerant Top-Up & Flare Leak Sealing (R410a / R32 / R22)',
        priceRange: '₦15,000 – ₦30,000',
        estimatedDays: 'Same Day',
        scopeNotes: 'Nitrogen leak identification, flare nut recutting, deep vacuum evacuation, and weight-measured gas recharge.',
      },
      {
        task: 'Inverter Compressor Replacement & Capacitor Overhaul',
        priceRange: '₦45,000 – ₦95,000',
        estimatedDays: '1 Day',
        scopeNotes: 'Compressor braze welding with silver rod, accumulator flush, new dual run capacitor, and thermal overload testing.',
      },
    ],
    commonScopes: [
      'Mandatory vacuum pump evacuation of lines (minimum 500 microns) before releasing refrigerant to remove moisture',
      'Dual-flare copper pipe connections with torque wrench tightening to prevent slow gas leakage',
      'Drainage pipe gradient testing with water pour to guarantee zero indoor water dripping',
      'Digital temperature differential test: measuring minimum 8°C–12°C drop between intake and vent supply',
    ],
    materialsSuppliedByClient: [
      'Air conditioner unit and outdoor mounting bracket',
      'Refrigerant gas bottle (if self-sourced) and copper pipes',
    ],
    materialsSuppliedByArtisan: [
      'Rotary vacuum pump and digital digital manifold gauges',
      'Oxygen-acetylene or MAPP gas brazing torch with 5% silver solder rods',
      'High-pressure coil washer with waterproof catch bag',
      'Eccentric flare tool and tube bending springs',
    ],
    inspectionChecklist: [
      'Measure vent airflow temperature: must blow crisp cold air (between 14°C–18°C vent output)',
      'Confirm outdoor unit operates quietly without excessive vibration or copper tube rattling',
      'Check indoor unit drain: water must flow freely outside with zero indoor sweating or leaks',
      'Verify amperage draw matches nameplate rating using a clamp meter',
    ],
    faq: [
      {
        question: 'Why does my AC blow warm air after refilling gas last month?',
        answer: 'Refrigerant does not consume itself — if gas is low, there is a physical leak. Our technicians test and braze the leak before charging gas, backed by our 90-day anti-leak guarantee.',
      },
    ],
  },

  'masonry-and-tiling': {
    slug: 'masonry-and-tiling',
    name: 'Masonry & Tiling',
    tagline: 'Master Tilers, Marble Fitters & Bricklayers',
    description: 'Precision large-format ceramic and porcelain tile laying, granite and marble countertop fitting, interlocking paving stone installation, and structural bricklaying.',
    averageBudgetRange: '₦45,000 – ₦450,000',
    typicalDuration: '2 – 6 Days',
    activeSpecialistsCount: 110,
    popularSkills: ['Ceramic Tile Laying', 'Granite Fitting', 'Interlocking Paving', 'Plastering & Screeding', 'Bricklaying', 'Epoxy Grouting'],
    priceBenchmarks: [
      {
        task: 'Porcelain & Ceramic Floor Tiling (per square meter)',
        priceRange: '₦1,200 – ₦2,500 / m²',
        estimatedDays: '2 – 4 Days',
        scopeNotes: 'Laser alignment, cement mortar / tile adhesive bed, leveling spacers, and matching grout.',
      },
      {
        task: 'Large Format Granite / Marble Island Countertop Fitting',
        priceRange: '₦40,000 – ₦90,000',
        estimatedDays: '1 – 2 Days',
        scopeNotes: 'Sink and stove cutout, bullnose edge polishing, epoxy anchoring, and seam blending.',
      },
      {
        task: 'Driveway Interlocking Paving Stones (per square meter)',
        priceRange: '₦900 – ₦1,800 / m²',
        estimatedDays: '3 – 6 Days',
        scopeNotes: 'Sharp sand sub-base leveling, stone pattern laying, perimeter kerb beam casting, and plate compactor vibrating.',
      },
    ],
    commonScopes: [
      'Laser line projection ensuring tile joints are 100% straight and grout lines uniform (1.5mm / 2mm)',
      'Use of tile leveling clip systems (wedge clips) to eliminate lippage (uneven tile edges)',
      'Back-buttering technique on large format tiles (60x60cm, 60x120cm) to eliminate hollow sound or cracking',
    ],
    materialsSuppliedByClient: [
      'Tiles, marble, or granite slabs',
      'Tile adhesive (C2TE rated recommended) and matching cement grout',
      'Sharp sand and Dangote cement bags',
    ],
    materialsSuppliedByArtisan: [
      'Manual rail tile cutter (800mm/1200mm) and wet diamond blade grinder',
      '3D 12-line laser level, rubber mallets, and notched trowels',
      'Vibrating tile suction cup machine',
    ],
    inspectionChecklist: [
      'Tap test across tiles with wooden handle: zero hollow drum sound (indicates 100% adhesive coverage)',
      'Lippage check: slide a coin across joints — coin must glide without catching on raised edges',
      'Water drainage test in bathrooms: water must flow directly toward floor drain without pooling',
    ],
    faq: [
      {
        question: 'Why do tiles crack or sound hollow?',
        answer: 'Hollow tiles happen when tilers use spot-bonding instead of full notched adhesive beds. Our verified tilers use full-coverage back-buttering.',
      },
    ],
  },

  'aluminium-and-roofing': {
    slug: 'aluminium-and-roofing',
    name: 'Aluminium & Roofing',
    tagline: 'Architectural Glaziers, Casement Fitters & Roofers',
    description: 'Thermal-break casement windows, structural aluminium curtain walls, stone-coated metal roofing tile installation, and leak-proof guttering systems.',
    averageBudgetRange: '₦70,000 – ₦600,000',
    typicalDuration: '3 – 7 Days',
    activeSpecialistsCount: 95,
    popularSkills: ['Casement Windows', 'Stone-Coated Roofing', 'Aluminium Fabrication', 'Curtain Walls', 'Rain Gutters', 'Roof Leak Sealing'],
    priceBenchmarks: [
      {
        task: 'Aluminium Casement Window Fabrication & Fitting (per window)',
        priceRange: '₦35,000 – ₦70,000',
        estimatedDays: '2 Days',
        scopeNotes: 'Heavy gauge profile, 5mm tinted or reflective glass, friction stays, and multi-point lock.',
      },
      {
        task: 'Stone-Coated Metal Roofing Sheet Installation (per bundle/m²)',
        priceRange: '₦1,500 – ₦3,000 / m²',
        estimatedDays: '3 – 5 Days',
        scopeNotes: 'Batten spacing, overlapping tile nailing with serrated galvanized nails, valley gutters, and ridge caps.',
      },
      {
        task: 'Seamless Rainwater Aluminium Guttering System (per meter)',
        priceRange: '₦3,500 – ₦7,500 / m',
        estimatedDays: '1 – 2 Days',
        scopeNotes: 'Bracket anchoring, downpipe alignment, silicone sealed joints, and leaf guard strainer.',
      },
    ],
    commonScopes: [
      'Silicone weather-sealing with neutral cure structural silicone to guarantee 100% water tightness against driving rain',
      'Use of original 1.2mm–1.5mm thickness aluminium extrusions (no paper-thin hollow profiles)',
      'Anti-rust stainless steel fasteners throughout exterior exposures',
    ],
    materialsSuppliedByClient: [
      'Aluminium profiles, glass sheets, or stone-coated roofing tiles',
      'Window locks, friction hinges, and silicone cartridges',
    ],
    materialsSuppliedByArtisan: [
      'Mitre saws, punch machines, pneumatic rivet guns, and glass suction lifters',
      'Safety harnesses and roof ropes',
    ],
    inspectionChecklist: [
      'Water hose spray test against window seals to confirm zero water ingress',
      'Check casement windows open effortlessly and friction stays hold position in high wind',
      'Verify all roof ridge caps and valleys are properly overlapped and sealed',
    ],
    faq: [
      {
        question: 'Do the window frames rattle in heavy wind?',
        answer: 'No. Our verified fabricators use thick rubber weatherstripping and heavy gauge friction hinges preventing any wind chatter.',
      },
    ],
  },
};

export const ALL_TRADES_LIST: TradeCategoryData[] = Object.values(TRADE_CATALOG);
