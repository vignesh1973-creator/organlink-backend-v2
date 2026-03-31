# Local Database Setup Instructions

Since you have decided to move to a fully local environment using PostgreSQL, follow these steps to set up your database.

## 1. Install PostgreSQL
If you haven't already, download and install PostgreSQL for Windows: https://www.postgresql.org/download/windows/

During installation:
- Remember the **Password** you set for the `postgres` user.
- Default port is `5432`.

## 2. Create the Database
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

## 3. Run the Schema Script
I have created a file `backend/schema.sql` which contains all the tables needed for your application.

**Option A (Command Line):**
Run this command in your terminal (inside `D:\Antigravity\OrganLink\backend`):
```powershell
psql -U postgres -d organlink_local -f schema.sql
```
*(You may need to enter your postgres password)*

**Option B (pgAdmin):**
1.  Open pgAdmin and connect to your server.
2.  Right-click `organlink_local` -> **Query Tool**.
3.  Open the file `D:\Antigravity\OrganLink\backend\schema.sql`.
4.  Click the **Play** button (Execute).

## 4. Update Environment Variables (`.env`)
You need to tell the backend to use your new local database instead of the online NeonDB.

Open `D:\Antigravity\OrganLink\backend\.env` and update `DATABASE_URL`:

```env
# OLD (Online)
# DATABASE_URL=postgresql://neondb_owner:...

# NEW (Local)
DATABASE_URL=postgresql://postgres:4632@localhost:5432/organlink_local
```

## 5. Restart Backend
Once the database is set up and `.env` is updated:

1.  Stop the current backend (`Ctrl+C`).
2.  Run `npm run dev`.

The application will now be running 100% locally on your machine!
