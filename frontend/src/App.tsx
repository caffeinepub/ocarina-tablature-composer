import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useState, useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useRegisterUser, useGetAllUsers } from './hooks/useQueries';
import { useActor } from './hooks/useActor';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Music,
  BookOpen,
  Settings,
  Palette,
  Home,
  Library,
  LogIn,
  LogOut,
  Loader2,
  Heart,
} from 'lucide-react';
import HomePage from './pages/HomePage';
import PresetSongsPage from './pages/PresetSongsPage';
import SongEditor from './components/SongEditor';
import SoundSettingsPanel from './components/SoundSettingsPanel';
import OcarinaDesignEditor from './components/OcarinaDesignEditor';
import type { SoundPreset } from './backend';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// ── Pages ────────────────────────────────────────────────────────────────────

function LibraryPage() {
  const { data: songs, isLoading } = useGetAllUsers();
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Song Library</h1>
      <p className="text-muted-foreground">Your saved songs and compositions.</p>
    </div>
  );
}

function SettingsPage() {
  const [loadedPreset, setLoadedPreset] = useState<SoundPreset | null>(null);

  const handlePresetLoaded = (preset: SoundPreset) => {
    setLoadedPreset(preset);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sound Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Adjust tone, reverb, and pitch for your ocarina sound.
        </p>
      </div>
      <SoundSettingsPanel
        onPresetLoaded={handlePresetLoaded}
        currentOcarinaImage={loadedPreset?.ocarinaImage ?? null}
      />
    </div>
  );
}

function DesignEditorPage() {
  return (
    <div className="p-4">
      <OcarinaDesignEditor />
    </div>
  );
}

// ── Auth Gate ────────────────────────────────────────────────────────────────

function AuthGate({ children }: { children: React.ReactNode }) {
  const { identity, login, isLoggingIn, isLoginError, loginStatus } = useInternetIdentity();
  const { actor, isFetching: actorLoading } = useActor();
  const registerUser = useRegisterUser();
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);

  useEffect(() => {
    if (!identity || !actor || actorLoading) return;

    const checkRegistration = async () => {
      setCheckingRegistration(true);
      try {
        const principal = identity.getPrincipal();
        await actor.getUsername(principal);
        setIsRegistered(true);
      } catch {
        setIsRegistered(false);
      } finally {
        setCheckingRegistration(false);
      }
    };

    checkRegistration();
  }, [identity, actor, actorLoading]);

  const handleRegister = async () => {
    if (!username.trim()) return;
    setIsRegistering(true);
    try {
      await registerUser.mutateAsync(username.trim());
      setIsRegistered(true);
    } catch {
      // already registered or error
      setIsRegistered(true);
    } finally {
      setIsRegistering(false);
    }
  };

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10 w-fit">
              <Music className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Ocarina Studio</CardTitle>
            <CardDescription>Sign in to start composing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full gap-2"
              onClick={login}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </Button>
            {isLoginError && (
              <p className="text-xs text-destructive text-center">Login failed. Please try again.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkingRegistration || actorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle>Create Your Profile</CardTitle>
            <CardDescription>Choose a username to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleRegister}
              disabled={isRegistering || !username.trim()}
            >
              {isRegistering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isRegistering ? 'Creating...' : 'Create Profile'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// ── Layout ───────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Song Editor', icon: Music, path: '/song-editor' },
  { label: 'Preset Songs', icon: BookOpen, path: '/preset-songs' },
  { label: 'Design Editor', icon: Palette, path: '/design-editor' },
  { label: 'Library', icon: Library, path: '/library' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identity, clear } = useInternetIdentity();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-sm">Ocarina Studio</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={location.pathname === item.path}
                  onClick={() => navigate({ to: item.path })}
                  className="gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4 space-y-3">
          {identity && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground truncate">
                {identity.getPrincipal().toString().slice(0, 20)}...
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 justify-start"
                onClick={clear}
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </Button>
            </div>
          )}
          <Separator />
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
            Built with <Heart className="inline w-3 h-3 text-red-500 fill-red-500" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'ocarina-studio')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
            <br />© {new Date().getFullYear()}
          </p>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center gap-2 p-3 border-b border-border/50">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">
            {NAV_ITEMS.find((n) => n.path === location.pathname)?.label ?? 'Ocarina Studio'}
          </span>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ── Router ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: AppLayout });

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage });
const songEditorRoute = createRoute({ getParentRoute: () => rootRoute, path: '/song-editor', component: SongEditor });
const presetSongsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/preset-songs', component: PresetSongsPage });
const designEditorRoute = createRoute({ getParentRoute: () => rootRoute, path: '/design-editor', component: DesignEditorPage });
const libraryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/library', component: LibraryPage });
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: SettingsPage });

const routeTree = rootRoute.addChildren([
  indexRoute,
  songEditorRoute,
  presetSongsRoute,
  designEditorRoute,
  libraryRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthGate>
          <RouterProvider router={router} />
        </AuthGate>
        <Toaster richColors />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
