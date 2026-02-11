# FRONTEND

## Purpose
TennisMatch frontend built with Next.js App Router. The root route redirects based on the JSESSIONID cookie to either registration or profile.

## Stack
- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS v4 (tokens in globals.css)
- framer-motion for UI motion
- @stomp/stompjs for chat WebSocket
- react-virtuoso for chat list virtualization
- msw available for local API mocking (currently commented out)
- clsx, tailwind-merge, uuid for UI helpers

## Code Style
- TypeScript with strict mode enabled (see tsconfig.json).
- Next.js App Router with client components for interactive UI.
- API calls use apiFetch for cookies and CSRF; auth flow uses direct fetch.
- Tailwind CSS v4 tokens in globals.css; class composition via clsx and tailwind-merge.
- ESLint configured; Next build ignores lint errors (next.config.ts).

## Project layout
- src/app: routes and layouts
- src/components: reusable UI pieces (onboarding, cards, chat)
- src/hooks: client hooks (deck/discover)
  - useUnreadTotal polls /me/conversations for bottom-nav unread badge totals (10s)
- src/lib: API clients, cookies/CSRF handling, constants, helpers
- src/lib/ws: WebSocket chat client
- src/mocks: MSW setup and handlers
- public: icons and images

## Routes
- / is a client bootstrap that calls /me/onboarding-status (with refresh) and redirects to the earliest incomplete onboarding step (or /profile when complete)
- /registration, /verify, /profile, /edit-profile, /settings
- /discover, /courts, /coach
- /messages and /messages/[chatId]
- /terms
- /policy
- /tennis-level-comparison
- Onboarding group: /(onboarding)/name, about, age, gender, tennis-level, profile-photo, user-preferences, user-location

## Auth flow
- /registration calls POST /auth/register with { email }, stores flowId in localStorage, then redirects to /verify
  - Registration email input uses email-friendly attributes (autocomplete/inputmode) for iOS suggestions
- /verify calls POST /auth/verify with { flowId, code }
  - next: GO_TO_PROFILE -> /profile
  - next: COMPLETE_PROFILE -> /name
- /verify can POST /auth/resend to resend the code
- /me/onboarding-status returns per-step flags and nextStep for routing/guards
- /me/onboarding-status/complete marks a single onboarding step as complete (used on Continue across onboarding pages)

## API layer
- Profile photos are cleaned up server-side using stored CDN publicId; assets in constant_photos are never deleted.

- src/lib/cookies.ts: apiFetch wrapper
  - Uses NEXT_PUBLIC_API_URL as base
  - Adds Accept: application/json by default
  - Sends credentials: include for cookie auth
  - Caches CSRF token (from /csrf body.token or XSRF-TOKEN cookie) with single-flight init; /csrf is skipped when XSRF-TOKEN cookie already exists
  - Adds X-XSRF-TOKEN for mutating requests
  - GET /csrf for CSRF token refresh
  - POST /auth/refresh on 401, then retries once (X-REFRESH-RETRIED)
  - Retries once on 403 after refreshing CSRF (X-CSRF-RETRIED)
- /profile/me bootstrap: apiFetch uses /auth/refresh response body on 401 (refresh sets CSRF cookie) to avoid extra /csrf + retry; falls back to /profile/me once if payload is invalid.
- Profile: src/lib/api/profile.ts
  - GET /profile/me (fetchMyProfile, getMyProfile)
  - PATCH /profile (updateMyProfile) with bio -> description mapping and skillLevel enum mapping
  - POST /profile/photo (uploadProfilePhoto)
  - /profile/me response includes gender for client-side default photo selection
  - skillLevel normalization uses toSkillLabel for consistency with deck mapping
- Conversations: src/lib/api/conversations.ts
  - GET /me/conversations
  - GET /me/conversations/{chatId}
  - POST /conversations/by-match/{matchId}?userA=&userB=
  - /me/conversations items include lastMessageSnippet (nullable) for list previews
  - Backend caches conversations with Instant fields; cache errors are swallowed server-side to avoid 500s.
