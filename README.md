# Adivasi Event Contribution Management System

A modern, multilingual ERP system designed for managing tribal and rural community event contributions such as marriages, festivals, ceremonies, and social gatherings.

This platform digitizes traditional notebook-based contribution records into a simple, searchable, and exportable management system.

---

# Project Overview

In many tribal and rural communities, people contribute materials, food, clothing, cash, and traditional items during social events like weddings and festivals.

Traditionally, these records are maintained manually using paper registers.

This system provides a digital solution for:

- Managing contributors
- Tracking materials and cash contributions
- Organizing event records
- Exporting reports to Excel/PDF
- Supporting multiple languages

---

# Main Features

## Event Management
- Create Events
- Edit/Delete Events
- Event History
- Event Date & Location Tracking

---

## Contributor Management
Store contributor details including:

- SL.NO
- Name
- Address
- Mobile Number
- Village Name
- Contribution Date

---

## Contribution Management

Support multiple contribution items per person.

### Supported Contribution Types

#### Food Items
- Rice
- Wheat
- Dal
- Vegetables
- Oil

#### Traditional Items
- Hadiya
- Saree
- Dhoti
- Gamcha

#### Financial Support
- Cash Contribution

#### Other Materials
- Utensils
- Decoration Materials
- Firewood

---

## Multi-Language Support

Supported Languages:

- English
- Hindi
- Odia

### Features
- Dynamic Language Switching
- Multilingual Dashboard
- Localized Forms
- Multi-language Reports
- PDF/Print Translation Support

---

# Dashboard Features

- Total Events
- Total Contributors
- Total Contributions
- Recent Entries
- Cash Summary
- Product Statistics

---

# Search & Filters

Search by:

- Contributor Name
- Mobile Number
- Village
- Event Name
- Product Type

Filter by:

- Event
- Date
- Village

---

# Reports & Export

## Available Reports
- Event Contribution Reports
- Product-wise Reports
- Village Reports
- Monthly Reports
- Cash Reports

## Export Features
- Excel Export
- PDF Export
- Printable Reports

---

# Authentication System

## Roles

### Admin
- Full Access

### Operator
- Contribution Entry
- Report Access

---

# Technology Stack

## Frontend
- React.js
- Next.js
- Tailwind CSS
- i18next

## Backend
- Node.js
- Express.js

## Database
- MySQL

## Export System
- SheetJS (xlsx)

---

# Database Structure

Main Tables:

```sql
users
languages
events
contributors
products
contributions
villages
reports
````

---

# System Workflow

```text
Create Event
   ↓
Add Contributor
   ↓
Add Contribution Products
   ↓
Save Records
   ↓
Generate Reports
   ↓
Export Excel/PDF
```

---

# UI/UX Design Goals

* Modern Interface
* Lightweight Design
* Mobile Friendly
* Easy Navigation
* Rural User Friendly
* Responsive Layout

---

# Required Pages

* Login
* Dashboard
* Events
* Contributors
* Contributions
* Reports
* Settings
* Language Settings

---

# Mobile Responsive

The system must work on:

* Mobile Phones
* Tablets
* Desktop Computers

---

# Future Enhancements

* Android App
* Offline Sync
* QR Code Entry
* Voice Input
* WhatsApp Notifications
* Cloud Backup
* AI-Based Reports

---

# Project Goal

To preserve tribal and rural cultural contribution systems using modern digital technology while keeping the platform simple, multilingual, accessible, and community-friendly.

---

# Example Contribution Record

| SL.NO | Name          | Village    | Product | Quantity |
| ----- | ------------- | ---------- | ------- | -------- |
| 1     | Ramesh Murmu  | Kendujhar  | Rice    | 25 KG    |
| 2     | Sita Tudu     | Mayurbhanj | Saree   | 2 Piece  |
| 3     | Birsa Hembram | Baripada   | Hadiya  | 10 Liter |

---

# License

This project is developed for community and cultural management purposes.

---

# Author

Developed for Tribal Community Digital Management Initiative.

```
```
