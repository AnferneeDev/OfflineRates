OfflineRates

<div align="center">

</div>

📖 Table of Contents

About The Project

Core Features

Tech Stack

Getting Started

Database Setup

License

Contact

🎯 About The Project

OfflineRates is a mobile application for browsing hospital service prices. It is designed to be offline-first, syncing with a central Supabase database when an internet connection is available, but storing all data locally in an SQLite database for high performance and 100% offline access.

The app features two primary roles: a public-facing "Guest" mode for browsing, and a secure "Admin" mode for managing the services and categories.

✨ Core Features

Offline-First Architecture: All data is stored in a local SQLite database, allowing the app to be fully functional without an internet connection.

Online/Offline Sync: Automatically detects network status. When online, it syncs the local database with the remote Supabase backend.

Guest & Admin Roles:

Guest View: A public, read-only interface for browsing and filtering hospital services.

Admin Dashboard: A secure panel (requires Supabase Auth) for Creating, Reading, Updating, and Deleting (CRUD) services and categories.

Dynamic Search & Filtering: Fast, client-side search and multi-category filtering powered by local data.

Cross-Platform: Built with React Native (Expo) to run natively on both iOS and Android from a single codebase.

🛠️ Tech Stack

Framework: React Native (Expo)

Database (Remote): Supabase (PostgreSQL)

Database (Local): Expo-SQLite

Styling: NativeWind (Tailwind for React Native)

Language: TypeScript

Auth: Supabase Auth

💻 Getting Started (For Developers)

Prerequisites

Node.js (v18 or higher)

npm or yarn

Expo Go app on your mobile device (or an emulator)

A Supabase project

Installation & Development

Clone the repository

git clone [https://github.com/](https://github.com/)[YourGitHub]/OfflineRates.git
cd OfflineRates

Install dependencies

npm install

Set up Environment Variables

You must have a Supabase project set up. Find your project's URL and Anon Key and add them to your project. (e.g., in src/lib/supabaseClient.ts or a .env file).

Your supabaseClient.ts should look like this:

const supabaseUrl = "https://YOUR_SUPABASE_URL.supabase.co";
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
// ...
});

Start the app

npx expo start

Scan the QR code with the Expo Go app on your phone.

🗃️ Database Setup

The app relies on a specific schema in Supabase. All tables should be created in the app schema.

Schemas

Here are the SQL commands to create the required tables in your Supabase project. You can run this in the Supabase SQL Editor.

Categories Table:

create table app.categories (
id uuid not null default gen_random_uuid (),
name text not null,
created_at timestamp with time zone null default now(),
updated_at timestamp with time zone null default now(),
icon text null,
constraint categories_pkey primary key (id),
constraint categories_name_key unique (name)
);

Services Table:

create table app.services (
id uuid not null default gen_random_uuid (),
category_id uuid null,
name text not null,
price numeric(10, 2) not null,
description text null,
created_at timestamp with time zone null default now(),
updated_at timestamp with time zone null default now(),
constraint services_pkey primary key (id),
constraint services_category_id_fkey foreign KEY (category_id) references app.categories (id) on delete set null
);

How to Add Data to Supabase

You can add data manually or by uploading a CSV file.

1. Manual Entry (Supabase Table Editor)

Go to the Table Editor in your Supabase project.

Select the categories table.

Click + Insert row.

Fill in the name (e.g., "Cardiology") and icon (e.g., "❤️").

Repeat for all your categories.

Select the services table and add a new row.

Fill in the name, price, description, and select the correct category_id from the dropdown list.

2. Using CSV Import (Recommended)

This is the fastest way to add a lot of data. You must import categories first.

Step 1: Import Categories

Navigate to the categories table in the Supabase Table Editor.

Click the "Import" button (small grid icon).

Upload your categories.csv file.

Make sure all columns match and import the data.

Example categories.csv:

id,name,icon
f47ac10b-58cc-4372-a567-0e02b2c3d479,Cardiology,❤️
3d4bc659-2815-4f0c-bf55-b541173a51fa,Radiology,☢️
5e8a4a22-5e87-4d1c-8b8a-3d5f3a0c0e3f,Neurology,🧠

Step 2: Import Services

Navigate to the services table.

Click "Import" and upload your services.csv file.

Crucially, make sure the category_id column in your CSV contains the correct UUIDs that you just imported in Step 1.

Example services.csv:

category_id,name,price,description
f47ac10b-58cc-4372-a567-0e02b2c3d479,Echocardiogram,350.00,"Ultrasound of the heart"
3d4bc659-2815-4f0c-bf55-b541173a51fa,Chest X-Ray,180.00,"Standard two-view chest X-ray"

📜 License

PROPRIETARY LICENSE

Copyright (c) 2025 Anfernee
All rights reserved.

This software is confidential and proprietary. No part of this software
may be copied, reproduced, modified, distributed, or used in any way without
the express written permission of Anfernee.

See the LICENSE.md file for more details.

📧 Contact

Anfernee Pichardo • LinkedIn • anfernee.developer@gmail.com

Project Link: https://github.com/AnferneeDev/OfflineRates
