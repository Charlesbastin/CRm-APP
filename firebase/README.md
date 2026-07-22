# TechnoCraft Firebase Security Rules

Use `firestore.rules` for Cloud Firestore.

## Where To Add

1. Open Firebase Console.
2. Go to **Firestore Database**.
3. Open **Rules**.
4. Paste the contents of:

```text
firebase/firestore.rules
```

5. Click **Publish**.

## Required Collections

The rules expect these collections:

- `users`
- `events`
- `registrations`
- `attendance`
- `notifications`
- `certificates`
- `feedback`

## Required User Role

Each logged-in Firebase Auth user must have a document:

```text
users/{firebaseAuthUid}
```

Example:

```json
{
  "name": "Aarav Mehta",
  "email": "student@campus.edu",
  "role": "Student"
}
```

Allowed role values:

- `Student`
- `Coordinator`
- `Admin`

## Important Production Note

These are production-style rules. The app must query only the documents the user is allowed to read.

Correct examples:

- Student registrations: `registrations.where("studentId", "==", uid)`
- Coordinator approvals: query registrations by event IDs owned by that coordinator
- Notifications: `notifications.where("userId", "==", uid)`

Avoid downloading all registrations/users on a student screen.

## First Admin Setup

After creating your admin account in Firebase Authentication, create this document manually in Firestore:

```text
users/{adminUid}
```

With:

```json
{
  "name": "Admin",
  "email": "your-admin-email@example.com",
  "role": "Admin"
}
```

Without an admin user document, admin-only actions will be blocked.
