# BACKEND

## Purpose
TennisMatch backend built with Spring Boot. Provides email-based auth, profile and onboarding data, deck matching, and chat (REST + WebSocket). Uses session cookies + CSRF for auth.

## Stack
- Java 21, Spring Boot 3.5.5
- Spring Web, Validation, Security
- Spring Data JPA + PostgreSQL + Hibernate Spatial (PostGIS)
- Flyway migrations
- Redis for cache, deck sessions, and optional auth flow store
- Spring Session (Redis) when spring-session-data-redis is present (properties configured)
- WebSocket (STOMP)
- Cloudinary for photo storage
- JavaMailSender for verification emails
- Lombok

## Code Style
- Standard Spring Boot layering: controllers delegate to services; repositories encapsulate persistence.
- Validation annotations on request DTOs with Spring Validation.
- Lombok is used to reduce boilerplate; constructor injection is preferred.
- DTOs and enums live in the domain package; entities use JPA annotations.

## Project layout
- src/main/java/com/tennismatch/backend/controllers: REST controllers
- src/main/java/com/tennismatch/backend/chat: chat controllers, services, repositories
- src/main/java/com/tennismatch/backend/services: domain services
- src/main/java/com/tennismatch/backend/repositories: JPA repositories + custom queries
- src/main/java/com/tennismatch/backend/domain: entities, DTOs, enums
- src/main/java/com/tennismatch/backend/configs: security, cache, redis, mail
- src/main/java/com/tennismatch/backend/utils: CSRF, geo helpers, auth helpers
- src/main/resources/application.properties: main config
- src/main/resources/db/migration: Flyway SQL migrations

## REST routes
- Auth
  - POST /auth/register (start email flow, returns flowId + next step)
  - POST /auth/verify (verify code, creates user if missing, sets session)
  - POST /auth/resend (resend code with cooldown and max count)
  - POST /auth/refresh (rehydrate session from TM_REFRESH cookie; returns MeProfileResponse and sets XSRF-TOKEN)
  - POST /auth/logout (revoke refresh token + clear cookies)
  - GET /auth/me (current session info)
- CSRF
  - GET /csrf (sets XSRF-TOKEN cookie)
- Profile
  - GET /profile (full profile for edit)
  - PATCH /profile (partial update)
  - GET /profile/me (cached view for UI)
  - /profile/me includes gender to support client-side default photo selection
- Onboarding
  - GET /me/onboarding-status (per-step flags + nextStep)
  - POST /me/onboarding-status/reset (reset onboarding flags to false; does not delete profile/preferences/location/photo)
  - POST /me/onboarding-status/complete (mark a single step complete by name)
- Photos
  - POST /profile/photo (multipart upload or replace)
  - GET /profile/photo (current photo or 204)
  - DELETE /profile/photo
- Preferences
  - GET /profile/preferences (current or 204)
  - PATCH /profile/preferences (upsert)
  - DELETE /profile/preferences
- User location
  - GET /profile/user-location (current or 204)
  - PATCH /profile/user-location (upsert)
  - POST /profile/user-location (create)
  - DELETE /profile/user-location
  - POST /profile/user-location/geocode (manual location -> lat/lon via Mapbox; rate limited)
- Deck and decisions
  - GET /me/deck (card list + deck token)
  - POST /me/decision (apply swipe decisions; returns match summary on mutual YES)
- Chat (REST)
  - GET /me/conversations (list)
  - /me/conversations includes lastMessageSnippet (nullable) for list previews
  - GET /me/conversations/{id} (details)
  - POST /api/conversations/by-match/{matchId}?userA=&userB= (create)
  - GET /api/conversations/{id}/messages (history)
  - POST /api/conversations/{id}/messages (send)

## Realtime chat
- WebSocket endpoint: /ws
- Subscribe: /topic/conversations.{id}
- Send: /app/chat.{id}.send
- Typing: /app/chat.{id}.typing
- Read: /app/chat.{id}.read
- Conversation list unreadCount uses last_read_at with a grouped MessageRepository query (single query across conversations; cast to int with cap). Conversation list unreadCount now uses last_read_at via MessageRepository count queries (cast to int with cap).
- Chat WS read events now update conversation_participant.last_read_at.

## Chat Maintenance Jobs
- expire: fixedDelay PT15M; marks ACTIVE conversations past expiresAt as EXPIRED; flag app.chat.maintenance.expire.enabled (default true).
- archive: cron 0 7 3 * * *; moves EXPIRED older than 7 days to ARCHIVED; flag app.chat.maintenance.archive.enabled (default true).
- purge: cron 0 17 3 * * *; deletes ARCHIVED older than 30 days; flag app.chat.maintenance.purge.enabled (default false, must be enabled intentionally).
- Global gate: app.chat.maintenance.enabled (default true) disables all chat maintenance tasks.

