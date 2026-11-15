# Apex

A personal gym tracker that installs to your iPhone home screen. Version 0.1 covers lifting, records, ranks and bodyweight.

## Put it online (GitHub Pages)

1. Create a new **public** repository on GitHub, for example `apex`.
2. Upload every file in this folder to it (Add file > Upload files).
3. In the repository, open Settings > Pages, set the source to "Deploy from a branch", pick `main` and `/ (root)`, and save.
4. After a minute or two the site is live at `https://<your-username>.github.io/apex/`.

## Install on iPhone

Open that address in Safari, tap Share, then "Add to Home Screen". Open Apex from the new icon.

## Switch on cloud sync (optional, free)

1. Go to https://console.firebase.google.com and create a project (Analytics is not needed).
2. Build > Authentication > Get started > Email/Password > Enable.
3. Build > Firestore Database > Create database (production mode, any region near you).
4. In Firestore > Rules, replace the contents with the rules below and publish.
5. Project settings > Your apps > add a Web app, and copy the `firebaseConfig` object.
6. Paste that object in place of `null` in `config.js`, and upload the changed file.
7. In Apex, open Settings, create an account with an email and password, and sign in with the same details on every device.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function owner() {
      return request.auth != null && request.auth.uid == "PASTE_OWNER_USER_ID";
    }
    function invited() {
      return request.auth != null
        && request.auth.token.email_verified == true
        && exists(/databases/$(database)/documents/invites/$(request.auth.token.email));
    }
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid && (owner() || invited());
    }
    match /invites/{email} {
      allow get: if request.auth != null && request.auth.token.email == email;
      allow read, write: if owner();
    }
    // Opt-in leaderboard: each member may write only their own entry, with only these five fields.
    match /board/{uid} {
      allow read: if owner() || invited();
      allow create, update: if request.auth != null && request.auth.uid == uid && (owner() || invited())
        && request.resource.data.keys().hasOnly(['name','tier','prog','week','at'])
        && request.resource.data.name is string && request.resource.data.name.size() >= 1 && request.resource.data.name.size() <= 24
        && request.resource.data.tier is int && request.resource.data.tier >= -1 && request.resource.data.tier <= 6
        && request.resource.data.prog is number && request.resource.data.prog >= 0 && request.resource.data.prog <= 1
        && request.resource.data.week is int && request.resource.data.week >= 0 && request.resource.data.week <= 21
        && request.resource.data.at is number;
      allow delete: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Replace PASTE_OWNER_USER_ID with the owner's user ID, shown at the bottom of Settings in the app.
With these rules only the owner and invited, email-verified addresses can sync. The owner manages the
list from Settings > Invite friends. Progress photos are encrypted in the app before upload, so they
cannot be viewed from the Firebase console.

## Updating

Replace the files in the repository with the new versions. The app picks up the change the next time it is opened online.
