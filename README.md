/# OfflineRates
/
/<div align="center">
/
/[![Live Demo](https://img.shields.io/badge/Live%20Demo-offlinerates.vercel.app-brightgreen?style=for-the-badge)](https://offlinerates.vercel.app)
/[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/anfernee-pichardo-0787a637a/)
/![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
/![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
/![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
/![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
/![NativeWind](https://img.shields.io/badge/NativeWind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
/![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
/![License](https://img.shields.io/badge/License-Proprietary-red.svg?style=for-the-badge)
/
/</div>
/
/---
/
/<div align="center">
/
/### [View Live Demo](https://offlinerates.vercel.app)
/
/</div>
/
/---
/
/## Table of Contents
/
/- [About The Project](#about-the-project)
/- [Core Features](#core-features)
/- [Tech Stack](#tech-stack)
/- [Getting Started](#getting-started)
/- [Database Setup](#database-setup)
/- [License](#license)
/- [Contact](#contact)
/
/---
/
/## About The Project
/
/OfflineRates is a mobile application for browsing hospital service prices. It is designed to be offline-first, syncing with a central Supabase database when an internet connection is available, but storing all data locally in an SQLite database for high performance and 100% offline access.
/
/It features two primary roles: a public-facing "Guest" mode for browsing, and a secure "Admin" mode for managing the services and categories.
/
/---
/
/## Core Features
/
/- **Offline-First Architecture**: All data is stored in a local SQLite database, allowing the app to be fully functional without an internet connection.
/- **Online/Offline Sync**: Automatically detects network status. When online, it syncs the local database with the remote Supabase backend.
/- **Guest & Admin Roles**:
/ - _Guest View_: A public, read-only interface for browsing and filtering hospital services.
/ - _Admin Dashboard_: A secure panel (requires Supabase Auth) for Creating, Reading, Updating, and Deleting (CRUD) services and categories.
/- **Dynamic Search & Filtering**: Fast, client-side search and multi-category filtering powered by local data.
/- **Cross-Platform**: Built with React Native (Expo) to run natively on both iOS and Android from a single codebase.
/
/---
/
/## Tech Stack
/
/- Framework: React Native (Expo)
/- Database (Remote): Supabase (PostgreSQL)
/- Database (Local): Expo-SQLite
/- Styling: NativeWind (Tailwind for React Native)
/- Language: TypeScript
/- Auth: Supabase Auth
/
/---
/
/## Getting Started
/
/### Prerequisites
/
/- Node.js (v18 or higher)
/- npm or yarn
/- Expo Go app on your mobile device (or an emulator)
/- A Supabase project
/
/### Local Setup
/
/# Clone the repository
/`git clone https://github.com/AnferneeDev/OfflineRates.git`
/
/# Navigate to the project directory
/`cd OfflineRates`
/
/# Install dependencies
/`npm install`
/
/### Environment Variables
/
/You must have a Supabase project set up. Find your project's URL and Anon Key and add them to your project (e.g., in `src/lib/supabaseClient.ts` or a `.env` file).
/
/`ts
/const supabaseUrl = "https://YOUR_SUPABASE_URL.supabase.co";
/const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";
/
/export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
/  // ...
/});
/`
/
/### Run Development Server
/
/`npx expo start`
/
/Scan the QR code with the Expo Go app on your phone.
/
/---
/
/## Database Setup
/
/The app relies on a specific schema in Supabase. All tables should be created in the `app` schema.
/
/### Categories Table
/
/`sql
/create table app.categories (
/  id uuid not null default gen_random_uuid (),
/  name text not null,
/  created_at timestamp with time zone null default now(),
/  updated_at timestamp with time zone null default now(),
/  icon text null,
/  constraint categories_pkey primary key (id),
/  constraint categories_name_key unique (name)
/);
/`
/
/### Services Table
/
/`sql
/create table app.services (
/  id uuid not null default gen_random_uuid (),
/  category_id uuid null,
/  name text not null,
/  price numeric(10, 2) not null,
/  description text null,
/  created_at timestamp with time zone null default now(),
/  updated_at timestamp with time zone null default now(),
/  constraint services_pkey primary key (id),
/  constraint services_category_id_fkey foreign key (category_id) references app.categories (id) on delete set null
/);
/`
/
/### Adding Data
/
/- **Manual Entry**: Use Supabase Table Editor to insert rows into `categories` and `services`.
/- **CSV Import (Recommended)**:
/ - Import `categories.csv` first, then `services.csv`.
/
/Example `categories.csv`:
/`csv
/id,name,icon
/f47ac10b-58cc-4372-a567-0e02b2c3d479,Cardiology,❤️
/3d4bc659-2815-4f0c-bf55-b541173a51fa,Radiology,☢️
/5e8a4a22-5e87-4d1c-8b8a-3d5f3a0c0e3f,Neurology,🧠
/`
/
/Example `services.csv`:
/`csv
/category_id,name,price,description
/f47ac10b-58cc-4372-a567-0e02b2c3d479,Echocardiogram,350.00,"Ultrasound of the heart"
/3d4bc659-2815-4f0c-bf55-b541173a51fa,Chest X-Ray,180.00,"Standard two-view chest X-ray"
/`
/
/---
/
/## License
/
/PROPRIETARY LICENSE
/
/Copyright (c) 2025 Anfernee
/All rights reserved.
/
/This software is confidential and proprietary. No part of this software may be copied, reproduced, modified, distributed, or used in any way without the express written permission of Anfernee.
/
/See the LICENSE.md file for more details.
/
/---
/
/## Contact
/
/**Anfernee Pichardo**
/
/[LinkedIn](https://www.linkedin.com/in/anfernee-pichardo-0787a637a/) • anfernee.developer@gmail.com
/
/Project Link: [https://github.com/AnferneeDev/OfflineRates](https://github.com/AnferneeDev/OfflineRates)