## Core behaviors
- Photo records store Cloudinary publicId for cleanup; deletes skip publicIds under constant_photos/.
- OnboardingStatus V17 migration backfills flags for existing users based on non-null profile fields and existing preference/location/photo rows.
- OnboardingStatus flags update when onboarding steps are saved (profile patch fields, preferences/location upserts, photo upload or profile photo URL set).

- PATCH /profile supports photoUrl to set a profile photo link without uploading a file.
- /profile/me returns photo as null when no photo exists; defaults are handled by clients.

- Auth flow
  - POST /auth/register sends a 6-digit code via email
  - Flow TTL is 10 minutes
  - Resend cooldown 30s, max 3 resends per flow
  - /auth/verify creates a UserProfile if missing and sets session
  - /auth/verify runs in a transaction so onboarding_status can persist with the managed UserProfile
- Profile read/write
  - PATCH /profile updates only non-null fields
  - /profile/me is cached in Redis and evicted on updates
  - Missing or blank profile descriptions default to "A passionate tennis lover looking for local players."
- Deck + decisions
  - GET /me/deck builds cards from cached candidate IDs, filters out swiped targets, assigns random card ids, and includes targetId for client dedupe
  - Deck candidate query allows full skill range; ordering still prefers same-skill first, then distance
  - Deck token stored in Redis with 15 minute TTL
  - POST /me/decision supports Idempotency-Key header or per-item key and returns matchId/conversationId + matched user summary when a match occurs
  - Mutual YES creates Match and opens chat conversation
  - Deck default avatar URL is a local placeholder path (/placeholder-man-image.png)
- Chat
  - Conversations TTL is configurable via app.chat.conversation.ttl (default PT24H) and extends on every message
  - Messages support clientId idempotency per conversation
- Email
  - ResendEmailSender supports verification and notification emails (shared HTML template with Continue CTA) and prefixes subjects with [TennisMatch].
  - ResendEmailSender retries sends with backoff; attempts configurable via app.mail.resend.max-attempts.

## Data model highlights
- UserProfile: name, age, gender, skillLevel, description, visible, lastActiveAt (UTC timestamp of last API activity)
- OnboardingStatus: per-user onboarding step flags (name/about/age/gender/tennisLevel/profilePhoto/preferences/location), 1:1 with user_profile
- UserLocation: PostGIS point (lat/lon), accuracy, updatedAt
- UserLocation also stores optional place_name (human-readable label for UI)
- Preference: game, partnerGender, sessionType, maxDistanceKm
- UserAction: swipe decisions with optional idempotencyKey
- Match: created when two YES decisions occur
- Chat: Conversation, ConversationParticipant, Message
- NotificationDigestState: per-user digest tracking (type, lastSentAt, lastWindowStart/End, meta)

