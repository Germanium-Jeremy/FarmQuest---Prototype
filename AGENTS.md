# FarmQuest Implementation Guidance

This repository contains the FarmQuest Three.js client, the Express/WebSocket
server, and a static admin dashboard. Keep the client and server contracts in
sync, and keep duplicated admin assets synchronized:

- `src/admin/admin.html` is the client/source copy.
- `server/src/admin/admin.html` is the server-side copy read by
  `server/src/routes/adminPage.ts`.
- `server/public/admin/admin.html` is the deployable static copy when the
  deployment image serves public assets directly.

When changing the admin dashboard, update all three copies or replace the
duplication with one deliberately shared build/copy step.

## Requested Product Flow

### Player entry

- Remove the player login mode and the login link/form. The only player entry
  form must collect an email address and username/display name.
- The submit action is labeled `Play` (or equivalent) and creates a new game
  session through `POST /api/players/register`.
- Keep email normalization and validation on both client and server. Treat the
  username as the player's display name, validate its length/content, and do
  not make it optional in the new UI or registration contract unless a product
  decision explicitly allows a fallback.
- Remove the player-facing login API/client path (`/players/login` and
  `FarmQuestApi.loginPlayer`) once no supported client depends on it. Do not
  use login as a hidden alias for registration.
- Registration success must transition directly into a playable game. Do not
  show a waiting lobby and do not require an admin action. If character/map
  selection remains a product requirement, it must be a synchronous setup step
  that starts the game immediately after selection; otherwise use documented
  defaults and go straight to gameplay.
- Preserve the local-development fallback only if it cannot allow a production
  player to bypass server-side registration or create an inconsistent event.

### Automatic game start

- Remove `admin_start_game` as the player-start mechanism. The server must start
  an event instance automatically when the first valid player joins, or create
  an independent instance per player if games are intended to be isolated.
- Choose and document the concurrency policy. For a shared event, the first
  player's selected map establishes the instance map; subsequent players join
  only while the instance is accepting players and receive the same task set.
  For independent games, each registration/session gets its own instance.
- Make start and join atomic so two simultaneous registrations cannot create
  conflicting active instances or send duplicate `game_start` messages.
- Send `game_start` immediately after registration/join is accepted. A player
  must never remain blocked in `LOBBY` waiting for an admin.
- Update `GameState`, `Game.ts`, `GameSocket`/socket message types,
  `GameCoordinator`, and `EventHandler` together. Remove dead ready/lobby UI
  and admin start controls rather than leaving unreachable states.
- The admin remains an observer/operator. It may end an active event, but it
  must not be able to start one.
- An event must finish when all currently active players have completed or
  timed out, or when the admin explicitly ends it. Never wait for ten players.
  With fewer than ten participants, rank and reward only the available
  finishers: the winner count is `min(completed players, 10)`.

## Winners and Email Delivery

- Determine final ranking once, server-side, using the existing deterministic
  tie-break order (completion time, then score), and persist the final
  leaderboard before sending mail.
- Only ranks 1 through `min(final leaderboard length, 10)` receive coupons and
  emails. Players outside that set must not get a coupon or an email.
- Make reward issuance idempotent. A reconnect, duplicate completion message,
  retry, or repeated `/game/complete` call must not create another coupon or
  send another email. Keep coupon status transitions transactional where
  possible.
- Reconcile the two current completion paths: WebSocket completion in
  `server/src/ws/EventHandler.ts` and REST completion in
  `server/src/routes/gameResults.ts`. They must share one finalization/reward
  service or otherwise enforce the same top-ten decision; the REST path must
  not email every completed player.
- Do not finalize rewards when a player merely completes an individual task or
  level. Reward eligibility is based on the final event ranking.

## Email and Brand Collaborators

- Refactor `server/src/services/EmailService.ts` to build one responsive HTML
  email with this order:
  1. FarmQuest congratulations/result content.
  2. Coupon code and QR code in the middle.
  3. Collaborator branding/footer at the bottom.
- The plain-text alternative must contain the result, reward, coupon code, and
  collaborator names/links without relying on images.
- Do not rely on `data:` URIs for the QR image. Generate the QR as a buffer and
  attach it with a stable Content-ID, then reference it as `cid:` in the HTML.
  Set an explicit image MIME type, filename, and `contentDisposition` suitable
  for common mail clients. Keep the coupon code visible even if image loading
  is disabled.
- Store collaborator records with: required logo, required company name,
  required contacts, and an optional URL or social link. Include an active/
  display ordering field so the footer is predictable.
- Seed or migrate the initial collaborators: FarmQuest, Agrisense,
  AfricaInColors, and Cafe D'amour. Their records must be editable through the
  admin UI rather than hardcoded into the email template.
- Logos must be email-safe. Validate MIME type and size on upload, persist the
  file in a durable configured location, serve it with the correct content
  type, and/or attach each logo with a Content-ID. Prefer CID attachments for
  reliable display in clients that block remote images; never expose an
  unvalidated filesystem path in email HTML.
- Escape all user-controlled names, URLs, contacts, coupon values, and image
  metadata before inserting them into HTML. Validate allowed URL protocols and
  reject dangerous schemes.
- Extend environment/deployment documentation for upload storage, maximum
  logo size, and any SMTP or public-base-URL configuration required by email
  assets. Ensure Docker volumes preserve uploaded logos across restarts.

## Admin Collaboration Management

