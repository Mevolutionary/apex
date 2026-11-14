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
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Updating

Replace the files in the repository with the new versions. The app picks up the change the next time it is opened online.