## Security notes
- Cookie-based session auth (JSESSIONID)
- CSRF token via CookieCsrfTokenRepository (XSRF-TOKEN cookie)
- Frontend sends X-XSRF-TOKEN for mutating requests
- CORS allows localhost:3000 and prod domains (see SecurityConfig)
- CSRF ignored for /auth/** and /ws/**

## Cookie & Session Model
- Session cookie (JSESSIONID)
  - Set after /auth/verify creates a session and saves SecurityContext (AuthController + HttpSessionSecurityContextRepository).
  - Attributes from server.servlet.session.cookie.*: HttpOnly=true, Secure=true, SameSite=None, Path=/, Domain unset, no Max-Age (session cookie).
  - Server-side TTL: server.servlet.session.timeout=10m; if Spring Session is active, spring.session.timeout=10m controls Redis TTL (namespace spring:session).
- Session timeout is inactivity-based; each request touching the session updates lastAccessedTime; after 10 minutes without requests, server invalidates it.
- RedisConfigLogger logs resolved Redis endpoint and SSL at startup (sanitized; no secrets).
- CSRF cookie (XSRF-TOKEN)
  - Set by /csrf (CsrfController) and any request that accesses CsrfToken.
  - CookieCsrfTokenRepository uses header X-XSRF-TOKEN; HttpOnly=false; Secure=app.cookies.secure; SameSite=None when secure else Lax; Path=/; Domain unset; no Max-Age.
- Refresh cookie (TM_REFRESH)
  - Set by /auth/verify; rotated on /auth/refresh; stored hashed in refresh_token table.
  - Attributes: HttpOnly=true; Secure=app.cookies.secure; SameSite=None when secure else Lax; Path=/auth; Domain unset; Max-Age=7 days.
- 10-minute TTLs elsewhere: AuthFlowServiceImpl.FLOW_TTL (email flow) and cache TTLs in CacheConfig/RedisConfig. If sessions expire at ~10m in a running environment, check runtime overrides like SPRING_SESSION_TIMEOUT / SERVER_SERVLET_SESSION_TIMEOUT or external config not in repo.

## Persistent Login
- TM_REFRESH is a 7-day refresh cookie; issued on /auth/verify and rotated on /auth/refresh.
- /auth/refresh
  - POST; permitAll; requires header X-TM-Refresh: 1 and Origin in the frontend allowlist.
  - Validates/rotates refresh token, creates a new HttpSession + SecurityContext, returns MeProfileResponse (same shape as /profile/me) and sets XSRF-TOKEN cookie.
- /auth/logout
  - POST; same header + Origin checks as refresh.
  - Revokes refresh token, invalidates session, clears TM_REFRESH and best-effort JSESSIONID.
- Security rationale: /auth/** is CSRF-exempt, so the extra header + Origin allowlist mitigate CSRF for refresh/logout.
- Frontend flow: 401 -> POST /auth/refresh (sets XSRF-TOKEN, returns /profile/me payload) -> retry original request once; /csrf is skipped for /profile/me.
- Session TTL stays short (10m by default) and configurable via server.servlet.session.timeout and spring.session.timeout; session cookie remains non-persistent.
- Render sleep or restarts can drop in-memory sessions; TM_REFRESH rehydrates them on demand.


## Refresh Token Cleanup
- Scheduled cleanup (app.refresh.cleanup.enabled=true) runs daily via cron app.refresh.cleanup.cron (default 0 0 4 * * *).
- Deletes expired tokens (expires_at < now) and revoked tokens older than retention (app.refresh.cleanup.retention-days=30).
- Logs deleted counts at INFO; index on revoked_at supports cleanup.

## Cache and storage
- Redis cache: profile:me (10 minutes)
- Redis cache: me:conversations (5 seconds, keyed by userId + inboxVersion)
- Redis cache: me:deck (5 seconds, keyed by userId + deckVersion + size, stores candidate IDs + distance only)
- Redis cache serializer uses an ObjectMapper with JavaTimeModule + type metadata (polymorphic typing) so Instant fields and DTO lists round-trip safely.
- Cache key prefix bumped to `tinder:v2:` to avoid old Redis entries causing deserialize failures.
- CacheErrorHandler logs and swallows cache GET/PUT/EVICT/CLEAR errors to avoid cache failures causing 500s.
- Session store: servlet container by default; Redis-backed Spring Session when spring-session-data-redis is on the classpath (properties already set).
- Deck tokens stored in Redis (deck:session:{token})
- Auth flow store: DB by default, Redis if auth.flow.store=redis
- Refresh tokens stored in Postgres (refresh_token)

## Logging strategy
- Debug/timing/perf probe tooling removed (DeckController/DeckService debug logs, cache/redis/session debug flags, timing filters, and perf probe endpoints).
- Operational logs retained: startup config (RedisConfigLogger), cache error warnings, auth failures, and unexpected exceptions.

## Request correlation
- Each request gets an `X-Request-Id`; if the client sends `X-Request-Id` or `X-Correlation-Id`, it is reused.
- Logs include `requestId` in MDC; log pattern includes `[reqId=<id>]`.

## Notifications (planned)
- Flyway V12 adds notification_digest_state with unique (user_id, type) plus indexes on (type, last_sent_at) and user_id.
- Backfill strategy: no rows required at migration time; create rows lazily on first send per user/type (optional batch insert later if needed).
- Flyway V13 adds user_profile.last_active_at with a backfill to now(); a LastActiveFilter updates it on authenticated API calls (15-minute minimum interval).
- Flyway V14 adds conversation_participant.last_read_at; conversation detail + initial message history requests update it for unread tracking.
- Daily unread digest scheduler sends at 9:00 AM America/Los_Angeles to users active within 14 days and stores per-user digest state (NotificationDigestType.UNREAD_DAILY).
- NotificationDigestScheduler includes commented-out every-minute crons for local testing (daily + weekly).
- Weekly match digest scheduler sends at 9:00 AM America/Los_Angeles on Mondays for matches created since the week's start.
- Digest copy uses "match(es)" and "message(s)" wording; email CTA button uses the main brand color (#0E5628).
- Per-user error handling logs failures and continues processing remaining users.
- Digest runs log durationMs, scanned/sent/failed/skipped counts, and whether a safety cap was reached.

## Constraints
- Cookie-based session auth (JSESSIONID) required for protected routes.
- CSRF token required for mutating requests; /auth/** and /ws/** are exempt.
- PostGIS is required for geo queries (UserLocation).
- Redis required for caching and deck tokens; session storage uses the servlet container unless Spring Session is enabled; auth flow can optionally use Redis.
- Cloudinary credentials required for profile photo uploads.
- Mail provider credentials required for verification emails.
- Mapbox token (MAPBOX_TOKEN) required for manual location geocoding.
- UserProfile age must be at least 18 (DB check constraint).
- UserProfile age validated at 18+ via @Min on entity/DTO.
- Location updates are rate-limited per user (default 10 per day, UTC) via app.location.update.daily-limit and enforced server-side with a 429 response.

## Runtime Tuning (Render 512MB)
- application.properties includes conservative Tomcat + Hikari limits:
  - server.tomcat.threads.max=50
  - server.tomcat.threads.min-spare=5
  - spring.datasource.hikari.maximum-pool-size=5
  - spring.datasource.hikari.minimum-idle=1
- JVM flags must be set as env vars (not read from application.properties):
  - JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=60 -XX:InitialRAMPercentage=40 -Xms128m -Xmx256m

## Architecture patterns
- Layered architecture (controller -> service -> repository).
- REST for synchronous flows; STOMP WebSocket for chat events.
- Flyway migrations are the schema source of truth.
- Redis used for caching and short-lived session/deck state.

## Domain context
- Email-based signup and verification with session cookies.
- Profile creation, onboarding data, preferences, and location.
- Discover deck and swipe decisions leading to matches.
- Match-based messaging via REST + WebSocket.

## Env vars
- SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD
- SPRING_FLYWAY_ENABLED, SPRING_FLYWAY_SCHEMAS
- SPRING_JPA_HIBERNATE_DDL_AUTO, SPRING_JPA_PROPERTIES_HIBERNATE_DEFAULT_SCHEMA
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- SPRING_MAIL_USERNAME, SPRING_MAIL_PASSWORD, APP_MAIL_FROM
- FRONTEND_URL (defaults to http://localhost:3000), CORS_ALLOWED_ORIGINS (defaults to http://localhost:3000)
- APP_REFRESH_PEPPER (long random secret; required in prod)
- AUTH_FLOW_STORE (db or redis)
- PORT (default 8080)
- APP_CHAT_CONVERSATION_TTL (maps to app.chat.conversation.ttl; default PT24H)
- MAPBOX_TOKEN (manual location geocoding)

## Commands
- ./mvnw clean test
- ./mvnw package -DskipTests
- ./mvnw clean package

## Maintenance Notes
- Removed repo-level `scripts/` utilities and perf probe harness; no build scripts depend on them.

## Notification Flags
- app.notifications.daily.enabled (default false)
- app.notifications.weekly.enabled (default false)
- app.notifications.zone (default America/Los_Angeles)
- app.notifications.daily.cron (default 0 0 9 * * *)
- app.notifications.weekly.cron (default 0 0 9 * * MON)
- app.notifications.max-per-run (default 500)

## Testing Strategy
- Current: limited coverage; observability/perfprobe tests removed with debug tooling.
- Unit tests for service and utility logic.
- Repository tests with @DataJpaTest for PostGIS queries.
- Controller tests with MockMvc and security enabled.
- Add integration tests later for auth flow, deck, and chat.

## Git Workflow
- Use feature branches off main (e.g., feature/<topic>).
- Main branch is prod.
- Avoid committing build artifacts like target/.


## Redis Cache Serialization (v8)
- CacheManager and RedisTemplate use one `redisObjectMapper` with JavaTimeModule and property-based `@class` typing for com.tennismatch DTOs.
- Collection/map roots are stored as plain JSON arrays/objects; element DTOs carry `@class`.
- Cache key prefix uses `tinder:v8:` so old-format entries are ignored.
- Cache errors are swallowed by CacheErrorHandler to avoid 500s on cache failures, and corrupt keys are evicted on GET errors.
- Cache names are centralized in `CacheConfig` (e.g., `PROFILE_ME_CACHE`, `CONVERSATIONS_CACHE`, `DECK_CACHE`).
- Redis cache ObjectMapper is built inside serializer beans (no extra ObjectMapper bean) to avoid WebSocket converter cycles.
- CacheManager is defined in `RedisConfig` to build from the shared `RedisCacheConfiguration` and `redisValueSerializer`, ensuring one serializer path for cache values.
- Cache values use typed Jackson serializers per cache (`MeProfileResponse`, `List<ConversationListDto>`, `List<DeckCandidateDto>`) to avoid polymorphic `Object` cache values.

## Conversation Projections
- `ConversationListView` is a top-level projection in `com.tennismatch.backend.chat.repositories` to avoid nested-interface classpath issues during compile.
