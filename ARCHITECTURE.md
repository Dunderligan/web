# Architecture Documentation

## Overview

Dunderligan is a full-stack web application for managing Sweden's largest recurring Overwatch tournament. The application is built with modern web technologies and follows best practices for maintainability and scalability.

## Technology Stack

### Frontend
- **SvelteKit 2.x**: Full-stack framework with server-side rendering (SSR)
- **Svelte 5**: Reactive component framework with the latest features
- **TailwindCSS 4.x**: Utility-first CSS framework for styling
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server

### Backend
- **SvelteKit Server Routes**: API endpoints and server-side logic
- **SvelteKit Remote Functions**: Experimental feature for RPC-style mutations
- **Node.js Adapter**: Production deployment adapter

### Database
- **PostgreSQL**: Primary relational database
- **Drizzle ORM**: Type-safe ORM with SQL-like syntax
- **Drizzle Kit**: Database migration and schema management tool

### External Services
- **Cloudflare R2**: Object storage for media files
- **Cloudflare Images**: Image optimization and CDN
- **Arctic**: OAuth library for Battle.net authentication

### Infrastructure
- **Docker**: Containerized deployment
- **Lysator**: Hosting on Linköping University Computer Society hardware

## Application Architecture

### Directory Structure

```
hemsida/
├── src/
│   ├── app.css              # Global styles
│   ├── app.d.ts             # Type declarations
│   ├── app.html             # HTML template
│   ├── hooks.server.ts      # SvelteKit server hooks
│   ├── lib/
│   │   ├── assets/          # Static assets used by components
│   │   ├── components/      # Reusable Svelte components
│   │   │   ├── admin/       # Admin panel components
│   │   │   ├── match/       # Match display components
│   │   │   ├── structure/   # Layout and structure components
│   │   │   ├── table/       # Table/standings components
│   │   │   └── ui/          # UI primitive components
│   │   ├── remote/          # SvelteKit remote functions (mutations)
│   │   ├── server/          # Server-side code
│   │   │   ├── auth/        # Authentication logic
│   │   │   ├── db/          # Database configuration and schemas
│   │   │   │   └── schema/  # Drizzle schema definitions
│   │   │   └── storage/     # File storage integration
│   │   ├── state/           # Client-side state management
│   │   ├── bracket.ts       # Tournament bracket logic
│   │   ├── match.ts         # Match-related utilities
│   │   ├── schemas.ts       # Zod validation schemas
│   │   ├── table.ts         # Standings table logic
│   │   ├── types.ts         # TypeScript type definitions
│   │   └── util.ts          # General utilities
│   └── routes/              # SvelteKit file-based routing
│       ├── api/             # API endpoints
│       │   └── login/       # Authentication endpoints
│       ├── (app)/           # Main application routes
│       │   ├── admin/       # Admin panel pages
│       │   ├── arkiv/       # Archive pages
│       │   ├── lag/         # Team pages
│       │   ├── om/          # About page
│       │   ├── setup/       # Initial setup page
│       │   └── stallningar/ # Standings pages
│       ├── +error.svelte    # Error page
│       ├── +layout.svelte   # Root layout
│       └── +page.svelte     # Home page
├── static/                  # Static files served as-is
├── drizzle/                 # Database migrations
├── assets/                  # Build-time assets
├── .env.example             # Environment variables template
├── Dockerfile               # Docker container definition
├── drizzle.config.ts        # Drizzle ORM configuration
├── package.json             # Node.js dependencies
├── pnpm-workspace.yaml      # pnpm workspace configuration
├── svelte.config.js         # SvelteKit configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite build configuration
```

## Core Concepts

### Tournament Structure

The application models a hierarchical tournament structure:

1. **Season**: A tournament season (e.g., "Dunderligan 2024")
2. **Division**: Skill-based divisions within a season (e.g., "Diamond", "Platinum")
3. **Group**: Groups within divisions for group-stage matches
4. **Roster**: A team's roster for a specific season
5. **Team**: The persistent team entity across seasons
6. **Player**: Individual players with unique Battletags
7. **Member**: Association between players and rosters with rank/role info
8. **Match**: Individual matches between two rosters

### Routing Strategy

SvelteKit uses file-based routing with special conventions:

- **Route groups**: `(app)/` groups routes without affecting URLs
- **Dynamic routes**: `[param]/` creates dynamic route segments
- **Layouts**: `+layout.svelte` files provide nested layouts
- **Pages**: `+page.svelte` files are the actual pages
- **Server routes**: `+server.ts` files handle API endpoints
- **Page data**: `+page.ts` and `+page.server.ts` files load data for pages

### Data Flow

1. **Data Loading**: Server-side data loading in `+page.server.ts` or `+page.ts`
2. **Database Queries**: Using Drizzle ORM with the relations API
3. **State Management**: Client-side state using Svelte's reactive stores
4. **Mutations**: Using SvelteKit remote functions for data modifications
5. **Real-time Updates**: Automatic re-fetching after mutations

### Authentication Flow

1. User initiates Battle.net OAuth login via `/api/login/battlenet`
2. Redirect to Battle.net authorization page
3. Callback receives authorization code at `/api/login/battlenet/callback`
4. Exchange code for access token
5. Fetch user profile from Battle.net API
6. Create or update user in database
7. Set secure session cookie
8. Redirect to application

