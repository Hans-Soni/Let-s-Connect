<div align="center">
  
# 📜 Utility Scripts

**Automation, database seeding, and build tools for Let's Connect.**

</div>

---

## 🌟 Overview
This directory is designated for **utility and automation scripts**. 

As Let's Connect grows, any standalone scripts that don't belong directly inside the `frontend` or `backend` servers will be housed here. This helps keep the core application architectures clean and decoupled from operational maintenance tasks.

## 📂 Expected Contents
While this folder might be empty initially, it is the intended location for:
- **Database Seeding:** Scripts to populate the MongoDB database with initial test or mock data (`seed.js`).
- **Data Migration:** Scripts used to migrate database schemas or back up production data.
- **Deployment Automation:** Custom shell scripts (`.sh` or `.ps1`) used by CI/CD pipelines to build and deploy the application.
- **Maintenance Tasks:** Scripts for cleaning up old logs, clearing caches, or generating environment variable templates.

## 🚀 Usage
Scripts in this folder are typically executed manually from the root directory, or bound to npm commands in the root `package.json`. 

Example:
```bash
node scripts/seedDatabase.js
```
