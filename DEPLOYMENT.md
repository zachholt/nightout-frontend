# Parliament Pals Deployment Guide

This document provides instructions for deploying the Parliament Pals app to TestFlight and the App Store.

## Prerequisites

- Make sure you have EAS CLI installed: `npm install -g eas-cli`
- Ensure you're logged in to EAS: `eas login`
- Verify your Apple Developer account credentials are set up in EAS

## Available Commands

### TestFlight Deployment

To build for TestFlight:

```bash
eas build --platform ios --profile testflight
```

This will build the app with the TestFlight profile and upload it to App Store Connect.

To submit to TestFlight after the build completes:

```bash
eas submit --platform ios --profile testflight --latest
```

The `--latest` flag tells EAS to use the most recent build.

### App Store Deployment

To build and submit to the App Store:

```bash
# First build the app
eas build --platform ios --profile production

# Then submit to App Store
eas submit --platform ios --profile production --latest
```

This will:
1. Build the app with the production profile
2. Submit the build to App Store Connect
3. Begin the review process for App Store publication

## Upgrading EAS CLI

It's recommended to keep your EAS CLI up-to-date:

```bash
npm install -g eas-cli
```

## Customizing the Deployment Process

The deployment configuration is managed in `eas.json`. You can customize:

- TestFlight distribution settings
- App Store metadata
- Version incrementation
- Build configurations
- And more

For more details on EAS Build and Submit, refer to the [Expo documentation](https://docs.expo.dev/build/introduction/).

## Troubleshooting

- If a build fails, check the EAS Build logs for details
- For submission issues, verify your Apple Developer account has the proper permissions
- Make sure your app.json has the correct bundle identifier and version numbers 