### Component Architecture

Components follow a hierarchical structure:

1. **Structure Components**: Page layout, sections, headers (`PageHeader`, `PageSection`)
2. **UI Components**: Buttons, inputs, cards, modals (reusable primitives)
3. **Feature Components**: Match displays, standings tables, brackets
4. **Admin Components**: CRUD operations, forms, data management

### Styling Approach

- **Utility-First**: TailwindCSS utilities for most styling
- **Component Styles**: Scoped `<style>` blocks for component-specific styles
- **Custom Fonts**: Custom font files in `static/fonts/`
- **Responsive Design**: Mobile-first approach with breakpoint utilities (sm, md, lg)
- **Design Tokens**: Accent colors and consistent spacing

## Database Architecture

### Schema Design

The database uses a normalized relational schema with:

- **UUID primary keys**: For all entities
- **Foreign keys with cascades**: Automatic cleanup of related data
- **Unique constraints**: Preventing duplicate data
- **Check constraints**: Data validation at database level
- **Timestamps**: Created/updated tracking on all tables

### Relations

Drizzle ORM manages complex relationships:

- **One-to-many**: Season → Divisions, Division → Groups
- **Many-to-many**: Players ↔ Rosters (through Members)
- **Self-referential**: Match → nextMatch (bracket structure)
- **Polymorphic**: Matches can belong to Group OR Division

## Performance Considerations

### Optimization Strategies

1. **Server-Side Rendering**: Fast initial page loads with SEO benefits
2. **Code Splitting**: Automatic route-based splitting by Vite
3. **Image Optimization**: Cloudflare Images CDN with automatic resizing
4. **Database Indexing**: Indexes on frequently queried columns
5. **Connection Pooling**: Efficient database connection management
6. **Lazy Loading**: Components and data loaded on-demand

### Caching Strategy

- **Static Assets**: Long-term browser caching with cache-busting
- **CDN Caching**: Cloudflare for media files and static content
- **Database Queries**: Relations API reduces N+1 queries

## Security

### Security Measures

1. **OAuth Authentication**: Battle.net OAuth 2.0 for secure user login
2. **Session Management**: Secure HTTP-only cookies with expiration
3. **CSRF Protection**: Built into SvelteKit forms
4. **SQL Injection Prevention**: Drizzle ORM parameterized queries
5. **Environment Variables**: Secrets stored in `.env` files (never committed)
6. **Role-Based Access**: Admin privileges required for sensitive operations
7. **Input Validation**: Zod schemas validate all user input

## Development Workflow

### Local Development

1. Clone repository
2. Install dependencies: `pnpm install`
3. Set up PostgreSQL database locally
4. Copy `.env.example` to `.env` and configure `DATABASE_URL`
5. Push schema to database: `pnpm db:push`
6. Run development server: `pnpm dev`
7. Access setup page at `http://localhost:5173/setup`

### Database Development

1. Modify schema files in `src/lib/server/db/schema/`
2. Run `pnpm db:push` to sync with local database
3. Test changes locally
4. Run `pnpm db:generate` to create migration SQL files
5. Migrations run automatically in production on startup

### Code Quality

- **Type Checking**: `pnpm check` - TypeScript and Svelte type checking
- **Linting**: `pnpm lint` - Prettier for code formatting
- **Format**: `pnpm format` - Auto-format all files

## Deployment

### Docker Deployment

1. Build Docker image using `Dockerfile`
2. Set required environment variables
3. Run container with appropriate port mapping
4. Database migrations run automatically on startup
5. Application serves on configured port (default 3000)

### Production Environment

- **Server**: Lysator hardware in Linköping, Sweden
- **Container Runtime**: Docker
- **Database**: Separate PostgreSQL instance
- **CDN**: Cloudflare for static assets and images
- **Domains**: 
  - Production: `dunderligan.se`
  - Staging: `dev.dunderligan.se`

### Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL`: PostgreSQL connection string
- `BATTLENET_CLIENT_ID`: Battle.net OAuth client ID
- `BATTLENET_CLIENT_SECRET`: Battle.net OAuth client secret
- `BATTLENET_REDIRECT_URI`: OAuth callback URL
- `R2_*`: Cloudflare R2 storage credentials (optional for core functionality)
- `CLOUDFLARE_IMAGES_*`: Cloudflare Images credentials (optional)

## Future Architecture Considerations

### Scalability

- **Horizontal Scaling**: Multiple container instances behind load balancer
- **Database Scaling**: Read replicas for query optimization
- **Caching Layer**: Redis for session storage and query caching
- **Message Queue**: Background job processing for heavy operations (e.g., notifications)

### Monitoring & Observability

- **Error Tracking**: Integration with Sentry or similar
- **Performance Monitoring**: APM for bottleneck identification
- **Logging**: Structured logging for debugging
- **Analytics**: User behavior tracking
- **Health Checks**: Endpoint monitoring for uptime

### Feature Enhancements

- **Real-time Updates**: WebSocket integration for live match updates
- **Mobile App**: Native mobile applications (iOS/Android)
- **Public API**: RESTful API for third-party integrations
- **Internationalization**: Multi-language support beyond Swedish
- **Push Notifications**: Match reminders and result notifications
- **Advanced Statistics**: Player and team performance analytics
