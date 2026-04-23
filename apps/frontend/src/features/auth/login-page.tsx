import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLoginMutation } from "@/generated/graphql";
import { authStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useLoginMutation({
    onSuccess: (data) => {
      const { token, user } = data.login;
      authStore.getState().setAuth(token, user);
      navigate("/");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Login failed");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    mutate({ input: { email, password } });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Looper</h1>
          <p className="text-sm text-muted-foreground text-center">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            No account?{" "}
            <Link to="/register" className="underline underline-offset-2 hover:text-foreground">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
