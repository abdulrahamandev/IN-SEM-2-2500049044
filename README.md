# Campus Admin — Student Records

A responsive student directory for adding, browsing, searching, updating, and deleting department student records. The Express API stores records in MongoDB Atlas.

## Requirements

- Node.js 18 or later
- A MongoDB Atlas cluster and database user

## Run locally

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and set `MONGODB_URI` to your Atlas connection string. Replace the sample username, password, and cluster host; URL-encode special characters in the password.
3. In MongoDB Atlas, allow network access from the application host and grant the database user access to the `student_records` database.
4. Start the application:

   ```sh
   npm start
   ```

5. Open `http://localhost:3000`. For local development with automatic restarts, use `npm run dev`.

The server does not start without a configured `MONGODB_URI`; student records are persisted to the `students` collection in the `student_records` database.

## API

- `GET /api/students` — list all records; optional `rollNumber`, `department`, or `search` query parameters
- `POST /api/students` — create a record
- `PUT /api/students/:id` — update a record
- `DELETE /api/students/:id` — delete a record

Each record has a unique roll number, full name, email, department, semester (1–12), and optional phone number. The Atlas URI is a server-side environment secret and must not be exposed in browser code or committed to source control.
