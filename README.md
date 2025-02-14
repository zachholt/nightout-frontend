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
- [] View friends' public itineraries

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



## Tech Stack
- Frontend: 
- Backend: 
- Database: 

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