- Add authenticated admin endpoints and persistence for listing, creating,
  updating, deleting/deactivating, and ordering collaborators. A create/update
  request must require a company name, contacts, and a logo; URL/social link
  is optional but must be valid when supplied.
- Add a collaboration form to the dashboard with multipart image upload,
  validation errors, upload progress/feedback, edit/delete or deactivate
  controls, and a preview/list of active collaborators.
- Keep admin authentication on every collaboration endpoint and do not trust a
  client-provided admin flag. Do not log uploaded file contents or SMTP
  credentials.
- Centralize collaborator types and validation so the database, API, form,
  and email renderer cannot drift.

## Vendor Coupon Redemption

- Keep the player entry flow and vendor portal separate. Players register with
  email and display name on the game page; vendors do not register themselves.
- The vendor portal remains available at `/vendor` and must require vendor
  authentication before showing coupon details or allowing redemption.
- Admin collaboration/vendor management must allow an administrator to create
  a vendor account with a required contact email and a default password. Store
  only a secure password hash, require a password change on first login when
  practical, and never expose the default password in logs, email HTML, or API
  responses. Do not confuse a vendor login account with a collaborator footer
  record: a collaborator can be displayed in branding, while a vendor account
  authorizes reward redemption.
- After login, show a dedicated redemption page with:
  - a clear button to request camera access and scan the QR code;
  - a manual coupon-code input as an accessible fallback when camera access is
    denied, unavailable, or the QR image cannot be read; and
  - clear success, already-used, expired, not-found, and invalid-code states.
- Use a maintained browser QR-scanning library or a well-tested camera API;
  request camera permission only after the vendor chooses to scan, stop the
  camera stream when scanning succeeds or the page is left, and provide a
  keyboard/touch-friendly fallback. The page must work over HTTPS in deployed
  environments because browsers restrict camera access on insecure origins.
- A valid coupon must be invalidated/redeemed atomically as part of the
  redemption operation. Do not make “validate” followed by a separately
  authorized “redeem” the only protection: concurrent scans or requests must
  allow exactly one successful redemption, and every later attempt must report
  that the coupon was already redeemed.
- Validate and normalize the coupon format on the server, authorize the vendor
  on every validation/redemption request, and never trust a vendor ID or
  “admin/vendor” flag supplied by the browser. Return only the minimum reward
  information needed to fulfill the reward and do not expose unrelated player
  data.
- Record redemption time and the authenticated vendor/account that redeemed
  the coupon for auditability. Keep redemption idempotent and do not issue a
  second reward when the same code is retried.

Likely implementation files include `server/src/storage/database.ts`,
`server/src/types/index.ts`, `server/src/validation/schemas.ts`,
`server/src/routes/admin.ts`, `server/src/server.ts`, a new collaboration
service/route or upload middleware, `server/src/services/EmailService.ts`,
`server/src/services/CouponService.ts`, `server/src/ws/GameCoordinator.ts`,
`server/src/ws/EventHandler.ts`, `server/src/ws/types.ts`,
`server/src/routes/gameResults.ts`, `server/src/routes/players.ts`,
`src/api/FarmQuestApi.ts`, `src/game/Game.ts`, `src/game/GameState.ts`,
`src/ui/HUD.ts`, and the three admin HTML copies listed above.

Vendor-specific files include `server/src/routes/vendorPage.ts`,
`server/src/routes/vendors.ts`, `server/src/middleware/vendorAuth.ts`,
`server/src/storage/database.ts`, `server/src/types/index.ts`, the vendor
authentication and QR-scanning client code, and deployment documentation for
HTTPS/camera access and durable credential data.

## Admin Completion Experience

- When the server broadcasts the final `game_finished` payload, render the
  final leaderboard and trigger a short, accessible congratulation animation
  for the winners. It must also work with one to nine winners and with zero
  completed players.
- Respect `prefers-reduced-motion`, avoid blocking leaderboard interaction,
  and make the animation one-shot per finalized instance. Do not infer final
  results from an intermediate `leaderboard_update`.
- The dashboard must visibly distinguish `WAITING`, `IN_PLAY`, and `FINISHED`
  while no longer presenting a start-game button.

## Acceptance Checks

- A new visitor sees one email/username form; submitting it reaches gameplay
  without login, lobby waiting, or admin start.
- Two simultaneous first joins produce one valid instance/start sequence.
- A game with 1, 5, 10, and more than 10 participants finalizes correctly;
  exactly the available top ten, never more, receive reward emails.
- Duplicate completion/retry does not send duplicate mail or coupons.
- SMTP email clients show the QR code and all active collaborator logos, while
  the text alternative remains useful when images are blocked.
- An admin can add/edit/deactivate a collaborator with a logo without a
  rebuild, and the change appears in subsequently sent emails.
- An admin can create or update a vendor account with a contact email and
  default password, without allowing vendor self-registration.
- An authenticated vendor can open `/vendor`, grant camera access, scan a QR
  code, or enter its coupon code manually; a valid code is redeemed exactly
  once and later attempts are rejected.
- Camera denial, unsupported devices, malformed codes, concurrent redemption,
  expired coupons, and already-redeemed coupons produce clear recoverable
  outcomes without revealing credentials or unnecessary player information.
- Final admin results show the congratulation animation once and honor reduced
  motion.
- Run the client and server typechecks/builds and focused API/WebSocket/email
  tests. Add tests for ranking boundaries, idempotency, concurrent first join,
  validation/upload security, and email HTML attachments.