- Messages: src/lib/api/messages.ts
  - GET /api/conversations/{conversationId}/messages?before_id=&limit=
  - POST /api/conversations/{conversationId}/messages
- Me: src/lib/api/me.ts
  - GET /api/whoami
- Deck/discover: src/lib/deckApi.ts
  - GET /me/deck
  - POST /me/decision (supports Idempotency-Key header)
  - Deck cards include targetId for client-side dedupe
  - Deck API maps backend skillLevel enums to human labels via toSkillLabel
- Preferences: src/lib/preferences.ts
  - GET/PATCH/DELETE /profile/preferences
  - UI shows miles; values are converted to/from backend km in preferences helpers
- Location: src/lib/locationApi.ts
  - GET /profile/user-location
  - POST/PATCH /profile/user-location
  - POST /profile/user-location/geocode (manual fallback via Mapbox)

## Realtime chat
- src/lib/ws/messages-ws.ts
  - STOMP over native WebSocket via @stomp/stompjs (no SockJS).
  - URL: NEXT_PUBLIC_WS_URL or ws://localhost:8080/ws; use wss:// in prod.
  - Client config: reconnectDelay=1500ms, debug disabled, connected flag tracked.
  - Subscribes to /topic/conversations.{id}.
  - Publishes to /app/chat.{id}.send with { body, clientId }.
  - Inbound envelope: { kind: "MESSAGE" | "TYPING" | "READ", data: ... }.
    - MESSAGE data matches MessageDto (id, senderId, body, createdAt, status, clientId).
    - TYPING data: { userId, isTyping, ts } (not used in UI).
    - READ data: { userId, lastSeenId } (not used in UI).
- src/app/messages/[chatId]/page.tsx
  - Creates ChatWs per chat; subscribes once and handles MESSAGE events only.
  - Optimistic sends use uuid clientId; if not connected, falls back to REST sendMessageRest.
  - History via GET /api/conversations/{id}/messages; meta via GET /me/conversations/{id}.
- Auth/session
  - WebSocket handshake relies on JSESSIONID cookies; CSRF is not used for /ws on the backend.
  - Cross-origin WS needs SameSite=None + Secure cookies and allowed origins; prefer same-origin.

## Discover flow
- src/hooks/useDeck.ts manages deck hand/reserve for /discover
- Swipe left/right posts decisions to /me/decision with idempotency keys
- /discover initial load calls /me/deck once; reserve refills only after the first swipe to avoid an immediate second fetch
- useDeck dedupes incoming cards by targetId and removes duplicates from hand/reserve when swiping; an in-session excludedTargetIds set is updated immediately on swipe and used to filter all incoming deck results, even if POST /me/decision has not yet persisted
- /discover shows MatchModal on instant match using /me/decision response (match summary with conversationId, name, age, photoUrl); Start navigates to /messages/{conversationId}, Later dismisses

## Styling and UI
- Default profile photo URLs live in src/lib/profilePhotos.ts (CDN placeholders).
- On /(onboarding)/profile-photo, skipping the upload PATCHes /profile with a default photoUrl instead of uploading a file.

- On /(onboarding)/user-preferences, default selections are Tennis for Game and Match for Type.
- Settings and onboarding user-preferences now share `frontend/src/components/UserPreferencesPage.tsx`; onboarding renders without an extra max-width wrapper to avoid double padding.
- The onboarding user-preferences page wraps the shared client component in `Suspense` to satisfy `useSearchParams` CSR bailout rules.
- /tennis-level-comparison back arrow falls back to a text Back button if the image fails to load.
- Chat header uses the light back arrow icon ("/arrow-back-light.svg").
- /tennis-level-comparison uses the dark back arrow icon ("/arrow-back-dark.svg").
- SmallChoiceButton now mirrors ContinueButton disabled styling via a default disabled prop and shared disabled visuals.
- Pickleball and Private Lesson options are disabled on onboarding and settings preference screens, because this functionality is not added yet.
- CircleMediumButton supports a disabled state; the Profile page Coach button is currently disabled.
- Bottom nav items are currently Discover, Messages, Profile (Courts/Map is commented out) and nav grids use three columns via the shared BottomNav component in src/components/BottomNav.tsx; BottomNav supports a configurable backgroundClassName with a transparent default.
  - BottomNav shows a red unread badge on Messages, capped at 99+, excluding the active chat route.
