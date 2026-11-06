# Laws of UX: Complete UI/UX Design Best Practices Guide

> **Source:** [Laws of UX (lawsofux.com)](https://lawsofux.com/) by **Jon Yablonski**  
> **Scraped Content:** All 30 Laws of UX + In-depth companion articles + Direct UI Implementation Guidelines  
> **Format:** Curated reference manual for product designers, UI engineers, and design system creators.

---

## Table of Contents

- **1. Visual Perception & Gestalt Psychology**
  - [Law of Common Region](#law-of-common-region)
  - [Law of Proximity](#law-of-proximity)
  - [Law Of Pragnanz](#law-of-pragnanz)
  - [Law of Similarity](#law-of-similarity)
  - [Law of Uniform Connectedness](#law-of-uniform-connectedness)
  - [Aesthetic-Usability Effect](#aesthetic-usability-effect)
- **2. Decision Making & Cognitive Friction**
  - [Choice Overload](#choice-overload)
  - [Chunking](#chunking)
  - [Cognitive Bias](#cognitive-bias)
  - [Cognitive Load](#cognitive-load)
  - [Hick’s Law](#hicks-law)
  - [Occam’s Razor](#occams-razor)
- **3. Ergonomics, Physics & Interaction**
  - [Fitts’s Law](#fittss-law)
  - [Doherty Threshold](#doherty-threshold)
  - [Parkinson’s Law](#parkinsons-law)
- **4. Memory, Attention & Retention**
  - [Miller’s Law](#millers-law)
  - [Selective Attention](#selective-attention)
  - [Serial Position Effect](#serial-position-effect)
  - [Von Restorff Effect](#von-restorff-effect)
  - [Working Memory](#working-memory)
- **5. Behavioral Motivation & Emotional Experience**
  - [Flow](#flow)
  - [Goal-Gradient Effect](#goal-gradient-effect)
  - [Peak-End Rule](#peak-end-rule)
  - [Zeigarnik Effect](#zeigarnik-effect)
  - [Pareto Principle](#pareto-principle)
- **6. Mental Models & Robust Systems**
  - [Jakob’s Law](#jakobs-law)
  - [Mental Model](#mental-model)
  - [Paradox of the Active User](#paradox-of-the-active-user)
  - [Postel’s Law](#postels-law)
  - [Tesler’s Law](#teslers-law)
- [Companion Articles on UX Psychology](#companion-articles)
- [UI Best Practice Quick-Checklist](#quick-checklist)

---

## 1. Visual Perception & Gestalt Psychology

### <a id='law-of-common-region'></a>Law of Common Region

**Core Principle:** *Elements tend to be perceived into groups if they are sharing an area with a clearly defined boundary.*

- **Category:** `Theory` | **Tags:** `gestalt, proximity`
- **Official Link:** [https://lawsofux.com/law-of-common-region/](https://lawsofux.com/law-of-common-region/)

#### Key UX Takeaways
- Common region creates a clear structure and helps users quickly and effectively understand the relationship between elements and sections.
- Adding a border around an element or group of elements is an easy way to create common region.
- Common region can also be created by defining a background behind an element or group of elements.

#### UI Design Best Practices & Implementation Rules
- **Do:** Group related elements within a defined visual container using borders, background cards, or elevation drops.
- **Do:** Ensure that interactive controls related to a specific item reside visibly inside that item's boundary box.
- **Do:** Use distinct container backgrounds to differentiate high-priority sections from standard content.
- **Avoid (Anti-Pattern):** Placing an 'Action' button outside or midway across card boundaries, leaving ambiguity about what item it affects.

#### Origins & Scientific Background
> The principles of grouping (or Gestalt laws of grouping) are a set of principles in psychology, first proposed by Gestalt psychologists to account for the observation that humans naturally perceive objects as organized patterns and objects, a principle known as Prägnanz. Gestalt psychologists argued that these principles exist because the mind has an innate disposition to perceive patterns in the stimulus based on certain rules. These principles are organized into five categories: Proximity, Similarity, Continuity, Closure, and Connectedness.

#### Recommended Reading & References
- *The Principle of Common Region: Containers Create Groupings* — Aurora Harley | Nielsen Norman Group
- *Design Principles: Visual Perception And The Principles Of Gestalt* — Steven Bradley | Smashing Magazine
- *Gestalt principles* — Scholarpedia

---

### <a id='law-of-proximity'></a>Law of Proximity

**Core Principle:** *Objects that are near, or proximate to each other, tend to be grouped together.*

- **Category:** `Theory` | **Tags:** `gestalt, proximity`
- **Official Link:** [https://lawsofux.com/law-of-proximity/](https://lawsofux.com/law-of-proximity/)

#### Key UX Takeaways
- Proximity helps to establish a relationship with nearby objects.
- Elements in close proximity are perceived to share similar functionality or traits.
- Proximity helps users understand and organize information faster and more efficiently.

#### UI Design Best Practices & Implementation Rules
- **Do:** Place form labels closer to their corresponding input field than to the preceding input field.
- **Do:** Keep headings closer to the content they introduce than to the section above them.
- **Do:** Cluster related buttons and metadata tags together while maintaining generous white space between unrelated groups.
- **Avoid (Anti-Pattern):** Equal spacing between all elements on a page, causing labels to look like they belong to the input above them.

#### Practical Case Examples
- **Google Search Results:** The spacing between each result on Google’s search results page contributes to the overall scannability of the page but also helps to effectively group each result as a related cluster of information.

#### Origins & Scientific Background
> The principles of grouping (or Gestalt laws of grouping) are a set of principles in psychology, first proposed by Gestalt psychologists to account for the observation that humans naturally perceive objects as organized patterns and objects, a principle known as Prägnanz. Gestalt psychologists argued that these principles exist because the mind has an innate disposition to perceive patterns in the stimulus based on certain rules. These principles are organized into five categories: Proximity, Similarity, Continuity, Closure, and Connectedness.

#### Recommended Reading & References
- *Gestalt Principles of Design — Proximity* — Chris Butler
- *Proximity Principle in Visual Design* — Aurora Harley | Nielsen Norman Group
- *Laws of Proximity, Uniform Connectedness, and Continuation* — Mads Soegaard | Interation Design Foundation
- *The Psychology Principles Every UI/UX Designer Needs to Know* — Thanasis Rigopoulos | Marvel

---

### <a id='law-of-similarity'></a>Law of Similarity

**Core Principle:** *The human eye tends to perceive similar elements as a complete picture, shape, or group, even if those elements are separated.*

- **Category:** `Theory` | **Tags:** `gestalt`
- **Official Link:** [https://lawsofux.com/law-of-similarity/](https://lawsofux.com/law-of-similarity/)

#### Key UX Takeaways
- Elements that are visually similar will be perceived as related.
- Color, shape, and size, orientation and movement can signal that elements belong to the same group and likely share a common meaning or functionality.
- Ensure that links and navigation systems are visually differentiated from normal text elements.

#### UI Design Best Practices & Implementation Rules
- **Do:** Ensure all elements of the same functional type share identical styling (e.g. all primary links share the same color/underline).
- **Do:** Give all primary CTAs consistent color, radius, and elevation across the entire app.
- **Do:** Use distinctive styling to indicate status (e.g. green pill for active, red pill for failed, amber for pending).
- **Avoid (Anti-Pattern):** Styling static decorative badges to look exactly like clickable pill buttons, inducing accidental clicks.

#### Origins & Scientific Background
> The principles of grouping (or Gestalt laws of grouping) are a set of principles in psychology, first proposed by Gestalt psychologists to account for the observation that humans naturally perceive objects as organized patterns and objects, a principle known as Prägnanz. Gestalt psychologists argued that these principles exist because the mind has an innate disposition to perceive patterns in the stimulus based on certain rules. These principles are organized into five categories: Proximity, Similarity, Continuity, Closure, and Connectedness.

#### Recommended Reading & References
- *Gestalt Principles of Design — Similarity* — Chris Butler
- *Similarity Principle in Visual Design* — Aurora Harley | Nielson Norman Group
- *The Law of Similarity - Gestalt Principles* — Interaction Deisgn Foundation | Mads Soegaard
- *Design Principles: Visual Perception And The Principles Of Gestalt* — Steven Bradley | Smashing Magazine

---

### <a id='law-of-uniform-connectedness'></a>Law of Uniform Connectedness

**Core Principle:** *Elements that are visually connected are perceived as more related than elements with no connection.*

- **Category:** `Theory` | **Tags:** `gestalt, proximity`
- **Official Link:** [https://lawsofux.com/law-of-uniform-connectedness/](https://lawsofux.com/law-of-uniform-connectedness/)

#### Key UX Takeaways
- Group functions of a similar nature so they are visually connected via colors, lines, frames, or other shapes.
- Alternately, you can use a tangible connecting reference (line, arrow, etc) from one element to the next to also create a visual connection.
- Use uniform connectedness to show context or to emphasize the relationship between similar items.

#### UI Design Best Practices & Implementation Rules
- **Do:** Connect related sequential steps with visible lines, stepper paths, or arrows.
- **Do:** Use tabs with an unbroken indicator underline connecting active tab to its content pane.
- **Do:** Enclose connected options in a segmented control or connected button group.
- **Avoid (Anti-Pattern):** A stepper flow where steps float as isolated dots with no connecting lines, obscuring the path relationship.

#### Practical Case Examples
- **Google Search Results:** The Law of Uniform Connectedness can be seen within Google’s search results with borders that surrounds specific items such as videos and ‘featured snippets’. This border helps to visually connect the content and also separate it from other results by giving it a bit more priority.

#### Origins & Scientific Background
> The principles of grouping (or Gestalt laws of grouping) are a set of principles in psychology, first proposed by Gestalt psychologists to account for the observation that humans naturally perceive objects as organized patterns and objects, a principle known as Prägnanz. Gestalt psychologists argued that these principles exist because the mind has an innate disposition to perceive patterns in the stimulus based on certain rules. These principles are organized into five categories: Proximity, Similarity, Continuity, Closure, and Connectedness.

#### Recommended Reading & References
- *Gestalt Principles of Perception* — Andy Rutledge
- *Laws of Proximity, Uniform Connectedness, and Continuation* — Interaction Design Foundation | Mads Soegaard
- *Design Principles: Visual Perception And The Principles Of Gestalt* — Steven Bradley | Smashing Magazine

---

### <a id='aesthetic-usability-effect'></a>Aesthetic-Usability Effect

**Core Principle:** *Users often perceive aesthetically pleasing design as design that’s more usable.*

- **Category:** `Theory` | **Tags:** `usability, research`
- **Official Link:** [https://lawsofux.com/aesthetic-usability-effect/](https://lawsofux.com/aesthetic-usability-effect/)

#### Key UX Takeaways
- An aesthetically pleasing design creates a positive response in people’s brains and leads them to believe the design actually works better.
- People are more tolerant of minor usability issues when the design of a product or service is aesthetically pleasing.
- Visually pleasing design can mask usability problems and prevent issues from being discovered during usability testing.

#### UI Design Best Practices & Implementation Rules
- **Do:** Invest in polished typography, whitespace rhythm, and color harmony to build instant user trust and forgiving perceptions.
- **Do:** Never use visual polish as an excuse for poor functionality—conduct task-completion usability testing to reveal masked friction.
- **Do:** Use subtle micro-interactions and transitions to make interfaces feel responsive and high quality.
- **Avoid (Anti-Pattern):** Designing a visually dazzling onboarding or dashboard that hides broken user flows, obscure icons, or illegible text contrast.

#### Origins & Scientific Background
> The aesthetic-usability effect was first studied in the field of human–computer interaction in 1995. Researchers Masaaki Kurosu and Kaori Kashimura from the Hitachi Design Center tested 26 variations of an ATM UI, asking the 252 study participants to rate each design on ease of use, as well as aesthetic appeal. They found a stronger correlation between the participants’ ratings of aesthetic appeal and perceived ease of use than the correlation between their ratings of aesthetic appeal and actual ease of use. Kurosu and Kashimura concluded that users are strongly influenced by the aesthetics of any given interface, even when they try to evaluate the underlying functionality of the system.

#### Recommended Reading & References
- *The Aesthetic-Usability Effect* — Kate Moran | Nielsen Norman Group
- *The Aesthetic Usability Effect and Prioritizing Appearance vs. Functionality* — Kathryn Whitenton | Nielsen Norman Group
- *Aesthetic Usability Effect* — Wikipedia
- *The Aesthetic-Usability Effect: Why Beautiful-Looking Products are Preferred Over Usable-But-Not-Beautiful Ones* — Abhishek Chakraborty | Medium

---

## 2. Decision Making & Cognitive Friction

### <a id='choice-overload'></a>Choice Overload

**Core Principle:** *The tendency for people to get overwhelmed when they are presented with a large number of options, often used interchangeably with the term paradox of choice.*

- **Category:** `Theory` | **Tags:** `usability, cognitive load, complexity, time`
- **Official Link:** [https://lawsofux.com/choice-overload/](https://lawsofux.com/choice-overload/)

#### Key UX Takeaways
- Too many options hurts users’ decision-making ability. How they feel about the experience as a whole can be significantly impacted as a result.
- When comparison is necessary, we can avoid choice overload by enabling side-by-side comparison of related items and options that require a decision (e.g. pricing tiers).
- We can avoid choice overload by optimizing our designs for the decision-making process and avoid overwhelming users by prioritizing the content that’s shown to them at any given moment (e.g. featured product), providing tools for narrowing down choices up front (e.g. search and filtering).

#### UI Design Best Practices & Implementation Rules
- **Do:** Limit primary navigation items to 5–7 top-level links.
- **Do:** In pricing tiers or checkout options, highlight one recommended option ('Most Popular') to anchor choice.
- **Do:** Use progressive disclosure: reveal advanced settings or sub-options only when the user requests them.
- **Avoid (Anti-Pattern):** Showing 25 uncurated filter options at once without categories, default selections, or smart sorting.

#### Origins & Scientific Background
> Overchoice or choice overload is the paradoxical phenomenon that choosing between a large variety of options can be detrimental to decision making processes. The term was first introduced by Alvin Toffler in his 1970 book, Future Shock.

#### Recommended Reading & References
- *The Paradox of Choice* — The Decision Lab
- *Choice Overload Impedes User Decision-Making [Video]* — Alita Kendrick | Nielsen Norman Group
- *Simplicity Wins over Abundance of Choice* — Hoa Loranger | Nielsen Norman Group

---

### <a id='chunking'></a>Chunking

**Core Principle:** *A process by which individual pieces of an information set are broken down and then grouped together in a meaningful whole.*

- **Category:** `Psychology` | **Tags:** `psychology, cognitive load, attention, memory`
- **Official Link:** [https://lawsofux.com/chunking/](https://lawsofux.com/chunking/)

#### Key UX Takeaways
- Chunking enables users to easily scan content. It allows them to easily identify the information that aligns with their goals and process that information to achieve their goals more quickly.
- Structuring content into visually distinct groups with a clear hierarchy enables designers to align information with how people evaluate and process digital content.
- Chunking can be used to help users understand underlying relationships by grouping content into distinctive modules, applying rules to separate content, and providing hierarchy.

#### UI Design Best Practices & Implementation Rules
- **Do:** Format long strings into distinct cognitive chunks (e.g. phone numbers `(555) 019-2834`, credit cards `4532 •••• •••• 9012`).
- **Do:** Divide complex multi-step forms into distinct steps with a clear progress bar (e.g. Contact -> Billing -> Review).
- **Do:** Use visual cards, containers, and dividers to break wall-of-text content into digestible blocks.
- **Avoid (Anti-Pattern):** A monolithic 20-field registration form rendered in a single continuous column without groupings or section headers.

#### Origins & Scientific Background
> The word chunking comes from a famous 1956 paper by George A. Miller, “The Magical Number Seven, Plus or Minus Two: Some Limits on Our Capacity for Processing Information”. At a time when information theory was beginning to be applied in psychology, Miller observed that some human cognitive tasks fit the model of a “channel capacity” characterized by a roughly constant capacity in bits, but short-term memory did not.

#### Recommended Reading & References
- *How Chunking Helps Content Processing* — Kate Moran | Nielsen Norman Group
- *Chunking* — Interaction Design Foundation
- *Why Chunking Content is Important [Video]* — Kate Moran | Nielsen Norman Group

---

### <a id='cognitive-bias'></a>Cognitive Bias

**Core Principle:** *A systematic error of thinking or rationality in judgment that influence our perception of the world and our decision-making ability.*

- **Category:** `Psychology` | **Tags:** `cognitive bias, memory`
- **Official Link:** [https://lawsofux.com/cognitive-bias/](https://lawsofux.com/cognitive-bias/)

#### Key UX Takeaways
- Rather than thinking through every situation, we conserve mental energy by developing rules of thumb to make decisions which are based on past experiences. These mental shortcuts increase our efficiency by enabling us to make quick decisions without the need to thoroughly analyze a situation but can also influence our decision-making processes and judgement without our awareness.
- Understanding of our own intrinsic biases may not eliminate them completely from our decision-making but it increases the chance that we can identify them in ourselves and others and serve as a safeguard against fallacious reasoning, unintentional discrimination or costly mistakes our decisions.
- Take for example our tendency to seek out, interpret, and recall information in a way that confirms their preconceived notions and ideas. This is known as confirmation bias, and it can make having a logical discussion about a polarizing hot-button issue with someone incredibly difficult.

#### UI Design Best Practices & Implementation Rules
- **Do:** Default to ethical, user-aligned defaults (opt-out of telemetry, opt-in for marketing).
- **Do:** Anchor pricing by showing the higher baseline or annualized savings clearly.
- **Do:** Provide confirmation dialogues with clear consequences for destructive actions to counteract confirmation bias.
- **Avoid (Anti-Pattern):** Dark patterns that exploit loss aversion, false urgency timers, or hidden pre-checked opt-in boxes.

#### Origins & Scientific Background
> Amos Tversky and Daniel Kahneman introduced the notion of cognitive biases in 1972 after they observed people’s inability to reason intuitively with greater orders of magnitude. In a series of replicable experiments, Tversky, Kahneman, and their colleagues demonstrated that human judgment and decision-making differ from rational choice theory. They explained human differences in judgment and decision-making in terms of heuristics, which are mental shortcuts that provide quick estimates about the probabilities of uncertain events. but can introduce severe and systematic errors.

#### Recommended Reading & References
- *Thinking, Fast and Slow [Book]* — Daniel Kahneman | Farrar, Straus and Giroux
- *Design for Cognitive Bias [Book]* — David Dylan Thomas | A Book Apart
- *Cognitive Bias Index [Website]* — Jon Yablonski
- *Decision Frames: How Cognitive Biases Affect UX Practitioners* — Kathryn Whitenton | Nielsen Norman Group

---

### <a id='cognitive-load'></a>Cognitive Load

**Core Principle:** *The amount of mental resources needed to understand and interact with an interface.*

- **Category:** `Psychology` | **Tags:** `psychology, cognitive load, attention, memory`
- **Official Link:** [https://lawsofux.com/cognitive-load/](https://lawsofux.com/cognitive-load/)

#### Key UX Takeaways
- When the amount of information coming in exceeds the space we have available, we struggle mentally to keep up — tasks become more difficult, details are missed, and we begin to feel overwhelmed.
- Intrinsic cognitive load refers to the effort required by users to carry around information relevant to their goal, absorb new information and keep track of their goals.
- Extraneous cognitive load refers to the mental processing that takes up resources but doesn't help users understand the content of an interface (e.g. distracting or unnecessary design elements).

#### UI Design Best Practices & Implementation Rules
- **Do:** Eliminate extraneous cognitive load by stripping decorative clutter that doesn't aid navigation or understanding.
- **Do:** Keep intrinsic cognitive load manageable by using familiar iconography and standard UI paradigms.
- **Do:** Support germane load by providing clear contextual hints, tooltips, and sensible keyboard shortcuts.
- **Avoid (Anti-Pattern):** Overloading a single dashboard screen with blinking badges, unorganized gauges, and conflicting CTA colors.

#### Origins & Scientific Background
> Cognitive load theory was developed in the late 1980s by John Sweller out of a study of problem solving and was in many ways an expansion on the information processing theories of George Miller. Sweller argued that instructional design can be used to reduce cognitive load in learners, culminating in his 1988 publication of “Cognitive Load Theory, Learning Difficulty, and Instructional Design”. Researchers later on developed a way to measure perceived mental effort which is indicative of cognitive load.

#### Recommended Reading & References
- *What Is Cognitive Load? [Video]* — Maddie Brown | Nielsen Norman Group
- *Ease Cognitive Overload in UX Design* — Mailchimp
- *Minimize Cognitive Load to Maximize Usability* — Kathryn Whitenton | Nielsen Norman Group
- *Design Principles for Reducing Cognitive Load* — Jon Yablonski | Laws of UX

---

### <a id='hicks-law'></a>Hick’s Law

**Core Principle:** *The time it takes to make a decision increases with the number and complexity of choices.*

- **Category:** `Theory` | **Tags:** `usability, cognitive load, complexity, time`
- **Official Link:** [https://lawsofux.com/hicks-law/](https://lawsofux.com/hicks-law/)

#### Key UX Takeaways
- Minimize choices when response times are critical to decrease decision time.
- Break complex tasks into smaller steps in order to decrease cognitive load.
- Avoid overwhelming users by highlighting recommended options.
- Use progressive onboarding to minimize cognitive load for new users.
- Be careful not to simplify to the point of abstraction.

#### UI Design Best Practices & Implementation Rules
- **Do:** Minimize choices to decrease decision response time; highlight recommended defaults.
- **Do:** Break down complex processes into discrete, bite-sized steps using progressive disclosure.
- **Do:** Provide intelligent search and filtering rather than forcing users to browse exhaustive categorical lists.
- **Avoid (Anti-Pattern):** A drop-down menu with 80 unorganized items in random order that freezes the user's decision-making.

#### Practical Case Examples
- **Google Homepage:** Google keeps the decisions required to enter a keyword to a minimum by eliminating any additional content that could distract from the act of typing a keyword or require additional decision-making.
- **Apple TV Remote:** Apple TV remotes don’t require a substantial amount of working memory and therefore incurs much less cognitive load. By transferring complexity to the TV interface itself, information can be effectively organized and progressively disclosed within menus.
- **Slack’s Progressive Onboarding:** Instead of dropping users into a fully featured app after enduring a few onboarding slides, Slack uses a bot to engage users and prompt them to learn the messaging feature consequence-free. To prevent new users from feeling overwhelmed, Slack hides all features except for the messaging input. Once users have learned how to message via Slackbot, they are progressively introduced to additional features.

#### Origins & Scientific Background
> Hick’s Law (or the Hick-Hyman Law) is named after a British and an American psychologist team of William Edmund Hick and Ray Hyman. In 1952, this pair set out to examine the relationship between the number of stimuli present and an individual’s reaction time to any given stimulus. As you would expect, the more stimuli to choose from, the longer it takes the user to make a decision on which one to interact with. Users bombarded with choices have to take time to interpret and decide, giving them work they don’t want.

#### Recommended Reading & References
- *UX Psychology: Google Search* — Jon Yablonski
- *The Choice Overload Effect: Why simplicity is the key to perfecting your experience* — Jennifer Clinehens | Medium
- *Hick’s Law: Making the choice easier for users* — Mads Soegaard | Interaction Design Foundation
- *Hick’s Law — Quick Decision Making* — Anton Nikolov | Medium.com

---

### <a id='occams-razor'></a>Occam’s Razor

**Core Principle:** *Among competing hypotheses that predict equally well, the one with the fewest assumptions should be selected.*

- **Category:** `Theory` | **Tags:** `research`
- **Official Link:** [https://lawsofux.com/occams-razor/](https://lawsofux.com/occams-razor/)

#### Key UX Takeaways
- The best method for reducing complexity is to avoid it in the first place.
- Analyze each element and remove as many as possible, without compromising the overall function.
- Consider completion only when no additional items can be removed.

#### UI Design Best Practices & Implementation Rules
- **Do:** Choose the design solution with the fewest assumptions and simplest path to goal.
- **Do:** Ruthlessly eliminate non-essential UI elements, decorations, and redundant steps that do not assist task completion.
- **Do:** Deliver complete experiences with fewer moving parts rather than bloated multipurpose screens.
- **Avoid (Anti-Pattern):** Adding 4 confirmation modals, 2 drop-downs, and a captchas for an internal routine low-risk action.

#### Origins & Scientific Background
> Occam’s razor (also Ockham’s razor; Latin: lex parsimoniae "law of parsimony") is a problem-solving principle that, when presented with competing hypothetical answers to a problem, one should select the one that makes the fewest assumptions. The idea is attributed to William of Ockham (c. 1287–1347), who was an English Franciscan friar, scholastic philosopher, and theologian.

#### Recommended Reading & References
- *How to Use Occam’s Razor Without Getting Cut* — Farnam Street
- *Designing with Occam’s Razor* — Jon Yablonski | Medium
- *Occam’s Razor: The Simplest Solution is Always the Best* — Mads Soegaard | Interaction Design Foundation
- *Complexity Bias: Why We Prefer Complicated to Simple* — Farnam Street

---

## 3. Ergonomics, Physics & Interaction

### <a id='fittss-law'></a>Fitts’s Law

**Core Principle:** *The time to acquire a target is a function of the distance to and size of the target.*

- **Category:** `Theory` | **Tags:** `usability, time, proximity`
- **Official Link:** [https://lawsofux.com/fittss-law/](https://lawsofux.com/fittss-law/)

#### Key UX Takeaways
- Touch targets should be large enough for users to accurately select them.
- Touch targets should have ample spacing between them.
- Touch targets should be placed in areas of an interface that allow them to be easily acquired.

#### UI Design Best Practices & Implementation Rules
- **Do:** Design touch targets to be at least 44x44 pt (iOS) or 48x48 dp (Android) with at least 8dp padding between adjacent targets.
- **Do:** Place primary mobile actions in the bottom thumb zone (bottom navigation bar, sticky bottom action bar).
- **Do:** Pin top desktop menus and dock items to screen edges or corners where the effective target depth is infinite.
- **Avoid (Anti-Pattern):** Tiny 14px link texts clustered right next to each other on mobile screens, causing frequent mis-taps.

#### Origins & Scientific Background
> In 1954, psychologist Paul Fitts, examining the human motor system, showed that the time required to move to a target depends on the distance to it, yet relates inversely to its size. By his law, fast movements and small targets result in greater error rates, due to the speed-accuracy trade-off. Although multiple variants of Fitts’ law exist, all encompass this idea. Fitts’ law is widely applied in user experience (UX) and user interface (UI) design. For example, this law influenced the convention of making interactive buttons large (especially on finger-operated mobile devices)—smaller buttons are more difficult (and time-consuming) to click. Likewise, the distance between a user’s task/attention area and the task-related button should be kept as short as possible.

#### Recommended Reading & References
- *Fitts's Law and Its Applications in UX* — Nielsen Norman Group
- *Fitts’ Law In The Touch Era* — Smashing Magazine
- *Fitts’s Law: The Importance of Size and Distance in UI Design* — Interaction Design Foundation
- *Fitts’s Law on Wikipedia* — Wikipedia

---

### <a id='doherty-threshold'></a>Doherty Threshold

**Core Principle:** *Productivity soars when a computer and its users interact at a pace (<400ms) that ensures that neither has to wait on the other.*

- **Category:** `Theory` | **Tags:** `usability, time`
- **Official Link:** [https://lawsofux.com/doherty-threshold/](https://lawsofux.com/doherty-threshold/)

#### Key UX Takeaways
- Provide system feedback within 400 ms in order to keep users’ attention and increase productivity.
- Use perceived performance to improve response time and reduce the perception of waiting.
- Animation is one way to visually engage people while loading or processing is happening in the background.
- Progress bars help make wait times tolerable, regardless of their accuracy.
- Purposefully adding a delay to a process can actually increase its perceived value and instill a sense of trust, even when the process itself actually takes much less time.

#### UI Design Best Practices & Implementation Rules
- **Do:** Provide immediate visual feedback (<100ms) on tap or click (active states, ripple animations, button spinners).
- **Do:** Ensure system responses return within 400ms to maintain seamless user focus and productivity flow.
- **Do:** For operations taking >400ms, use skeleton screens, animated loaders, or optimistic UI updates.
- **Avoid (Anti-Pattern):** Freezing the UI or leaving a button unresponsive without visual feedback while awaiting a remote network call.

#### Origins & Scientific Background
> In 1982 Walter J. Doherty and Ahrvind J. Thadani published, in the IBM Systems Journal, a research paper that set the requirement for computer response time to be 400 milliseconds, not 2,000 (2 seconds) which had been the previous standard. When a human being’s command was executed and returned an answer in under 400 milliseconds, it was deemed to exceed the Doherty threshold, and use of such applications were deemed to be “addicting” to users.

#### Recommended Reading & References
- *The Economic Value of Rapid Response Time* — Jim Elliott
- *This 70s UX gem still applies today* — Michael Gugel | Medium
- *The Economic Value of Rapid Response Time* — Dave Rupert
- *The importance of percent-done progress indicators for computer-human interfaces* — Brad A. Myers

---

### <a id='parkinsons-law'></a>Parkinson’s Law

**Core Principle:** *Any task will inflate until all of the available time is spent.*

- **Category:** `Theory` | **Tags:** `research`
- **Official Link:** [https://lawsofux.com/parkinsons-law/](https://lawsofux.com/parkinsons-law/)

#### Key UX Takeaways
- Limit the time it takes to complete a task to what users expect it’ll take.
- Reducing the actual duration to complete a task from the expected duration will improve the overall user experience.
- Leverage features such as autofill to save the user time when providing critical information within forms. This allows for quick completion of purchases, bookings and other such functions while preventing task inflation.

#### UI Design Best Practices & Implementation Rules
- **Do:** Use features like autofill, smart defaults, and geolocation to dramatically compress the time needed to fill forms.
- **Do:** Provide clear visual cues when time limits apply (e.g. concert seat reservations) to encourage prompt completion.
- **Do:** Reduce friction in recurring workflows to prevent users from feeling that an admin task consumes their entire day.
- **Avoid (Anti-Pattern):** Requiring repetitive manual entry of address, city, and state when postal code lookup could automate it.

#### Origins & Scientific Background
> Articulated by Cyril Northcote Parkinson as part of the first sentence of a humorous essay published in The Economist in 1955 and since republished online, it was reprinted with other essays in the book Parkinson’s Law: The Pursuit of Progress (London, John Murray, 1958). He derived the dictum from his extensive experience in the British Civil Service.

#### Recommended Reading & References
- *Parkinson’s Law on Wikipedia* — Wikipedia
- *Parkinson’s Law: Why Constraints Are The Best Thing You Can Work With* — Louis Chew | Medium.com

---

## 4. Memory, Attention & Retention

### <a id='millers-law'></a>Miller’s Law

**Core Principle:** *The average person can only keep 7 (plus or minus 2) items in their working memory.*

- **Category:** `Theory` | **Tags:** `usability, cognitive load, memory`
- **Official Link:** [https://lawsofux.com/millers-law/](https://lawsofux.com/millers-law/)

#### Key UX Takeaways
- Don’t use the “magical number seven” to justify unnecessary design limitations.
- Organize content into smaller chunks to help users process, understand, and memorize easily.
- Remember that short-term memory capacity will vary per individual, based on their prior knowledge and situational context.

#### UI Design Best Practices & Implementation Rules
- **Do:** Do not force users to hold more than 5–9 pieces of ephemeral information in memory simultaneously.
- **Do:** Organize content into 5–7 thematic categories with sub-navigation rather than 30 flat items.
- **Do:** Recognize that 7±2 applies to working memory capacity, not a rigid rule for the number of navigation links.
- **Avoid (Anti-Pattern):** Requiring a user to memorize an order number on Screen A to manually re-type it on Screen B.

#### Practical Case Examples
- **Chunking:** Chunking can organize content to help users process, understand, and memorize easily.

#### Origins & Scientific Background
> In 1956, George Miller asserted that the span of immediate memory and absolute judgment were both limited to around 7 pieces of information. The main unit of information is the bit, the amount of data necessary to make a choice between two equally likely alternatives. Likewise, 4 bits of information is a decision between 16 binary alternatives (4 successive binary decisions). The point where confusion creates an incorrect judgment is the channel capacity. In other words, the quantity of bits which can be transmitted reliably through a channel, within a certain amount of time.

#### Recommended Reading & References
- *Miller’s Law, Chunking, and the Capacity of Working Memory* — Khan Academy
- *Design Principles for Reducing Cognitive Load* — Jon Yablonski | Medium.com
- *The Magical Mystery Four: How is Working Memory Capacity Limited, and Why?* — Nelson Cowan | NCBI
- *Miller’s Law on Wikipedia* — Wikipedia

---

### <a id='selective-attention'></a>Selective Attention

**Core Principle:** *The process of focusing our attention only to a subset of stimuli in an environment — usually those related to our goals.*

- **Category:** `Psychology` | **Tags:** `psychology, attention, cognitive bias`
- **Official Link:** [https://lawsofux.com/selective-attention/](https://lawsofux.com/selective-attention/)

#### Key UX Takeaways
- People often filter out information that isn’t relevant. This happens in order to maintain focus on information that is important or relevant to the task at hand. Designers must guide users’ attention, prevent them from being overwhelmed or distracted, and help them find relevant information or action.
- Banner Blindness is an example phenomenon of selection attention where visitors to a website consciously or unconsciously ignore banner-like information. Users have learned to ignore content that resembles ads, is close to ads, or appears in locations traditionally dedicated to ads. Avoid confusion by not styling content to look like ads or placing content and ads in the same visual section.
- Change blindness is another example phenomenon of selection attention that occurs when significant changes in an interface go unnoticed because due to the limitations of human attention and the lack of strong cues. Avoid this by analyzing your design for any competing changes that may happen at the same time and that may divert attention from each other.

#### UI Design Best Practices & Implementation Rules
- **Do:** Design key information to align directly with the user’s primary focal path and task goal.
- **Do:** Avoid placing critical actions or alerts in locations that resemble ad banners (top banners often get ignored).
- **Do:** Use contrasting typography, color, and positioning to guide visual scan paths hierarchically.
- **Avoid (Anti-Pattern):** Placing vital system notices in flashing marquee ribbons at the top of the page that users subconsciously filter out.

#### Origins & Scientific Background
> Selective Attention Theory originated in the mid-20th century as researchers sought to understand how humans process information from their environment. The theory developed through several key contributions: - Donald Broadbent’s Filter Theory (1958): Broadbent proposed the first comprehensive model of selective attention, known as the Filter Theory. He suggested that there is an attentional “bottleneck” that allows only limited information to be processed at a time. According to this model, information is initially filtered based on physical characteristics before semantic processing occurs. - Cherry’s Cocktail Party Effect (1953): E. Colin Cherry conducted seminal work on the “cocktail party phenomenon,” using dichotic listening tasks to study how people selectively attend to one auditory stream while ignoring others. - Anne Treisman’s Attenuation Model (1960): Treisman refined Broadbent’s theory, proposing that unattended information is not completely blocked but rather attenuated. This allowed for the explanation of how some unattended information could still be processed. - Deutsch and Deutsch’s Late Selection Theory (1963): This theory proposed that all sensory information is fully processed for meaning before selection occurs, contrasting with Broadbent’s early selection model. The development of these theories was driven by both practical concerns and theoretical interests. For instance, Mackworth’s research on vigilance in 1950 was motivated by concerns about radar operators’ performance during World War II. Throughout the 1950s to 1970s, research on attention shifted from primarily auditory tasks to visual tasks. This period also saw the emergence of capacity theories, such as Kahneman’s (1973) model, which viewed attention as a limited resource that could be divided among different tasks. These early theories and experiments laid the foundation for our current understanding of selective attention and continue to influence research in cognitive psychology and neuroscience today.

#### Recommended Reading & References
- *Change Blindness in UX: Definition* — Raluca Budiu | Nielsen Norman Group
- *Banner Blindness Revisited: Users Dodge Ads on Mobile and Desktop* — Kara Pernice | Nielsen Norman Group
- *How We Use Selective Attention to Filter Information and Focus* — Kendra Cherry, MSEd | VerywellMind
- *Tunnel Vision and Selective Attention* — Jakob Nielsen | Nielsen Norman Group

---

### <a id='serial-position-effect'></a>Serial Position Effect

**Core Principle:** *Users have a propensity to best remember the first and last items in a series.*

- **Category:** `Theory` | **Tags:** `cognitive bias, memory`
- **Official Link:** [https://lawsofux.com/serial-position-effect/](https://lawsofux.com/serial-position-effect/)

#### Key UX Takeaways
- Placing the least important items in the middle of lists can be helpful because these items tend to be stored less frequently in long-term and working memory.
- Positioning key actions on the far left and right within elements such as navigation can increase memorization.

#### UI Design Best Practices & Implementation Rules
- **Do:** Place the most critical navigation items at the very beginning (Primacy Effect) and very end (Recency Effect) of menus.
- **Do:** In mobile tab bars, place the primary feed/home on the far left, and account/checkout/action on the far right.
- **Do:** Place key conversion options or summary highlights at the beginning and end of long landing pages.
- **Avoid (Anti-Pattern):** Burying the most important CTA or filter in the middle of a long horizontal scroll list where it is easily forgotten.

#### Origins & Scientific Background
> The serial position effect, a term coined by Herman Ebbinghaus, describes how the position of an item in a sequence affects recall accuracy. The two concepts involved, the primacy effect and the recency effect, explains how items presented at the beginning of a sequence and the end of a sequence are recalled with greater accuracy than items in the middle of a list. Manipulation of the serial position effect to create better user experiences is reflected in many popular designs by successful companies like Apple, Electronic Arts, and Nike.

#### Recommended Reading & References
- *Serial Position Effect: How to Create Better User Interfaces* — Euphemia Wong | Interaction Design Foundation
- *The Serial Position Effect: Why ABC and XYZ Stand Out the Most Among All the Alphabets* — Abhishek Chakraborty | Medium.com
- *Psychology in Design (Part 1)* — Andri Budzinskiy | Medium.com
- *Serial Position Effect on Wikipedia* — Wikipedia

---

### <a id='von-restorff-effect'></a>Von Restorff Effect

**Core Principle:** *The Von Restorff effect, also known as The Isolation Effect, predicts that when multiple similar objects are present, the one that differs from the rest is most likely to be remembered.*

- **Category:** `Theory` | **Tags:** `attention, cognitive bias`
- **Official Link:** [https://lawsofux.com/von-restorff-effect/](https://lawsofux.com/von-restorff-effect/)

#### Key UX Takeaways
- Make important information or key actions visually distinctive.
- Use restraint when placing emphasis on visual elements to avoid them competing with one another and to ensure salient items don’t get mistakenly identified as ads.
- Don’t exclude those with a color vision deficiency or low vision by relying exclusively on color to communicate contrast.
- Carefully consider users with motion sensitivity when using motion to communicate contrast.

#### UI Design Best Practices & Implementation Rules
- **Do:** Make your primary Call-to-Action visually distinctive from all other surrounding elements (accent color, size, contrast).
- **Do:** Highlight recommended or featured pricing tiers with distinctive elevation, badge, or border.
- **Do:** Use isolation sparingly—if everything is highlighted or shouting for attention, nothing stands out.
- **Avoid (Anti-Pattern):** Making 5 buttons on the same screen have identical primary solid blue backgrounds, confusing the user on what to click.

#### Origins & Scientific Background
> The theory was coined by German psychiatrist and pediatrician Hedwig von Restorff (1906–1962), who, in her 1933 study, found that when participants were presented with a list of categorically similar items with one distinctive, isolated item on the list, memory for the item was improved.

#### Recommended Reading & References
- *Psychology in Design (Part 1)* — Andri Budzinskiy | Medium.com
- *The Psychology Principles Every UI/UX Designer Needs to Know* — Thanasis Rigopoulos | Marvel
- *Von Restorff Effect on Wikipedia* — Wikipedia
- *Superior pattern processing is the essence of the evolved human brain* — Mark P. Mattson

---

### <a id='working-memory'></a>Working Memory

**Core Principle:** *A cognitive system that temporarily holds and manipulates information needed to complete tasks.*

- **Category:** `Psychology` | **Tags:** `psychology, attention, memory`
- **Official Link:** [https://lawsofux.com/working-memory/](https://lawsofux.com/working-memory/)

#### Key UX Takeaways
- Working memory is limited to 4-7 chunks of information at any given moment with each chunk fades after 20-30 seconds. We use it to keep track of information in order to achieve tasks but we often have trouble remembering what information we’ve already seen. Designers must be mindful of this limit when displaying information to users and ensure it’s both necessary and relevant.
- Our brains are good at recognizing something we’ve seen before but not at keeping new information ready to be used. We can support recognition over recall by making it clear what information has already been viewed (e.g. visually differentiating visited links and providing breadcrumbs links).
- Place burden of memory on the system, not the user. We can lessen the burden of memorizing critical information by carrying it over from screen to screen when necessary (e.g. comparison tables that make comparing multiple items easy).

#### UI Design Best Practices & Implementation Rules
- **Do:** Never require users to remember information across different screens or modal views.
- **Do:** Provide persistent contextual indicators (breadcrumbs, sticky cart summaries, active filters).
- **Do:** Offer visual recognition over recall—use thumbnail previews, auto-suggest, and recently viewed lists.
- **Avoid (Anti-Pattern):** Asking a user to select an item, then on the next page asking them to remember and enter its item code.

#### Origins & Scientific Background
> The term “working memory” was coined by George A. Miller, Eugene Galanter, and Karl H. Pribram, and was used in the 1960s in the context of theories that likened the mind to a computer. In 1968, Richard C. Atkinson and Richard M. Shiffrin used the term to describe their “short-term store”. The term short-term store was the name previously used for working memory. Other suggested names were short-term memory, primary memory, immediate memory, operant memory, and provisional memory. Short-term memory is the ability to remember information over a brief period (in the order of seconds). Most theorists today use the concept of working memory to replace or include the older concept of short-term memory, marking a stronger emphasis on the notion of manipulating information rather than mere maintenance. The earliest mention of experiments on the neural basis of working memory can be traced back to more than 100 years ago, when Eduard Hitzig and Sir David Ferrier described ablation experiments of the prefrontal cortex (PFC); they concluded that the frontal cortex was important for cognitive rather than sensory processes. In 1935 and 1936, Carlyle Jacobsen and colleagues were the first to show the deleterious effect of prefrontal ablation on delayed response.

#### Recommended Reading & References
- *Working Memory and External Memory* — Raluca Budiu | Nielsen Norman Group
- *Working Memory and External Memory [Video]* — Raluca Budiu | Nielsen Norman Group
- *Reducing Cognitive Overload For A Better User Experience* — Danny Halarewich | Smashing Magazine

---

## 5. Behavioral Motivation & Emotional Experience

### <a id='flow'></a>Flow

**Core Principle:** *The mental state in which a person performing some activity is fully immersed in a feeling of energized focus, full involvement, and enjoyment in the process of the activity.*

- **Category:** `Psychology` | **Tags:** `usability, focus, time`
- **Official Link:** [https://lawsofux.com/flow/](https://lawsofux.com/flow/)

#### Key UX Takeaways
- Flow occurs when there is a balance between the difficulty of a task with the level of skill at the given task. It’s characterized by intense and focused concentration on the present, combined with a sense of total control.
- A task that’s too difficult leads to heighten frustration while a task that’s too easy can lead to boredom. Finding the right balance requires matching the challenge with skill of the user.
- Design for flow by providing the necessary feedback so that the user know what action has been done and what has been accomplished.
- Optimize for efficiency and system responsiveness by removing any unnecessary friction, and making content and features available for discovery to avoid disengagement with the interface.

#### UI Design Best Practices & Implementation Rules
- **Do:** Balance user skill and task challenge with clear immediate feedback and frictionless navigation.
- **Do:** Remove unnecessary interruptions, popups, and modal dialogs during focused creation or checkout workflows.
- **Do:** Preserve user input state automatically so fear of data loss never disrupts flow.
- **Avoid (Anti-Pattern):** Interrupting a user typing a document or filling an order with modal survey requests or unrelated promotional banners.

#### Origins & Scientific Background
> Flow was coined by psychologist Mihály Csíkszentmihályi in 1975 and has been widely referred to across a variety of fields (and is particularly well recognized in occupational therapy), though the concept has been claimed to have existed for thousands of years under other names.

#### Recommended Reading & References
- *The 3 design principles for creating flow* — Rahul Vohra | Superhuman
- *Designing For Flow* — Jim Ramsey | A List Apart
- *7 Steps to Achieving Flow in UX Design* — Elaine Tran | UX Collective
- *Beyond Task Completion: Flow in Design* — Dana Chisnell | UX Magazine

---

### <a id='goal-gradient-effect'></a>Goal-Gradient Effect

**Core Principle:** *The tendency to approach a goal increases with proximity to the goal.*

- **Category:** `Theory` | **Tags:** `proximity, progress`
- **Official Link:** [https://lawsofux.com/goal-gradient-effect/](https://lawsofux.com/goal-gradient-effect/)

#### Key UX Takeaways
- The closer users are to completing a task, the faster they work towards reaching it.
- Providing artificial progress towards a goal will help to ensure users are more likely to have the motivation to complete that task.
- Provide a clear indication of progress in order to motivate users to complete tasks.

#### UI Design Best Practices & Implementation Rules
- **Do:** Provide an artificial head start (e.g., 'Step 1 of 5 already completed: Account created') to accelerate completion.
- **Do:** Display visual progress bars or completion percentages that visibly advance with every action taken.
- **Do:** Celebrate milestones with micro-animations (checkmarks, badges) as the user gets closer to 100% completion.
- **Avoid (Anti-Pattern):** Multi-step wizards that give zero indication of how many steps remain or hide progress until the final screen.

#### Origins & Scientific Background
> The goal-gradient hypothesis, originally proposed by the behaviorist Clark Hull in 1932, states that the tendency to approach a goal increases with proximity to the goal. In a classic experiment that tests this hypothesis, Hull (1934) found that rats in a straight alley ran progressively faster as they proceeded from the starting box to the food. Although the goal-gradient hypothesis has been investigated exten-sively with animals (e.g., Anderson 1933; Brown 1948; for a review, see Heilizer 1977), its implications for human behavior and decision making are understudied. Further-more, this issue has important theoretical and practical implications for intertemporal consumer behavior in reward programs (hereinafter RPs) and other types of motivational systems (e.g., Deighton 2000; Hsee, Yu, and Zhang 2003; Kivetz 2003; Lal and Bell 2003).

#### Recommended Reading & References
- *How Uber uses psychology to perfect their customer experience* — Jennifer Clinehens | Choice Hacking
- *Moving the Finish Line: The Goal Gradient Hypothesis* — Farnam Street
- *Designing for motivation with the goal-gradient effect* — Ian Batterbee | UX Collective
- *The Goal-Gradient Hypothesis Resurrected: Purchase Acceleration, Illusionary Goal Progress, and Customer Retention* — Ran Kivetz, Oleg Urminsky, Yuhuang Zheng | uchicago.edu

---

### <a id='peak-end-rule'></a>Peak-End Rule

**Core Principle:** *People judge an experience largely based on how they felt at its peak and at its end, rather than the total sum or average of every moment of the experience.*

- **Category:** `Theory` | **Tags:** `cognitive bias, memory`
- **Official Link:** [https://lawsofux.com/peak-end-rule/](https://lawsofux.com/peak-end-rule/)

#### Key UX Takeaways
- Pay close attention to the most intense points and the final moments (the “end”) of the user journey.
- Identify the moments when your product is most helpful, valuable, or entertaining and design to delight the end user.
- Remember that people recall negative experiences more vividly than positive ones.

#### UI Design Best Practices & Implementation Rules
- **Do:** Design memorable, delightful peaks during the most critical milestone of a user's journey (e.g., celebratory confetti on job booked).
- **Do:** Ensure the final touchpoint (the 'end') of an interaction is smooth, reassuring, and clearly confirmed.
- **Do:** Transform painful moments (404 errors, network failures) into pleasant recovery experiences with helpful options.
- **Avoid (Anti-Pattern):** Ending an otherwise great checkout experience with an ambiguous blank screen or an ugly raw JSON error.

#### Practical Case Examples
- **Mailchimp:** Mailchimp understands this is an important moment, especially for first-time users, so it goes beyond presenting a simple confirmation modal. By infusing a touch of brand character through illustration, subtle animation, and humor, the tool defuses what could potentially be a stressful moment.
- **Uber:** Negative events also provide emotional peaks and can contribute to a user’s lasting impression of an experience. By focusing on people’s perceptions of time and waiting, Uber was able to reduce its post-request cancellation rate and avoid what could easily become a negative emotional peak while using their service.

#### Origins & Scientific Background
> A 1993 study titled “When More Pain Is Preferred to Less: Adding a Better End” by Kahneman, Fredrickson, Charles Schreiber, and Donald Redelmeier provided groundbreaking evidence for the peak–end rule. Participants were subjected to two different versions of a single unpleasant experience. The first trial had subjects submerge a hand in 14°C water for 60 seconds. The second trial had subjects submerge the other hand in 14°C water for 60 seconds, but then keep their hand submerged for an additional 30 seconds, during which the temperature was raised to 15 °C. Subjects were then offered the option of which trial to repeat. Against the law of temporal monotonicity, subjects were more willing to repeat the second trial, despite a prolonged exposure to uncomfortable temperatures. Kahneman et al. concluded that “subjects chose the long trial simply because they liked the memory of it better than the alternative (or disliked it less)”.

#### Recommended Reading & References
- *Peak–End Rule* — Jon Yablonski
- *How Uber uses psychology to perfect their customer experience* — Jennifer Clinehens | Medium
- *The Peak–End Rule: How Impressions Become Memories* — Lexie Kane | Nielsen Norman Group
- *What is Peak-End Theory? A Psychologist Explains How Our Memory Fools Us* — Positive Psychology

---

### <a id='zeigarnik-effect'></a>Zeigarnik Effect

**Core Principle:** *People remember uncompleted or interrupted tasks better than completed tasks.*

- **Category:** `Theory` | **Tags:** `progress, memory`
- **Official Link:** [https://lawsofux.com/zeigarnik-effect/](https://lawsofux.com/zeigarnik-effect/)

#### Key UX Takeaways
- Invite content discovery by providing clear signifiers of additional content.
- Providing artificial progress towards a goal will help to ensure users are more likely to have the motivation to complete that task.
- Provide a clear indication of progress in order to motivate users to complete tasks.

#### UI Design Best Practices & Implementation Rules
- **Do:** Provide explicit visual progress indicators for multi-step tasks (e.g. 'Profile 70% complete — add photo to finish').
- **Do:** Allow users to save unfinished drafts and prominently display them upon return to encourage completion.
- **Do:** Break complex tasks into small, achievable milestones that create momentum to finish the incomplete workflow.
- **Avoid (Anti-Pattern):** Discarding incomplete user submissions without warning or draft saving, demoralizing the user from returning.

#### Origins & Scientific Background
> Bluma Wulfovna Zeigarnik (1900 – 1988) was a Soviet psychologist and psychiatrist, a member of the Berlin School of experimental psychology and Vygotsky Circle. She discovered the Zeigarnik effect and contributed to the establishment of experimental psychopathology as a separate discipline in the Soviet Union in the post-World War II period. In the 1920s she conducted a study on memory, in which she compared memory in relation to incomplete and complete tasks. She had found that incomplete tasks are easier to remember than successful ones. This is now known as the Zeigarnik effect. She later began working at the Institute of Higher Nervous Activity which is where she would meet her next big influence Vygowsky, and become a part of his circle of scientists. It was also there that Zeigarnik founded the Department of Psychology. During that time, Zeigarnik received the Lewin Memorial Award in 1983 for her psychological research.

#### Recommended Reading & References
- *How to Use the Zeigarnik Effect in UX* — Feifei Liu | Nielsen Norman Group
- *Endowed progress effect: Give your users a head start* — Canvs Editorial | UX Collective
- *Moving the Finish Line: The Goal Gradient Hypothesis* — Farnam Street
- *The Zeigarnik Effect: Why it is so hard to leave things incomplete* — Abhishek Chakraborty | Medium.com

---

### <a id='pareto-principle'></a>Pareto Principle

**Core Principle:** *The Pareto principle states that, for many events, roughly 80% of the effects come from 20% of the causes.*

- **Category:** `Theory` | **Tags:** `research`
- **Official Link:** [https://lawsofux.com/pareto-principle/](https://lawsofux.com/pareto-principle/)

#### Key UX Takeaways
- Inputs and outputs are often not evenly distributed.
- A large group may contain only a few meaningful contributors to the desired outcome.
- Focus the majority of effort on the areas that will bring the largest benefits to the most users.

#### UI Design Best Practices & Implementation Rules
- **Do:** Focus design effort and screen real estate on the 20% of features that drive 80% of daily user activities.
- **Do:** Keep the most vital actions prominent and readily accessible in the top-level viewport.
- **Do:** De-prioritize edge-case settings into secondary menus or overflow drawers.
- **Avoid (Anti-Pattern):** Giving equal visual weight and top-level toolbar placement to obscure debug settings and daily core workflows.

#### Origins & Scientific Background
> Its origins stem back to Vilfredo Pareto, an economist who noticed 80% of Italy’s land was owned by 20% of the population. Though it might seem vague, the 80/20 way of thinking can provide insightful and endlessly applicable analysis of lopsided systems, including user experience strategy.

#### Recommended Reading & References
- *Good UX is not just about minimizing clicks* — Avi Siegel | UX Collective
- *Prioritize Quantitative Data with the Pareto Principle* — Evan Sunwall | Nielsen Norman Group
- *The 80/20 Rule in User Experience* — Arin Bhowmick | Medium
- *Applying the Pareto Principle to the User Experience* — Jeff Sauro | Measuring U

---

## 6. Mental Models & Robust Systems

### <a id='jakobs-law'></a>Jakob’s Law

**Core Principle:** *Users spend most of their time on other sites. This means that users prefer your site to work the same way as all the other sites they already know.*

- **Category:** `Theory` | **Tags:** `usability, mental model`
- **Official Link:** [https://lawsofux.com/jakobs-law/](https://lawsofux.com/jakobs-law/)

#### Key UX Takeaways
- Users will transfer expectations they have built around one familiar product to another that appears similar.
- By leveraging existing mental models, we can create superior user experiences in which the users can focus on their tasks rather than on learning new models.
- When making changes, minimize discord by empowering users to continue using a familiar version for a limited time.

#### UI Design Best Practices & Implementation Rules
- **Do:** Adhere to established web and mobile patterns (shopping cart top-right, search bar with magnifying glass, logo top-left returning home).
- **Do:** Allow users to transfer skills seamlessly from other popular apps without requiring a tutorial.
- **Do:** When introducing a redesign, provide gradual rollout, preview modes, or backward compatibility to avoid jarring friction.
- **Avoid (Anti-Pattern):** Re-inventing standard navigation controls (like replacing a hamburger/tab bar with a cryptic gesture-only radial dial).

#### Practical Case Examples
- **Form Controls:** Things like form toggles, radio inputs, and even buttons originated from the design of their tactile counterparts.
- **YouTube Redesign:** When YouTube launched a new version in 2017 after years of essentially the same design, they allowed desktop users to ease into the new Material Design UI without having to commit. Users could preview the new design, gain some familiarity, submit feedback, and even revert to the old version if they preferred it. As a result, the inevitable mental model discordance was avoided by simply empowering users to switch when they were ready.

#### Origins & Scientific Background
> Jakob’s Law was coined by Jakob Nielsen, a User Advocate and principal of the Nielsen Norman Group which he co-founded with Dr. Donald A. Norman (former VP of research at Apple Computer). Dr. Nielsen established the ‘discount usability engineering’ movement for fast and cheap improvements of user interfaces and has invented several usability methods, including heuristic evaluation.

#### Recommended Reading & References
- *Jakob’s Law of Internet User Experience* — Nielsen Norman Group
- *The Power Law of Learning: Consistency vs. Innovation in User Interfaces* — Nielsen Norman Group
- *Familiar vs Novel* — Jon Yablonski | Laws of UX
- *Top 10 Mistakes in Web Design* — Nielsen Norman Group

---

### <a id='mental-model'></a>Mental Model

**Core Principle:** *A compressed model based on what we think we know about a system and how it works.*

- **Category:** `Psychology` | **Tags:** `psychology, usability, mental model`
- **Official Link:** [https://lawsofux.com/mental-model/](https://lawsofux.com/mental-model/)

#### Key UX Takeaways
- We form a working model in our minds around what we think we know about a system, especially about how it works, and then we apply that model to new situations where the system is similar.
- Match designs to the users’ mental models to improve their experience. This enables them to easily transfer their knowledge from one product or experience to another, without the need to first take the time to understand how the new system works.
- Good user experiences are made possible when the design of a product or service is in alignment with the user’s mental model. Take for example e-commerce websites, which use consistent patterns and conventions such product cards, virtual carts and checkout flows in order to conform to users’ expectations.
- The task of shrinking the gap between our own mental models and those of the users is one of the biggest challenges we face, and to achieve this goal we use a variety of user research methods (e.g. user interviews, personas, journey maps, empathy maps).

#### UI Design Best Practices & Implementation Rules
- **Do:** Align interface behavior with real-world user expectations (e.g. swiping a card, pulling down to refresh).
- **Do:** Bridge the gap between designer mental models and end-user mental models through ongoing user research.
- **Do:** Use clear system status indicators so users always understand what state the application is currently in.
- **Avoid (Anti-Pattern):** Using internal engineering jargon or database column names in customer-facing error messages and labels.

#### Origins & Scientific Background
> The notion of a mental model was originally postulated by the psychologist Kenneth Craik in the 1943 book The Nature of Explanation (1943). He proposed that people carry in their minds a small-scale model of how the world works. These models are used to anticipate events, reason, and form explanations.

#### Recommended Reading & References
- *Mental Models: An Interdisciplinary Synthesis of Theory and Methods* — Natalie A. Jones, Helen Ross, Timothy Lynam, Pascal Perez, Anne Leitch | JSTOR
- *Mental Models in User Experience Design* — Megan Chan and Jakob Nielsen | Nielsen Norman Group
- *Familiar vs Novel* — Jon Yablonski | Laws of UX
- *Mental Models* — Dr. Lauren Braithwaite | The Decision Lab

---

### <a id='paradox-of-the-active-user'></a>Paradox of the Active User

**Core Principle:** *Users never read manuals but start using the software immediately.*

- **Category:** `Theory` | **Tags:** `research, paradox`
- **Official Link:** [https://lawsofux.com/paradox-of-the-active-user/](https://lawsofux.com/paradox-of-the-active-user/)

#### Key UX Takeaways
- Users are often motivated to complete their immediate tasks and therefore they don't want to spend time up front reading documentation.
- This paradox exist because users will save time in the long term if they take the time to optimize the system and learn more about it.
- Make guidance accessible throughout the product experience and design it to fit within the context of use so that it can help these active new users no matter what path they choose to take (e.g. tooltips with helpful information).

#### UI Design Best Practices & Implementation Rules
- **Do:** Accept that users will almost never read instruction manuals, FAQs, or extensive modal tour carousels.
- **Do:** Design interfaces to be immediately exploratory and self-explanatory through intuitive action and inline feedback.
- **Do:** Provide contextual, in-situ guidance (tooltips on first interaction) rather than front-loaded multi-page walkthroughs.
- **Avoid (Anti-Pattern):** Forcing a new sign-up to click through an 8-slide mandatory onboarding modal before they can touch the app.

#### Origins & Scientific Background
> This concept was first defined by Mary Beth Rosson and John Carroll in 1987 as part of their larger work on interaction design, Interfacing thought: cognitive aspects of human-computer interaction. Rosson and Carroll found that new users were not reading the manuals supplied with computers and instead would just get started using them, even if it meant getting into errors and running into roadblocks.

#### Recommended Reading & References
- *Onboarding for Active Users* — Jon Yablonski | Laws of UX
- *Paradox of the Active User* — Nielsen Norman Group
- *Paradox of the Active User [PDF]* — ResearchGate
- *The Paradox of Active Users [PDF]* — ResearchGate

---

### <a id='postels-law'></a>Postel’s Law

**Core Principle:** *Be liberal in what you accept, and conservative in what you send.*

- **Category:** `Theory` | **Tags:** `complexity`
- **Official Link:** [https://lawsofux.com/postels-law/](https://lawsofux.com/postels-law/)

#### Key UX Takeaways
- Be empathetic to, flexible about, and tolerant of any of the various actions the user could take or any input they might provide.
- Anticipate virtually anything in terms of input, access, and capability while providing a reliable and accessible interface.
- The more we can anticipate and plan for in design, the more resilient the design will be.
- Accept variable input from users, translating that input to meet your requirements, defining boundaries for input, and providing clear feedback to the user.

#### UI Design Best Practices & Implementation Rules
- **Do:** Accept various user input formats flexibly (e.g. phone numbers with or without dashes, dates in multiple formats).
- **Do:** Be conservative and precise in system outputs: validate, sanitize, and display clean standardized results.
- **Do:** Provide helpful auto-correction and clear guidance rather than rejecting input with harsh error boundaries.
- **Avoid (Anti-Pattern):** Refusing to accept a phone number because the user typed parentheses or spaces, forcing them to retype it.

#### Origins & Scientific Background
> Postel’s Law (also known as the Robustness Principle) was formulated by Jon Postel, an early pioneer of the Internet. The Law is a design guideline for software, specifically in regards to TCP and networks, and states “TCP implementations should follow a general principle of robustness: be conservative in what you do, be liberal in what you accept from others”. In other words, programs that send messages to other machines (or to other programs on the same machine) should conform completely to the specifications, but programs that receive messages should accept non-conformant input as long as the meaning is clear.

#### Recommended Reading & References
- *Design Systems and Postel’s Law* — Mark Boulton
- *Robustness and Least Power* — Adactio
- *Your Website has Two Faces* — A List Apart
- *Design with Difficult Data* — Steven Garrity

---

### <a id='teslers-law'></a>Tesler’s Law

**Core Principle:** *Tesler's Law, also known as The Law of Conservation of Complexity, states that for any system there is a certain amount of complexity which cannot be reduced.*

- **Category:** `Theory` | **Tags:** `complexity`
- **Official Link:** [https://lawsofux.com/teslers-law/](https://lawsofux.com/teslers-law/)

#### Key UX Takeaways
- All processes have a core of complexity that cannot be designed away and therefore must be assumed by either the system or the user.
- Ensure as much as possible of the burden is lifted from users by dealing with inherent complexity during design and development.
- Remember to not build products and services for an idealized, rational user, because people don’t always behave rationally in real life.
- Make guidance accessible and fit within the context of use so that it can help these active new users, no matter what path they choose to take (e.g., tooltips with helpful information).

#### UI Design Best Practices & Implementation Rules
- **Do:** Shift complexity from the user to the software by building intelligent automation, smart defaults, and predictive text.
- **Do:** Do not over-simplify to the point of breaking necessary capabilities—balance system simplicity with power.
- **Do:** Ensure the remaining essential complexity is handled with clear UI states, contextual help, and clean organization.
- **Avoid (Anti-Pattern):** Hiding vital configuration options completely in an attempt to look 'clean', leaving power users stranded.

#### Origins & Scientific Background
> While working for Xerox PARC in the mid-1980s, Larry Tesler realized that the way users interact with applications was just as important as the application itself. The book Designing for Interaction by Dan Saffer, includes an interview with Larry Tesler that describes the law of conservation of complexity. The interview is popular among user experience and interaction designers. Larry Tesler argues that, in most cases, an engineer should spend an extra week reducing the complexity of an application versus making millions of users spend an extra minute using the program because of the extra complexity. However, Bruce Tognazzini proposes that people resist reductions to the amount of complexity in their lives. Thus, when an application is simplified, users begin attempting more complex tasks.

#### Recommended Reading & References
- *Tesler’s Law [article]* — Jon Yablonski | Laws of UX
- *Tesler’s Law: Shift Complexity to Simplify UX [video]* — Lola Famulegun | Nielsen Norman Group
- *Why Life Can’t Be Simpler* — Farnam Street
- *8 Design Guidelines for Complex Applications* — Kate Kaplan | Nielsen Norman Group

---

## <a id='companion-articles'></a>Companion Deep-Dive Articles on UX Psychology

The Laws of UX platform features in-depth essays exploring the intersection of psychology and interface craft:

### [Familiar vs Novel](https://lawsofux.com/articles/2024/familiar-vs-novel/)
- **URL:** https://lawsofux.com/articles/2024/familiar-vs-novel/

### [Onboarding for Active Users](https://lawsofux.com/articles/2024/onboarding-for-active-users/)
- **URL:** https://lawsofux.com/articles/2024/onboarding-for-active-users/

### [Tesler’s Law](https://lawsofux.com/articles/2024/teslers-law/)
- **URL:** https://lawsofux.com/articles/2024/teslers-law/

### [UX Psychology: Google Search](https://lawsofux.com/articles/2020/ux-psychology-google-search/)
- **URL:** https://lawsofux.com/articles/2020/ux-psychology-google-search/

### [Peak-End Rule](https://lawsofux.com/articles/2020/peak-end-rule/)
- **URL:** https://lawsofux.com/articles/2020/peak-end-rule/

### [The Psychology of Design](https://lawsofux.com/articles/2018/the-psychology-of-design/)
- **URL:** https://lawsofux.com/articles/2018/the-psychology-of-design/

### [Designing with Occam’s Razor](https://lawsofux.com/articles/2017/designing-with-occams-razor/)
- **URL:** https://lawsofux.com/articles/2017/designing-with-occams-razor/

### [Design Principles for Reducing Cognitive Load](https://lawsofux.com/articles/2015/design-principles-for-reducing-cognitive-load/)
- **URL:** https://lawsofux.com/articles/2015/design-principles-for-reducing-cognitive-load/

## <a id='quick-checklist'></a>UI Best Practice Master Checklist

| Law | Primary UI Focus | Golden Rule for UI Designers |
| :--- | :--- | :--- |
| **Aesthetic-Usability Effect** | Visual Finish & Craft | Polish builds trust, but always test task completion to uncover masked bugs. |
| **Fitts's Law** | Buttons & Touch Targets | Minimum 44x44pt on mobile; place key actions in the natural thumb zone. |
| **Hick's Law** | Menus & Options | Reduce choice overload with progressive disclosure and smart defaults. |
| **Jakob's Law** | Navigation & Conventions | Follow familiar web/app patterns so users don't have to learn new mental models. |
| **Law of Proximity** | Spacing & Form Layouts | Keep labels closer to their own inputs than to preceding inputs. |
| **Law of Common Region** | Cards & Containers | Enclose related elements in cards/containers with visible boundaries. |
| **Miller's Law** | Working Memory | Chunk complex data into 5–7 digestible clusters (e.g. credit cards, phone numbers). |
| **Peak-End Rule** | Emotional Memory | Design celebratory milestones at key moments and ensure painless completion. |
| **Postel's Law** | Form Inputs | Be liberal in input formats accepted; normalize data behind the scenes. |
| **Tesler's Law** | Complexity Conservation | Shift complexity from user to software via automation and smart defaults. |
| **Von Restorff Effect** | Call-to-Action | Make the primary CTA visually isolated and distinct from secondary actions. |
| **Zeigarnik Effect** | Onboarding & Workflows | Show explicit progress meters and save draft states to motivate task completion. |
