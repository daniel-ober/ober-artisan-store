# Ober Artisan Drums

<br>

## Overview

**Ober Artisan Drums** is a full-stack e-commerce and project-tracking platform for handcrafted stave snare drums.

It powers both the **public brand experience** and the **internal workshop systems**, including:

- Public storefront for **Heritage**, **Feuzøn Hybrid**, and **SoundLegend** series
- Polished **product browsing + checkout** experience
- Admin dashboard for **orders, support, SoundLegend commissions, and risk**
- Customer-facing **SoundLegend Portal** where clients follow their drum build
- Internal **project workflow engine** mirroring real workshop build phases
- Technical **stave cut calculator** used for accurate shell geometry
- NFC authentication groundwork for future product verification

It connects craftsmanship, storytelling, and technology into a single ecosystem.

<br>

---

## MVP

- _Public storefront with detailed drum + merch pages_
- _Shopping cart + Stripe checkout_
- _Admin dashboard for orders / submissions / support_
- _Project build workflow engine with per-step checklists_
- _Customer SoundLegend Portal (progress, attachments, info, support)_
- _Stave geometry calculator_
- _Auth with admin + SoundLegend roles_
- _Hosted on Firebase + Cloud Functions_

<br>

---

## Goals

- _Treat each drum as both a precision instrument **and** a personal story_
- _Give customers real transparency into the build process_
- _Give the shop an actual operational cockpit, not spreadsheets_
- _Keep stack lean and maintainable (React + Firebase + Stripe)_
- _Mirror real artisan workflow in software — not force software onto craft_

<br>

---

## Libraries & Dependencies

| Library / Service   | Purpose                                                                 |
|---------------------|-------------------------------------------------------------------------|
| React               | Front-end UI                                                           |
| Vite                | Build tooling                                                          |
| React Router        | Client routing                                                         |
| Firebase Auth       | Authentication + roles                                                 |
| Firestore           | Orders, projects, SoundLegend data                                     |
| Firebase Storage    | Images, PDFs, media files                                              |
| Cloud Functions     | Secure backend logic                                                   |
| Firebase Hosting    | Deployment                                                             |
| Stripe              | Payments + checkout                                                    |
| Framer Motion       | UI polish                                                              |
| Lucide / FontAwesome| Icons                                                                  |

<br>

---

## 🎛 UI — Screens

**Storefront – Drum Lineup**  
![Storefront](https://i.imgur.com/Oa4FR3t.png)

<br>

**Our Craft – Process Story**  
![Our Craft](https://i.imgur.com/0XUo2oI.png)

<br>

**Drum Product Detail**  
![Product Detail](https://i.imgur.com/EwyJvj2.png)

<br>

**Cart**  
![Cart](https://i.imgur.com/Zn56ao8.png)

<br>

**Checkout**  
![Checkout](https://i.imgur.com/vcs4bdJ.png)

<br>

**Admin Dashboard**  
![Admin](https://i.imgur.com/qXto6Rq.png)

<br>

**Stave Calculator**  
![Calculator](https://i.imgur.com/z9uIHUI.png)

<br>

**SoundLegend Portal – Media & Attachments**  
![Portal Media](https://i.imgur.com/iES5RpN.png)

<br>

**SoundLegend Portal – Project Progress**  
![Portal Progress](https://i.imgur.com/pu73aBU.png)

<br>

---

## Client Architecture

~~~text
src
|__ assets/
|   |__ images/
|   |__ logos/
|
|__ lib/
|   |__ firebaseClient.js
|   |__ stripeClient.js
|
|__ components/
|   |__ NavBar/
|   |__ Storefront/
|   |__ ProductDetail/
|   |__ Cart/
|   |__ Checkout/
|
|   |__ Admin/
|   |   |__ AdminDashboard.js
|   |   |__ ManageOrders.js
|   |   |__ ManageProjects.js
|   |   |__ ManageProjectModal.js
|   |   |__ ViewOrderModal.js
|   |   |__ ViewSoundlegendModal.js
|
|   |__ SoundLegendPortal/
|       |__ ProjectDetailPage.js
|       |__ ProjectProgress.js
|       |__ ScopeOfWork.js
|       |__ Attachments.js
|       |__ CustomerInfo.js
|       |__ Billing.js
|       |__ PrioritySupport.js
|
|__ tools/
|   |__ StaveCalculator.js
|   |__ VerifyDrum.js
|
|__ utils/
|   |__ deriveBuildProgress.ts
|   |__ statusConfig.js
|
|__ pages/
|__ main.jsx
~~~

<br>

---

## ⭐ Code Showcase

A cornerstone of Ober Artisan Drums is the **Project Build Progress Engine**.

Each custom SoundLegend drum is stored in Firestore with deeply structured data:
build steps, checklists, timers, media, and metadata.  
To turn that into a meaningful experience, the app derives:

- ordered build stages  
- completion percentage  
- total hours logged  
- progress bar state  

This is what powers the customer SoundLegend portal’s timeline.

~~~ts
// utils/deriveBuildProgress.ts

const STEP_KEYS = [
  "woodPreparation",
  "rawShellCreation",
  "shellExteriorFinish",
  "hardwareAssembly",
  "tuningDetailing",
  "qualityCheck",
  "finalQAPackagingDelivery"
];

export function deriveBuildProgress(project) {
  const phases = STEP_KEYS.map((key, index) => {
    const step = project[key];
    const tasks = step?.checklist ?? [];

    const totalTasks = tasks.length;
    const completed = tasks.filter(t => t.completed).length;

    const seconds = tasks.reduce(
      (sum, t) => sum + (t.totalSeconds ?? 0),
      0
    );

    return {
      id: key,
      label: step?.label ?? `Step ${index + 1}`,
      order: step?.order ?? index + 1,
      totalTasks,
      completedTasks: completed,
      progressPercent: totalTasks
        ? Math.round((completed / totalTasks) * 100)
        : 0,
      hoursLogged: Number((seconds / 3600).toFixed(1))
    };
  }).sort((a, b) => a.order - b.order);

  const progressPercent =
    phases.length > 0
      ? Math.round(
          phases.reduce((s, p) => s + p.progressPercent, 0) /
            phases.length
        )
      : 0;

  return {
    phases,
    stepsComplete: phases.filter(p => p.progressPercent === 100).length,
    stepsTotal: phases.length,
    progressPercent,
    hoursLogged: phases.reduce((s, p) => s + p.hoursLogged, 0)
  };
}
~~~

This system:

- keeps admin tools reliable  
- keeps customer experience transparent  
- mirrors real physical shop workflow  

It turns a physical craft into a digital journey.

<br>

---

## Code Issues & Resolutions

- **Issue:** Early project docs were inconsistent, breaking the portal  
  **Fix:** Normalized schema + defensive progress derivation

- **Issue:** Large media files slowed portal  
  **Fix:** previews, caching, and customer-visibility toggles

<br>

---

## Post-MVP

- NFC authenticated ownership pages
- Public “Legacy Vault” drum profiles
- Better analytics for build timing + forecasting
- Stripe billing portal + subscriptions
- Customer ↔️ Artisan inline comment system