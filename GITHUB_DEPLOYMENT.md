# GitHub Actions Deployment Guide

This guide explains how to use GitHub Actions to build and submit your app to the App Store.

## Setup Requirements

Before you can use the workflow, you need to set up:

1. An **EXPO_TOKEN** secret in your GitHub repository:
   - Generate a token at https://expo.dev/accounts/[your-username]/settings/access-tokens
   - Go to your GitHub repo → Settings → Secrets → New repository secret
   - Name: `EXPO_TOKEN`, Value: your Expo token

2. Make sure your `eas.json` file is configured with your App Store credentials:
   ```json
   {
     "submit": {
       "production": {
         "ios": {
           "appleId": "your-apple-id@example.com",
           "ascAppId": "your-app-store-connect-app-id",
           "appleTeamId": "your-apple-team-id"
         }
       }
     }
   }
   ```

## iOS Build & Submit Workflow

This single workflow handles both building your iOS app and submitting it to App Store Connect in one process.

### Trigger Options

**Manual Trigger:**
- Go to GitHub Actions → iOS Build & Submit → Run workflow
- Options:
  - **Profile**: Choose `production` or `testflight`
  - **Skip submission**: Check this box if you only want to build without submitting

**Automatic Trigger:**
- Occurs on push to `main` branch that changes files in `nightout-frontend/`
- Uses the `production` profile by default
- Automatically submits to App Store Connect after building

### What This Workflow Does

1. Builds your iOS app using EAS Build with the selected profile
2. Extracts the build ID from the build output
3. Automatically submits the build to App Store Connect (unless skipped)

## Examples

### Build for Production and Submit to App Store
- Trigger workflow with profile = `production`
- The workflow will build and then automatically submit to App Store

### Build for TestFlight Only
- Trigger workflow with profile = `testflight` and skip_submit = `true`
- The workflow will only build the app for TestFlight without submitting

## Troubleshooting

- If you get authentication errors, check your EXPO_TOKEN secret
- Make sure your iOS app is properly configured in App Store Connect
- Verify that your Apple credentials are correct in eas.json
- If build ID extraction fails, you may need to manually submit using:
  ```
  eas submit --platform ios --profile production --latest
  ``` 