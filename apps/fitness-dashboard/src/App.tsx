import { useEffect, useRef } from "react";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { ClerkProvider, Show, useClerk, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@fitness/api-client-react";

if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";

import { LandingPage } from "@/pages/landing";
import { SignInPage, SignUpPage } from "@/pages/auth";
import { OnboardingPage } from "@/pages/onboarding";
import { DashboardPage } from "@/pages/dashboard";
import { WorkoutsPage } from "@/pages/workouts";
import { NutritionPage } from "@/pages/nutrition";
import { ProgressPage } from "@/pages/progress";
import { SettingsPage } from "@/pages/settings";
import NotFound from "@/pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(142 50% 42%)",
    colorForeground: "hsl(210 40% 98%)",
    colorMutedForeground: "hsl(217.9 10.6% 64.9%)",
    colorDanger: "hsl(0 62.8% 30.6%)",
    colorBackground: "hsl(222.2 84% 4.9%)",
    colorInput: "hsl(215 27.9% 16.9%)",
    colorInputForeground: "hsl(210 40% 98%)",
    colorNeutral: "hsl(215 27.9% 16.9%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0B0D13] rounded-2xl w-[440px] max-w-full overflow-hidden border border-border/40 shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold tracking-tight text-2xl",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-muted-foreground font-medium uppercase tracking-wider text-xs",
    footerActionLink: "text-primary hover:text-primary/80 font-medium transition-colors",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground text-xs uppercase",
    identityPreviewEditButton: "text-primary hover:text-primary/80",
    formFieldSuccessText: "text-green-500",
    alertText: "text-destructive-foreground",
    logoBox: "flex justify-center mb-4",
    logoImage: "h-10",
    socialButtonsBlockButton: "border-border/40 hover:bg-white/5 transition-colors",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10",
    formFieldInput: "bg-background/50 border-border/40 text-foreground h-10 focus:ring-1 focus:ring-primary",
    footerAction: "mt-4 pt-4 border-t border-border/40 text-center",
    dividerLine: "bg-border/40",
    alert: "bg-destructive/20 border border-destructive/50 rounded-lg p-3",
    otpCodeFieldInput: "bg-background/50 border-border/40 text-foreground focus:ring-1 focus:ring-primary",
    formFieldRow: "mb-4",
    main: "p-8",
  },
};

function HomeRedirect() {
  const [, setLocation] = useLocation();
  
  // Wouter doesn't have a <Redirect> component out of the box in this setup easily
  const Redirect = ({ to }: { to: string }) => {
    useEffect(() => { setLocation(to); }, [setLocation, to]);
    return null;
  };

  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  
  const Redirect = ({ to }: { to: string }) => {
    useEffect(() => { setLocation(to); }, [setLocation, to]);
    return null;
  };

  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

// Wire Clerk session token into every API request
function ClerkAuthTokenSetter() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClientHook = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClientHook.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClientHook]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}

      localization={{
        signIn: {
          start: {
            title: "Access Cockpit",
            subtitle: "Enter your credentials to continue",
          },
        },
        signUp: {
          start: {
            title: "Initialize Protocol",
            subtitle: "Create your FitTrack identity",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkAuthTokenSetter />
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            {/* Protected Routes */}
            <Route path="/onboarding">
              <ProtectedRoute component={OnboardingPage} />
            </Route>
            <Route path="/dashboard">
              <ProtectedRoute component={DashboardPage} />
            </Route>
            <Route path="/workouts">
              <ProtectedRoute component={WorkoutsPage} />
            </Route>
            <Route path="/nutrition">
              <ProtectedRoute component={NutritionPage} />
            </Route>
            <Route path="/progress">
              <ProtectedRoute component={ProgressPage} />
            </Route>
            <Route path="/settings">
              <ProtectedRoute component={SettingsPage} />
            </Route>

            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
      <Toaster />
    </WouterRouter>
  );
}

export default App;
