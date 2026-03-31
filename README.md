# OrganLink Backend

**Decentralized Organ Donation Platform** - Node.js + Express + PostgreSQL (Local/Cloud)

---

## 🗄️ Database: PostgreSQL (Local Setup)

This project has been updated to use a **Local PostgreSQL** database for development.

### 1. Install PostgreSQL
If you haven't already, download and install PostgreSQL for Windows: [postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)

During installation:
- Remember the **Password** you set for the `postgres` user.
- Default port is `5432`.

### 2. Create the Database
Open **pgAdmin** (installed with Postgres) or use the SQL Shell (psql).

1.  Open SQL Shell (psql).
2.  Log in (Server: localhost, Database: postgres, Port: 5432, Username: postgres).
3.  Run this command to create the database:
    ```sql
    CREATE DATABASE organlink_local;
    ```
4.  Switch to the new database:
    ```sql
    \c organlink_local
    ```

### 3. Run the Schema Script
The `schema.sql` file in the backend directory contains all the tables needed for your application.

**Option A (Command Line):**
Run this command in your terminal (inside the `backend` directory):
```powershell
psql -U postgres -d organlink_local -f schema.sql
```
*(You may need to enter your postgres password)*

**Option B (pgAdmin):**
1.  Open pgAdmin and connect to your server.
2.  Right-click `organlink_local` -> **Query Tool**.
3.  Open the file `backend/schema.sql`.
4.  Click the **Play** button (Execute).

### 4. Update Environment Variables (`.env`)
Update your `DATABASE_URL` in the `.env` file:

```env
# Local Database URL
DATABASE_URL=postgresql://postgres:4632@localhost:5432/organlink_local
```

---

## 🚀 Deployment Guide - Complete Steps

### STEP 1: Deploy Backend on Render (Example)

#### 1.1 Create a Cloud PostgreSQL Instance
You can use Render's managed PostgreSQL or any other provider (like Aiven, DigitalOcean, or NeonDB if preferred).

1. Click **"New +"** → **"PostgreSQL"**
2. Name it `organlink-db`
3. Copy the **Internal Database URL** (for Render services) or **External Database URL** (for local testing).

#### 1.2 Create Web Service on Render
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository.
3. Configure settings:
   - **Name**: `organlink-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add your `.env` variables (see below).

#### 1.3 Add Environment Variables
Add these to your Render Web Service configuration:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | |
| `DATABASE_URL` | `your_cloud_postgres_url` | Use the one from Step 1.1 |
| `JWT_SECRET` | `your_secure_random_string` | |
| `REFRESH_TOKEN_SECRET` | `another_secure_string` | |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Update after Vercel deploy |
| `PRIVATE_KEY` | `your_ethereum_private_key` | |
| `CONTRACT_ADDRESS` | `your_contract_address` | |
| `RPC_URL` | `your_infura_or_alchemy_url` | |

---

### STEP 2: Deploy Frontend on Vercel

1. Import your frontend repository to Vercel.
2. Set the `VITE_API_URL` environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com`
3. Click **Deploy**.

---

### STEP 3: Final Integration

1. Once the frontend is live, copy its URL.
2. Go back to Render -> Backend Service -> Environment.
3. Update `FRONTEND_URL` with your Vercel URL (e.g., `https://organlink-frontend.vercel.app`).
4. Save changes. Backend will auto-redeploy.

---

## 🔧 Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework  
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **Ethers.js** - Blockchain integration
- **IPFS** - Decentralized file storage

---

## 📁 Project Structure

```
backend/
├── routes/             # API endpoints
├── middleware/         # Auth, validation, security
├── scripts/            # Database and automation scripts
├── contracts/          # Smart contract ABIs
├── schema.sql          # Primary database schema
└── server.ts           # Entry point
```

---

## 📝 API Endpoints

Base URL: `https://your-backend.onrender.com/api`

### Hospital
- `POST /api/hospital/patients/register` - Register patient
- `POST /api/hospital/donors/register` - Register donor
- `GET /api/hospital/matching/ai-matches` - Get AI matches

### Organization
- `GET /api/organization/policies` - Get policies
- `POST /api/organization/policies/propose` - Propose policy

---

## 📞 Support

Contact: [vignesh@organlink.org](mailto:vignesh@organlink.org)

## 📝 License
MIT License
