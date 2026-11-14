/* Cloud sync settings. Leave firebase as null to keep data on this device only.
   To switch sync on, replace null with the config object from your Firebase project
   (Project settings > Your apps > Web app). These values are safe to publish:
   access is controlled by the Firestore rules in README.md, not by hiding them. */
window.APEX_CONFIG = {
  firebase: null
};
