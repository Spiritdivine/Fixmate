import json
import os

with open('/Users/mac/Artisan/docs/laws_of_ux.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

laws = data['laws']

# UI Design Application Mapping for each law
ui_applications = {
    "aesthetic-usability-effect": {
        "domain": "Visual Aesthetics & Emotional Design",
        "ui_rules": [
            "Invest in polished typography, whitespace rhythm, and color harmony to build instant user trust and forgiving perceptions.",
            "Never use visual polish as an excuse for poor functionality—conduct task-completion usability testing to reveal masked friction.",
            "Use subtle micro-interactions and transitions to make interfaces feel responsive and high quality."
        ],
        "anti_pattern": "Designing a visually dazzling onboarding or dashboard that hides broken user flows, obscure icons, or illegible text contrast."
    },
    "choice-overload": {
        "domain": "Decision Making & Conversion Optimization",
        "ui_rules": [
            "Limit primary navigation items to 5–7 top-level links.",
            "In pricing tiers or checkout options, highlight one recommended option ('Most Popular') to anchor choice.",
            "Use progressive disclosure: reveal advanced settings or sub-options only when the user requests them."
        ],
        "anti_pattern": "Showing 25 uncurated filter options at once without categories, default selections, or smart sorting."
    },
    "chunking": {
        "domain": "Information Architecture & Form Design",
        "ui_rules": [
            "Format long strings into distinct cognitive chunks (e.g. phone numbers `(555) 019-2834`, credit cards `4532 •••• •••• 9012`).",
            "Divide complex multi-step forms into distinct steps with a clear progress bar (e.g. Contact -> Billing -> Review).",
            "Use visual cards, containers, and dividers to break wall-of-text content into digestible blocks."
        ],
        "anti_pattern": "A monolithic 20-field registration form rendered in a single continuous column without groupings or section headers."
    },
    "cognitive-bias": {
        "domain": "User Judgment & Behavioral Heuristics",
        "ui_rules": [
            "Default to ethical, user-aligned defaults (opt-out of telemetry, opt-in for marketing).",
            "Anchor pricing by showing the higher baseline or annualized savings clearly.",
            "Provide confirmation dialogues with clear consequences for destructive actions to counteract confirmation bias."
        ],
        "anti_pattern": "Dark patterns that exploit loss aversion, false urgency timers, or hidden pre-checked opt-in boxes."
    },
    "cognitive-load": {
        "domain": "Mental Resources & Interaction Simplicity",
        "ui_rules": [
            "Eliminate extraneous cognitive load by stripping decorative clutter that doesn't aid navigation or understanding.",
            "Keep intrinsic cognitive load manageable by using familiar iconography and standard UI paradigms.",
            "Support germane load by providing clear contextual hints, tooltips, and sensible keyboard shortcuts."
        ],
        "anti_pattern": "Overloading a single dashboard screen with blinking badges, unorganized gauges, and conflicting CTA colors."
    },
    "doherty-threshold": {
        "domain": "System Performance & Perceived Speed",
        "ui_rules": [
            "Provide immediate visual feedback (<100ms) on tap or click (active states, ripple animations, button spinners).",
            "Ensure system responses return within 400ms to maintain seamless user focus and productivity flow.",
            "For operations taking >400ms, use skeleton screens, animated loaders, or optimistic UI updates."
        ],
        "anti_pattern": "Freezing the UI or leaving a button unresponsive without visual feedback while awaiting a remote network call."
    },
    "fittss-law": {
        "domain": "Ergonomics & Touch Target Sizing",
        "ui_rules": [
            "Design touch targets to be at least 44x44 pt (iOS) or 48x48 dp (Android) with at least 8dp padding between adjacent targets.",
            "Place primary mobile actions in the bottom thumb zone (bottom navigation bar, sticky bottom action bar).",
            "Pin top desktop menus and dock items to screen edges or corners where the effective target depth is infinite."
        ],
        "anti_pattern": "Tiny 14px link texts clustered right next to each other on mobile screens, causing frequent mis-taps."
    },
    "flow": {
        "domain": "Engagement & Task Immersion",
        "ui_rules": [
            "Balance user skill and task challenge with clear immediate feedback and frictionless navigation.",
            "Remove unnecessary interruptions, popups, and modal dialogs during focused creation or checkout workflows.",
            "Preserve user input state automatically so fear of data loss never disrupts flow."
        ],
        "anti_pattern": "Interrupting a user typing a document or filling an order with modal survey requests or unrelated promotional banners."
    },
    "goal-gradient-effect": {
        "domain": "Motivation & Gamification",
        "ui_rules": [
            "Provide an artificial head start (e.g., 'Step 1 of 5 already completed: Account created') to accelerate completion.",
            "Display visual progress bars or completion percentages that visibly advance with every action taken.",
            "Celebrate milestones with micro-animations (checkmarks, badges) as the user gets closer to 100% completion."
        ],
        "anti_pattern": "Multi-step wizards that give zero indication of how many steps remain or hide progress until the final screen."
    },
    "hicks-law": {
        "domain": "Decision Time & Menu Architecture",
        "ui_rules": [
            "Minimize choices to decrease decision response time; highlight recommended defaults.",
            "Break down complex processes into discrete, bite-sized steps using progressive disclosure.",
            "Provide intelligent search and filtering rather than forcing users to browse exhaustive categorical lists."
        ],
        "anti_pattern": "A drop-down menu with 80 unorganized items in random order that freezes the user's decision-making."
    },
    "jakobs-law": {
        "domain": "Mental Models & Conventions",
        "ui_rules": [
            "Adhere to established web and mobile patterns (shopping cart top-right, search bar with magnifying glass, logo top-left returning home).",
            "Allow users to transfer skills seamlessly from other popular apps without requiring a tutorial.",
            "When introducing a redesign, provide gradual rollout, preview modes, or backward compatibility to avoid jarring friction."
        ],
        "anti_pattern": "Re-inventing standard navigation controls (like replacing a hamburger/tab bar with a cryptic gesture-only radial dial)."
    },
    "law-of-common-region": {
        "domain": "Gestalt Psychology & Card Layouts",
        "ui_rules": [
            "Group related elements within a defined visual container using borders, background cards, or elevation drops.",
            "Ensure that interactive controls related to a specific item reside visibly inside that item's boundary box.",
            "Use distinct container backgrounds to differentiate high-priority sections from standard content."
        ],
        "anti_pattern": "Placing an 'Action' button outside or midway across card boundaries, leaving ambiguity about what item it affects."
    },
    "law-of-proximity": {
        "domain": "Gestalt Psychology & Spatial Layout",
        "ui_rules": [
            "Place form labels closer to their corresponding input field than to the preceding input field.",
            "Keep headings closer to the content they introduce than to the section above them.",
            "Cluster related buttons and metadata tags together while maintaining generous white space between unrelated groups."
        ],
        "anti_pattern": "Equal spacing between all elements on a page, causing labels to look like they belong to the input above them."
    },
    "law-of-pragnanz": {
        "domain": "Gestalt Psychology & Visual Simplicity",
        "ui_rules": [
            "Design iconography using simple, familiar geometric shapes that the human eye can decode instantaneously.",
            "Use clear, uncluttered visual hierarchy so users perceive the page structure as simple, balanced forms.",
            "Avoid overly complex metaphors or visual noise that distracts from the core content."
        ],
        "anti_pattern": "Illustrations or icons with intricate overlapping geometries that look like an indecipherable blob at small sizes."
    },
    "law-of-similarity": {
        "domain": "Gestalt Psychology & Visual Consistency",
        "ui_rules": [
            "Ensure all elements of the same functional type share identical styling (e.g. all primary links share the same color/underline).",
            "Give all primary CTAs consistent color, radius, and elevation across the entire app.",
            "Use distinctive styling to indicate status (e.g. green pill for active, red pill for failed, amber for pending)."
        ],
        "anti_pattern": "Styling static decorative badges to look exactly like clickable pill buttons, inducing accidental clicks."
    },
    "law-of-uniform-connectedness": {
        "domain": "Gestalt Psychology & Relationship Linking",
        "ui_rules": [
            "Connect related sequential steps with visible lines, stepper paths, or arrows.",
            "Use tabs with an unbroken indicator underline connecting active tab to its content pane.",
            "Enclose connected options in a segmented control or connected button group."
        ],
        "anti_pattern": "A stepper flow where steps float as isolated dots with no connecting lines, obscuring the path relationship."
    },
    "mental-model": {
        "domain": "Cognitive Expectations & System Mapping",
        "ui_rules": [
            "Align interface behavior with real-world user expectations (e.g. swiping a card, pulling down to refresh).",
            "Bridge the gap between designer mental models and end-user mental models through ongoing user research.",
            "Use clear system status indicators so users always understand what state the application is currently in."
        ],
        "anti_pattern": "Using internal engineering jargon or database column names in customer-facing error messages and labels."
    },
    "millers-law": {
        "domain": "Working Memory & Information Capacity",
        "ui_rules": [
            "Do not force users to hold more than 5–9 pieces of ephemeral information in memory simultaneously.",
            "Organize content into 5–7 thematic categories with sub-navigation rather than 30 flat items.",
            "Recognize that 7±2 applies to working memory capacity, not a rigid rule for the number of navigation links."
        ],
        "anti_pattern": "Requiring a user to memorize an order number on Screen A to manually re-type it on Screen B."
    },
    "occams-razor": {
        "domain": "Minimalism & Feature Elimination",
        "ui_rules": [
            "Choose the design solution with the fewest assumptions and simplest path to goal.",
            "Ruthlessly eliminate non-essential UI elements, decorations, and redundant steps that do not assist task completion.",
            "Deliver complete experiences with fewer moving parts rather than bloated multipurpose screens."
        ],
        "anti_pattern": "Adding 4 confirmation modals, 2 drop-downs, and a captchas for an internal routine low-risk action."
    },
    "paradox-of-the-active-user": {
        "domain": "User Behavior & Onboarding",
        "ui_rules": [
            "Accept that users will almost never read instruction manuals, FAQs, or extensive modal tour carousels.",
            "Design interfaces to be immediately exploratory and self-explanatory through intuitive action and inline feedback.",
            "Provide contextual, in-situ guidance (tooltips on first interaction) rather than front-loaded multi-page walkthroughs."
        ],
        "anti_pattern": "Forcing a new sign-up to click through an 8-slide mandatory onboarding modal before they can touch the app."
    },
    "pareto-principle": {
        "domain": "Feature Prioritization (80/20 Rule)",
        "ui_rules": [
            "Focus design effort and screen real estate on the 20% of features that drive 80% of daily user activities.",
            "Keep the most vital actions prominent and readily accessible in the top-level viewport.",
            "De-prioritize edge-case settings into secondary menus or overflow drawers."
        ],
        "anti_pattern": "Giving equal visual weight and top-level toolbar placement to obscure debug settings and daily core workflows."
    },
    "parkinsons-law": {
        "domain": "Task Efficiency & Time Friction",
        "ui_rules": [
            "Use features like autofill, smart defaults, and geolocation to dramatically compress the time needed to fill forms.",
            "Provide clear visual cues when time limits apply (e.g. concert seat reservations) to encourage prompt completion.",
            "Reduce friction in recurring workflows to prevent users from feeling that an admin task consumes their entire day."
        ],
        "anti_pattern": "Requiring repetitive manual entry of address, city, and state when postal code lookup could automate it."
    },
    "peak-end-rule": {
        "domain": "Emotional Memory & Key Moments",
        "ui_rules": [
            "Design memorable, delightful peaks during the most critical milestone of a user's journey (e.g., celebratory confetti on job booked).",
            "Ensure the final touchpoint (the 'end') of an interaction is smooth, reassuring, and clearly confirmed.",
            "Transform painful moments (404 errors, network failures) into pleasant recovery experiences with helpful options."
        ],
        "anti_pattern": "Ending an otherwise great checkout experience with an ambiguous blank screen or an ugly raw JSON error."
    },
    "postels-law": {
        "domain": "Robustness & Input Flexibility",
        "ui_rules": [
            "Accept various user input formats flexibly (e.g. phone numbers with or without dashes, dates in multiple formats).",
            "Be conservative and precise in system outputs: validate, sanitize, and display clean standardized results.",
            "Provide helpful auto-correction and clear guidance rather than rejecting input with harsh error boundaries."
        ],
        "anti_pattern": "Refusing to accept a phone number because the user typed parentheses or spaces, forcing them to retype it."
    },
    "selective-attention": {
        "domain": "Visual Attention & Banner Blindness",
        "ui_rules": [
            "Design key information to align directly with the user’s primary focal path and task goal.",
            "Avoid placing critical actions or alerts in locations that resemble ad banners (top banners often get ignored).",
            "Use contrasting typography, color, and positioning to guide visual scan paths hierarchically."
        ],
        "anti_pattern": "Placing vital system notices in flashing marquee ribbons at the top of the page that users subconsciously filter out."
    },
    "serial-position-effect": {
        "domain": "List Ordering & Navigation Placement",
        "ui_rules": [
            "Place the most critical navigation items at the very beginning (Primacy Effect) and very end (Recency Effect) of menus.",
            "In mobile tab bars, place the primary feed/home on the far left, and account/checkout/action on the far right.",
            "Place key conversion options or summary highlights at the beginning and end of long landing pages."
        ],
        "anti_pattern": "Burying the most important CTA or filter in the middle of a long horizontal scroll list where it is easily forgotten."
    },
    "teslers-law": {
        "domain": "Complexity Management & System Architecture",
        "ui_rules": [
            "Shift complexity from the user to the software by building intelligent automation, smart defaults, and predictive text.",
            "Do not over-simplify to the point of breaking necessary capabilities—balance system simplicity with power.",
            "Ensure the remaining essential complexity is handled with clear UI states, contextual help, and clean organization."
        ],
        "anti_pattern": "Hiding vital configuration options completely in an attempt to look 'clean', leaving power users stranded."
    },
    "von-restorff-effect": {
        "domain": "Visual Contrast & Call-to-Action",
        "ui_rules": [
            "Make your primary Call-to-Action visually distinctive from all other surrounding elements (accent color, size, contrast).",
            "Highlight recommended or featured pricing tiers with distinctive elevation, badge, or border.",
            "Use isolation sparingly—if everything is highlighted or shouting for attention, nothing stands out."
        ],
        "anti_pattern": "Making 5 buttons on the same screen have identical primary solid blue backgrounds, confusing the user on what to click."
    },
    "working-memory": {
        "domain": "Cognitive Capacity & State Retention",
        "ui_rules": [
            "Never require users to remember information across different screens or modal views.",
            "Provide persistent contextual indicators (breadcrumbs, sticky cart summaries, active filters).",
            "Offer visual recognition over recall—use thumbnail previews, auto-suggest, and recently viewed lists."
        ],
        "anti_pattern": "Asking a user to select an item, then on the next page asking them to remember and enter its item code."
    },
    "zeigarnik-effect": {
        "domain": "Task Completion & Retention",
        "ui_rules": [
            "Provide explicit visual progress indicators for multi-step tasks (e.g. 'Profile 70% complete — add photo to finish').",
            "Allow users to save unfinished drafts and prominently display them upon return to encourage completion.",
            "Break complex tasks into small, achievable milestones that create momentum to finish the incomplete workflow."
        ],
        "anti_pattern": "Discarding incomplete user submissions without warning or draft saving, demoralizing the user from returning."
    }
}

# Group laws by functional UI category
categories = {
    "1. Visual Perception & Gestalt Psychology": [
        "law-of-common-region",
        "law-of-proximity",
        "law-of-pragnanz",
        "law-of-similarity",
        "law-of-uniform-connectedness",
        "aesthetic-usability-effect"
    ],
    "2. Decision Making & Cognitive Friction": [
        "choice-overload",
        "chunking",
        "cognitive-bias",
        "cognitive-load",
        "hicks-law",
        "occams-razor"
    ],
    "3. Ergonomics, Physics & Interaction": [
        "fittss-law",
        "doherty-threshold",
        "parkinsons-law"
    ],
    "4. Memory, Attention & Retention": [
        "millers-law",
        "selective-attention",
        "serial-position-effect",
        "von-restorff-effect",
        "working-memory"
    ],
    "5. Behavioral Motivation & Emotional Experience": [
        "flow",
        "goal-gradient-effect",
        "peak-end-rule",
        "zeigarnik-effect",
        "pareto-principle"
    ],
    "6. Mental Models & Robust Systems": [
        "jakobs-law",
        "mental-model",
        "paradox-of-the-active-user",
        "postels-law",
        "teslers-law"
    ]
}

lines = []
lines.append("# Laws of UX: Complete UI/UX Design Best Practices Guide")
lines.append("")
lines.append("> **Source:** [Laws of UX (lawsofux.com)](https://lawsofux.com/) by **Jon Yablonski**  ")
lines.append(f"> **Scraped Content:** All 30 Laws of UX + In-depth companion articles + Direct UI Implementation Guidelines  ")
lines.append("> **Format:** Curated reference manual for product designers, UI engineers, and design system creators.")
lines.append("")
lines.append("---")
lines.append("")
lines.append("## Table of Contents")
lines.append("")
for cat, slugs in categories.items():
    lines.append(f"- **{cat}**")
    for s in slugs:
        # find law
        law_obj = next((l for l in laws if l['slug'] == s or l['slug'] == s.replace('pragnanz', 'law-of-pr%C3%A4gnanz')), None)
        title = law_obj['title'] if law_obj else s.replace('-', ' ').title()
        lines.append(f"  - [{title}](#{s})")
lines.append("- [Companion Articles on UX Psychology](#companion-articles)")
lines.append("- [UI Best Practice Quick-Checklist](#quick-checklist)")
lines.append("")
lines.append("---")
lines.append("")

# Write each category
for cat, slugs in categories.items():
    lines.append(f"## {cat}")
    lines.append("")
    
    for s in slugs:
        law_obj = next((l for l in laws if l['slug'] == s or l['slug'] == s.replace('pragnanz', 'law-of-pr%C3%A4gnanz')), None)
        if not law_obj:
            continue
            
        app = ui_applications.get(s, {})
        
        lines.append(f"### <a id='{s}'></a>{law_obj['title']}")
        lines.append("")
        lines.append(f"**Core Principle:** *{law_obj['definition']}*")
        lines.append("")
        lines.append(f"- **Category:** `{law_obj.get('category', 'Theory')}` | **Tags:** `{', '.join(law_obj.get('tags', []))}`")
        lines.append(f"- **Official Link:** [{law_obj['url']}]({law_obj['url']})")
        lines.append("")
        
        lines.append("#### Key UX Takeaways")
        for tk in law_obj.get('takeaways', []):
            lines.append(f"- {tk}")
        lines.append("")
        
        if app.get('ui_rules'):
            lines.append("#### UI Design Best Practices & Implementation Rules")
            for rule in app['ui_rules']:
                lines.append(f"- **Do:** {rule}")
            if app.get('anti_pattern'):
                lines.append(f"- **Avoid (Anti-Pattern):** {app['anti_pattern']}")
            lines.append("")
            
        if law_obj.get('examples'):
            lines.append("#### Practical Case Examples")
            for ex in law_obj['examples']:
                lines.append(f"- **{ex['title']}:** {ex['description']}")
            lines.append("")
            
        if law_obj.get('origins'):
            lines.append("#### Origins & Scientific Background")
            lines.append(f"> {law_obj['origins']}")
            lines.append("")
            
        if law_obj.get('further_reading'):
            lines.append("#### Recommended Reading & References")
            for rd in law_obj['further_reading'][:4]:
                lines.append(f"- *{rd['title']}* — {rd['source']}")
            lines.append("")
            
        lines.append("---")
        lines.append("")

# Add Companion Articles
lines.append("## <a id='companion-articles'></a>Companion Deep-Dive Articles on UX Psychology")
lines.append("")
lines.append("The Laws of UX platform features in-depth essays exploring the intersection of psychology and interface craft:")
lines.append("")
for art in data.get('articles', []):
    lines.append(f"### [{art['title']}]({art['url']})")
    lines.append(f"- **URL:** {art['url']}")
    lines.append("")

# Quick Checklist
lines.append("## <a id='quick-checklist'></a>UI Best Practice Master Checklist")
lines.append("")
lines.append("| Law | Primary UI Focus | Golden Rule for UI Designers |")
lines.append("| :--- | :--- | :--- |")
lines.append("| **Aesthetic-Usability Effect** | Visual Finish & Craft | Polish builds trust, but always test task completion to uncover masked bugs. |")
lines.append("| **Fitts's Law** | Buttons & Touch Targets | Minimum 44x44pt on mobile; place key actions in the natural thumb zone. |")
lines.append("| **Hick's Law** | Menus & Options | Reduce choice overload with progressive disclosure and smart defaults. |")
lines.append("| **Jakob's Law** | Navigation & Conventions | Follow familiar web/app patterns so users don't have to learn new mental models. |")
lines.append("| **Law of Proximity** | Spacing & Form Layouts | Keep labels closer to their own inputs than to preceding inputs. |")
lines.append("| **Law of Common Region** | Cards & Containers | Enclose related elements in cards/containers with visible boundaries. |")
lines.append("| **Miller's Law** | Working Memory | Chunk complex data into 5–7 digestible clusters (e.g. credit cards, phone numbers). |")
lines.append("| **Peak-End Rule** | Emotional Memory | Design celebratory milestones at key moments and ensure painless completion. |")
lines.append("| **Postel's Law** | Form Inputs | Be liberal in input formats accepted; normalize data behind the scenes. |")
lines.append("| **Tesler's Law** | Complexity Conservation | Shift complexity from user to software via automation and smart defaults. |")
lines.append("| **Von Restorff Effect** | Call-to-Action | Make the primary CTA visually isolated and distinct from secondary actions. |")
lines.append("| **Zeigarnik Effect** | Onboarding & Workflows | Show explicit progress meters and save draft states to motivate task completion. |")
lines.append("")

guide_content = '\n'.join(lines)

output_path = '/Users/mac/Artisan/docs/LAWS_OF_UX_DESIGN_GUIDE.md'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(guide_content)

print(f"Generated comprehensive guide at: {output_path} ({len(guide_content)} characters)")
