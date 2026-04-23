import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { authStore } from "@/lib/auth-store";
import { AuthGuard } from "@/features/auth/auth-guard";
import { LoginPage } from "@/features/auth/login-page";
import { RegisterPage } from "@/features/auth/register-page";
import { FeedPage } from "@/features/feed/feed-page";
import { CreatePostPage } from "@/features/post/create-post-page";
import { UserProfilePage } from "@/features/user/user-profile-page";
import { Button } from "@/components/ui/button";

function TopNav() {
  const navigate = useNavigate();
  const user = authStore((state) => state.user);

  function handleLogout() {
    authStore.getState().clear();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          Looper
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/create">Create Post</Link>
          </Button>

          {user && (
            <Button asChild size="sm" variant="ghost">
              <Link to={`/user/${user.id}`}>Profile</Link>
            </Button>
          )}

          <Button size="sm" variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </nav>
    </header>
  );
}

function AuthedLayout() {
  return (
    <>
      <TopNav />
      <main>
        <AuthGuard />
      </main>
    </>
  );
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<AuthedLayout />}>
          <Route index element={<FeedPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/user/:id" element={<UserProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