- Discover page card stack uses a bottom inset on absolute card layers to preserve rounded corners above the bottom nav bar.
- globals.css defines CSS variables and Tailwind theme mapping
- Root layout uses Inter font variable and sets font-sans
- Next Image remotePatterns allow CDN assets

## Mocking
- src/app/msw-init.tsx can start MSW in dev
- MswInit is currently commented out in src/app/layout.tsx

## Env vars
- NEXT_PUBLIC_API_URL (API base)
- NEXT_PUBLIC_WS_URL (WebSocket base including /ws; optional, use wss:// in prod)

## Commands
- npm run dev
- npm run build
- npm run start
- npm run lint

## User flows
- Entry: / checks /me/onboarding-status when authenticated and routes to the earliest incomplete onboarding step (or /profile)
- Onboarding: sequential screens under /(onboarding) (name, about, age, gender, tennis-level, profile-photo, user-preferences, user-location)
- Profile: view/edit via /profile and /edit-profile; profile update uses PATCH /profile
- Messaging: /messages list and /messages/[chatId] for chat thread

## Behavior rules
- On /(onboarding)/age, show an inline error when all date slots are filled but the date is invalid (same styling as server-save errors).
- On /(onboarding)/age, users must be 18+; show a friendly error if younger.
- On /(onboarding)/about, Continue is enabled even with an empty bio; submitting empty saves the backend default from /profile/me.
- /policy: Children's Privacy states the service is not intended for children under 18; last updated January 13, 2026.
- /(onboarding)/profile-photo: Continue is allowed without an upload, but shows a modal warning; OK PATCHes /profile with a gender-based placeholder photo URL and continues, Cancel closes the modal.
- /(onboarding)/user-location: geolocation failures open a manual location modal with a country dropdown + free-text input (placeholder: "3225 Grim Avenue, San Diego"); submit geocodes to lat/lon and enables Continue.
- ConfirmModal component in src/components/ConfirmModal.tsx uses a shared SmallActionButton with active/inactive styles and supports optional backdrop overlay.
- Profile API defaults missing photos to gender-based placeholders (/placeholder-woman-image.png or /placeholder-man-image.png).
- /discover shows an animated loading card while the deck request is pending (useDeck isLoading).
- useDeck supports an optional mock delay via NEXT_PUBLIC_DECK_MOCK_DELAY_MS (set in .env.local for dev).
- LoadingIndicator component in src/components/LoadingIndicator.tsx provides the minimal animated loader used on /discover (no card background), sized by container.
- Discover deck default photo uses local placeholder assets from /public (no external CDN).
- Discover card distance pill displays miles converted from backend distanceKm.
- API calls should go through apiFetch to include cookies and CSRF handling (auth flow uses fetch directly)
- Mutating requests add X-XSRF-TOKEN from cookie and retry once on 401/403 after CSRF refresh
- Refresh flow uses POST /auth/refresh with X-TM-Refresh and Origin (from window.location.origin) to satisfy backend origin allowlist.
- Refresh flow is single-flight in apiFetch to avoid parallel refresh token rotation conflicts.
- Frontend guard: a global OnboardingGuard redirects authenticated users on protected routes to the earliest incomplete onboarding step using /me/onboarding-status
- Protected pages also redirect to /registration on auth/network failures during data fetches (profile/messages/discover), to avoid infinite loaders on iOS.
- When redirected into onboarding, the route includes `?registrationContinue=true` and the onboarding layout shows a modal to Continue or Start over (reset flags only).
- OnboardingResumeModal uses useSearchParams and is wrapped in Suspense in the onboarding layout to satisfy App Router rules.
- WebSocket chat connects on client and subscribes per conversation topic; subscriptions wait for STOMP connected state.
- Chat UI emits WS read events on incoming messages while a conversation is open to keep unread counts accurate.
- Chat messages render newest at bottom using react-virtuoso; list auto-follows when already at bottom, opens scrolled to the latest item, and uses a small vertical gap between bubbles via `pb-1` padding on each item.
- Chat messages auto-load older history in 50-message pages when scrolled to the top, with LoadingIndicator for initial load and header fetches.
- Older-message loading uses an absolute top overlay with a top-fade gradient (1/3 height) and an indicator offset 24px down.
- Chat history fetches add a dev delay of 1000ms plus NEXT_PUBLIC_DECK_MOCK_DELAY_MS (default 0).
- Chat history prepends older messages with react-virtuoso firstItemIndex (base 100000) to preserve scroll position.
- Edit profile save button is disabled until changes are made; shows Saving... then Saved and stays disabled until another edit; after a successful save, the page redirects to /profile; age cannot be changed on the edit profile page.
- Edit profile save button colors: dark green (disabled/no changes, label Save changes), main green (dirty/enabled), neutral gray while Saving..., dark green when Saved (disabled).
- /edit-profile supports manual location updates with a Location input (placeholder "street, city") and a Country select; location updates only apply on Save changes. If location is auto-detected (no place_name), the field renders as a gray "Location (auto-detected)" control that prompts for manual edit confirmation.
- /edit-profile passes backgroundClassName="bg-bg" to BottomNav to render a solid footer background.
- /edit-profile photo container uses a taller aspect ratio (4/5) with a 280px minimum height to better match the Profile card photo.
- /edit-profile photo container now has a neutral border to match the input field styling.
- Messages page locks page scrolling (outer wrapper `h-dvh overflow-hidden`) and makes the chats list the only scrollable region (`overflow-y-auto`) so scroll input always scrolls conversations, not the page. The card container uses `calc(100dvh - 80px - 56px - 24px)` to reserve space for the bottom nav and header without re-enabling page scroll. The list background is on items only so the list container does not look like the last row is stretching. The inner list wrapper matches the outer card radius and no inner shadow is used to avoid double-card visuals.
- /messages/[chatId] now uses the same scroll lock pattern (`h-dvh overflow-hidden` + inner `min-h-0`) so only the chat history area scrolls.
- Chat history scrollbar is hidden via a `chat-scroll` class that targets the Virtuoso scroller.
- Chat input bar uses a sticky wrapper with `bottom: calc(env(safe-area-inset-bottom) + var(--keyboard-offset))`; a visualViewport listener updates `--keyboard-offset` on iOS so the input stays centered above the keyboard without scroll leaks.
- Chat send button keeps keyboard open by preventing button focus (`onMouseDown`/`onTouchStart`) and refocusing the input after send.
- Chat input font size is 16px to prevent iOS auto-zoom when focusing the input.
- Android: when the keyboard opens (visualViewport height drops), the chat auto-scrolls to the bottom and followOutput stays pinned until the keyboard closes.
- BottomNav background defaults to transparent so the messages card shadow can show through under the fixed nav while keeping icons clickable; pass backgroundClassName to opt into a solid background.
- /discover and /profile lock page scroll with h-dvh + overflow-hidden so the card stacks remain fixed in the viewport.
- /profile now uses a higher-contrast palette with green primary and cool accent tones, plus layered gradients that avoid the header area; the card height now relies on flex sizing instead of a hard-coded calc so it stays aligned if header/nav sizes change. Profile page uses a shared --nav-height variable (`calc(66px + 12px + 12px)`) for bottom padding so the card ends above the nav.
- ProfileCard stretches to the nav-aligned height, uses a deeper photo vignette, a cooler skill badge accent, and a stronger primary CTA; the photo section relies on flex sizing (no max-height cap) to fill space cleanly.
- BottomNav now adds white circular icon backdrops when its background is transparent and sits above cards for clickability.
- Profile header logo has a subtle white pill backdrop for contrast, and the preferences action uses a new sliders-style icon.
- Profile page colors now come from `:root` tokens (profile gradients, card surfaces, badges, CTA), and the card shadow is softened via `--profile-card-shadow` (lighter/softer).


## State and caching
- Conversation meta cache in src/lib/cache/conversationMetaCache.ts
- Session is cookie-based (JSESSIONID), flowId stored in localStorage for auth
- /profile/me fetch uses single-flight dedupe in src/lib/api/profile.ts to avoid duplicate calls on initial load.

## Diagnostics Notes
- Frontend does not emit debug console logs; user-facing errors surface via inline error UI.
- Use DevTools Network to inspect responses and the `X-Request-Id` header for backend log correlation.

## Logging strategy
- Removed temporary debug logs/UI from deck load, profile fetch, cookies timing, and onboarding forms.
- No frontend debug env flags remain; keep errors user-visible and avoid console logging in production.

## Git Workflow
- Use feature branches off main (e.g., feature/<topic>).
- Main branch is a prod.
- Avoid committing generated build artifacts.

## External Dependencies
Runtime
- next, react, react-dom
- tailwind-merge, clsx, uuid
- framer-motion
- @stomp/stompjs
 - react-virtuoso
Dev
- eslint, eslint-config-next
- tailwindcss, @tailwindcss/postcss
- msw
- typescript, @types/*

## Testing Strategy
- Current: no dedicated frontend tests in the repo.
- Near term: unit tests for src/lib with mocked fetch.
- Component tests for key flows (registration, onboarding, discover) with React Testing Library.
- E2E tests later (Playwright) for auth + messaging flows.
- MSW can be used for deterministic API mocking.

## Constraints
- Cookie-based auth (JSESSIONID); root route redirects based on session cookie.
- CSRF required for mutating requests; apiFetch refreshes via /csrf and retries once on 401/403.
- NEXT_PUBLIC_API_URL is required for API calls.
- NEXT_PUBLIC_WS_URL is optional; defaults to ws://localhost:8080/ws; use wss:// in prod and keep it on the same cookie domain when possible.
- Remote images limited to CDN host (next.config.ts).
- Auth flow stores flowId in localStorage between /registration and /verify.

## Architecture Patterns
- App Router organized by route; pages are thin, logic in src/lib and src/hooks.
- Shared UI in src/components; domain-specific UI in feature routes.
- API boundary via apiFetch + DTO mapping functions.

## Domain Context
- Tennis partner discovery via deck swipe and preferences.
- Profile creation and onboarding completion.
- Messaging via REST + WebSocket.


- On /(onboarding)/about, the title is "My short description" and the placeholder is "A passionate tennis lover...".
- Frontend bio max is 100 chars on /(onboarding)/about and /edit-profile (backend still allows 200).

## Cross-cutting Notes
- Redis cache prefix bumped to `tinder:v2:` to avoid stale entries after serializer changes; no frontend action required.

## Backend Cache Notes
- Redis cache serialization now uses property-based `@class` metadata and a `tinder:v7:` key prefix; no frontend changes required.
- Cache name constants live in `CacheConfig` for backend annotations; no frontend changes required.
- Backend conversation list projection is top-level (`ConversationListView`); no frontend changes required.
- Redis cache ObjectMapper is internal to backend serializer to avoid framework bean cycles; no frontend changes required.

## Maintenance Notes
- Updated @tailwindcss/postcss and @eslint/eslintrc to clear js-yaml/tar audit warnings.
- Removed the repo-level `scripts/` directory; no frontend package scripts depended on it.

