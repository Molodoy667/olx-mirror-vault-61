import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy } from "react";
import { ScrollToTopRouter } from "@/components/ScrollToTopRouter";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { UserBottomPanel } from "@/components/UserBottomPanel";
import { AdminRoute } from "@/components/AdminRoute";

// Lazy load all pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const Search = lazy(() => import("./pages/Search"));
const CreateListing = lazy(() => import("./pages/CreateListing"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const EditListing = lazy(() => import("./pages/EditListing"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminListings = lazy(() => import("./pages/admin/Listings"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminTariffs = lazy(() => import("./pages/admin/Tariffs"));
const AdminBusinessVerifications = lazy(() => import("./pages/admin/BusinessVerifications"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminModeration = lazy(() => import("./pages/admin/Moderation"));
const SQLManager = lazy(() => import("./pages/admin/SQLManager"));
const BackupManager = lazy(() => import("./pages/admin/BackupManager"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const About = lazy(() => import("./pages/About"));
const Help = lazy(() => import("./pages/Help"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Messages = lazy(() => import("./pages/Messages"));
const MyListings = lazy(() => import("./pages/MyListings"));
const SavedSearches = lazy(() => import("./pages/SavedSearches"));
const Chat = lazy(() => import("./pages/Chat"));
const NovadoPro = lazy(() => import("./pages/NovadoPro"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Loading fallback component
const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <div className="absolute inset-0 w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-primary/20 to-transparent animate-pulse" />
      </div>
      <p className="text-muted-foreground bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent font-medium">
        Завантаження...
      </p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTopRouter />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/search" element={<Search />} />
              <Route path="/create" element={<CreateListing />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/edit/:id" element={<EditListing />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/help" element={<Help />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/messages/:userId?" element={<Messages />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/saved-searches" element={<SavedSearches />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/novado-pro" element={<NovadoPro />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/listings" element={<AdminRoute><AdminListings /></AdminRoute>} />
              <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
              <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/tariffs" element={<AdminRoute><AdminTariffs /></AdminRoute>} />
              <Route path="/admin/business-verifications" element={<AdminRoute><AdminBusinessVerifications /></AdminRoute>} />
              <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/moderation" element={<AdminRoute><AdminModeration /></AdminRoute>} />
              <Route path="/admin/sql-manager" element={<AdminRoute><SQLManager /></AdminRoute>} />
              <Route path="/admin/backup-manager" element={<AdminRoute><BackupManager /></AdminRoute>} />
              
              {/* SEO-friendly listing routes - must be after all specific routes */}
              <Route path="/:slug" element={<ListingDetail />} />
              
              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <UserBottomPanel />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
