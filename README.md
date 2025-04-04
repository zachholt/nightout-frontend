# Welcome to your Expo app 👋

[Nighout Backend](https://github.com/zachholt/nightout-backend)

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Project Name: NightOut (Working Title)

## Project Overview
Plan a night out by entering a location (zipcode, gps location) to find points of interests around the user to create an itinerary. Share your plans with friends and discover their itineraries.

## Goals
- Create engaging and personalized night out experiences
- Enable social sharing of itineraries
- Simplify night out planning process

## Features
### Must-Have
- [ ] Find locations around users by type
- [ ] Create a route based on filter requirements (price, distance, open times) and title them
- [ ] Send routes to navigation app
- [ ] Add and manage friends
- [ ] Share itineraries with friends
- [ ] View friends' public itineraries

### Nice-to-Have
- [ ] Collaborative itinerary editing
- [ ] Friend activity feed

## Sprints
1. Sprint 1 
    - User authentication and profiles
    - Location search and filtering

2. Sprint 2 
    - Route locations together
    - Location cards to view info about Locations

3. Sprint 3
    - Share route/itineraries


## Stories


## Database Relationships
```mermaid
erDiagram
    USERS ||--o{ SETTINGS : has
    USERS ||--o{ ITINERARIES : creates
    USERS ||--o{ FRIENDSHIPS : maintains
    FRIENDSHIPS }o--|| USERS : references
    ITINERARIES ||--o{ SHARED_ITINERARIES : has
    SHARED_ITINERARIES }o--|| USERS : viewable_by
    USERS {
        string user_id PK
        string email
        string password_hash
        datetime created_at
        datetime last_login
    }
    SETTINGS {
        string setting_id PK
        string user_id FK
        string theme_preference
        boolean notifications_enabled
        string default_location
    }
    ITINERARIES {
        string itinerary_id PK
        string user_id FK
        string name
        datetime date
        string location
        datetime created_at
        boolean is_public
    }
    FRIENDSHIPS {
        string friendship_id PK
        string user_id_1 FK
        string user_id_2 FK
        string status
        datetime created_at
    }
    SHARED_ITINERARIES {
        string share_id PK
        string itinerary_id FK
        string shared_with_user_id FK
        datetime shared_at
        string permission_level
    }
```
