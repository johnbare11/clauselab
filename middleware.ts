import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/challenges(.*)",
  "/leaderboard(.*)",
  "/pricing(.*)",
  "/api/challenges(.*)",
  "/api/progress(.*)",
  "/api/submissions/preview(.*)",
  // Exact path only (not /api/submissions/:id): lets anonymous assessors run the
  // executable demo challenge. The handler rejects anonymous requests to
  // non-executable challenges and never persists guest runs.
  "/api/submissions",
  "/api/xrpl(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
