# Zexofile

You are a senior full-stack web developer.



Build a complete, production-ready DIGITAL PRODUCT SELLING WEBSITE using ONLY ONE single HTML file.



────────────────────────────

ABSOLUTE BACKEND RULE (CRITICAL)

────────────────────────────

• Use Firebase as the ONLY backend.

• Do NOT use any other backend, server, API, framework, CMS, or database.

• Do NOT use Node.js, PHP, Python, Express, MongoDB, MySQL, Supabase, Appwrite, or any custom server.

• ALL authentication, data storage, access control, and logic MUST be handled ONLY via Firebase.



────────────────────────────

ABSOLUTE UI RULE (CRITICAL)

────────────────────────────

• The website UI, layout, spacing, colors, sections, typography, cards, sliders, buttons, animations and overall look MUST be an EXACT VISUAL MATCH of the screenshot provided by the user.

• The screenshot is the ONLY design reference.

• DO NOT redesign, improvise, modernize, or assume anything.

• DO NOT explain UI decisions.

• Pixel-level accuracy is required as closely as possible.



────────────────────────────

CORE RULES (STRICT)

────────────────────────────

• ONLY ADMIN can sell products

• No instructor / no seller system

• Products include:

  - Online Courses

  - Ready-made Websites

  - Custom Project Services

• Use ONLY:

  - HTML5

  - CSS3

  - Vanilla JavaScript

  - Font Awesome Icons

• Firebase Storage is STRICTLY NOT allowed

• Images must be external URLs only

• Code must be compatible with:

  - Sketchware

  - HopWeb

  - InfinityFree Hosting

  - Android WebView App



────────────────────────────

FIREBASE CONFIG (MANDATORY)

────────────────────────────

Use this exact Firebase configuration:





const firebaseConfig = {

  apiKey: "AIzaSyDiW4Zei5TXGipX7gQrFq4eqrEzQGimELY",

  authDomain: "shop-9b221.firebaseapp.com",

  databaseURL: "https://shop-9b221-default-rtdb.firebaseio.com",

  projectId: "shop-9b221",

  storageBucket: "shop-9b221.firebasestorage.app",

  messagingSenderId: "259533617394",

  appId: "1:259533617394:web:73fffae7c026c2364cb86b",

  measurementId: "G-VHJWCDVPMC"

};



Use ONLY:

• Firebase Authentication  

• Firebase Realtime Database  



────────────────────────────

FILE STRUCTURE (STRICT)

────────────────────────────

• Create ONLY ONE file:

  - index.html

• No multiple files

• No extra assets



────────────────────────────

AUTHENTICATION RULES

────────────────────────────

User Authentication:

• Email + Password signup & login

• Google login

• Firebase Auth only



Admin Access Logic:

• If logged-in email = techshivam0616@gmail.com

• AND password = shivam0616

→ Show ADMIN PANEL inside Profile section

• For all other users → Admin panel must remain hidden



────────────────────────────

PRODUCT TYPES & USER FEATURES

────────────────────────────



1️⃣ COURSE SELLING

• One-time purchase

• Lifetime unlimited access

• Purchase history saved in Firebase



2️⃣ WEBSITE SELLING (READY-MADE)

• Admin can add website products

• Fields:

  - Website title

  - Description

  - Price

  - Preview/demo link

  - External image URL

  - Razorpay payment link

• After purchase:

  - Website access/download info visible to user

  - Purchase stored permanently



3️⃣ CUSTOM PROJECT REQUEST SYSTEM

• A dedicated "Custom Project" option must exist

• Logged-in users can submit a custom project request form

• Form fields:

  - Project title

  - Project type (website / app / other)

  - Description

  - Budget range

  - Contact details

• After submission:

  - Request saved in Firebase

  - Visible in Admin Panel

• Admin can:

  - View requests

  - Approve / reject

  - Update status (pending / in progress / completed)

  - Contact user externally



────────────────────────────

HOME PAGE SECTIONS (ORDER FIXED)

────────────────────────────

• Hero section with trending slider

• Best selling products (courses + websites)

• Feedback / review submission

• What we offer

• How to buy

• Why choose us

• Contact us

• Refund policy

• Privacy policy



────────────────────────────

PAYMENT RULE

────────────────────────────

• Use Razorpay PAYMENT LINKS only

• No server-side verification

• After payment:

  - Save purchase in Firebase

  - Grant lifetime access automatically



────────────────────────────

ADMIN PANEL (INSIDE PROFILE)

────────────────────────────

Admin can:

• Add / edit / delete courses

• Add / edit / delete website products

• Manage Razorpay links

• View users & purchases

• Manage custom project requests

• Edit homepage sections

• Edit refund & privacy policy

• Edit contact details



────────────────────────────

DATABASE STRUCTURE (MANDATORY)

────────────────────────────

• users

• courses

• websites

• purchases

• customProjects

• homepageContent

• policies

• adminConfig



────────────────────────────

FINAL OUTPUT REQUIREMENTS

────────────────────────────

• Complete working code

• No placeholders

• No demo/fake data

• No missing logic

• Firebase-only backend enforcement

• Screenshot-matched UI

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://zexofile-shop.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/62b6bf97-bb7f-45f3-92e7-0130209c9abb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
