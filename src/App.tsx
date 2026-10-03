import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ReactNode, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SiteProvider } from '@/context/SiteContext';

// Eager: shared layout components
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

// Lazy: public pages
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const TrackPage = lazy(() => import('@/pages/public/TrackPage'));
const DynamicPage = lazy(() => import('@/pages/public/DynamicPage'));

// Lazy: admin pages
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'));
const DashboardOverview = lazy(() => import('@/pages/admin/DashboardOverview'));
const InvoiceList = lazy(() => import('@/pages/admin/InvoiceList'));
const InvoiceCreate = lazy(() => import('@/pages/admin/InvoiceCreate'));
const InvoiceDetail = lazy(() => import('@/pages/admin/InvoiceDetail'));
const InvoiceEdit = lazy(() => import('@/pages/admin/InvoiceEdit'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminPages = lazy(() => import('@/pages/admin/AdminPages'));
const AdminNavbar = lazy(() => import('@/pages/admin/AdminNavbar'));
const AdminFooter = lazy(() => import('@/pages/admin/AdminFooter'));
const AdminMessages = lazy(() => import('@/pages/admin/AdminMessages'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function LoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
    </div>
  );
}

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicLayout><Suspense fallback={<LoadingFallback />}><HomePage /></Suspense></PublicLayout>} />
        <Route path="/track" element={<PublicLayout><Suspense fallback={<LoadingFallback />}><TrackPage /></Suspense></PublicLayout>} />
        <Route path="/page/:slug" element={<PublicLayout><Suspense fallback={<LoadingFallback />}><DynamicPage /></Suspense></PublicLayout>} />

        {/* Admin login */}
        <Route path="/admin/login" element={<Suspense fallback={<LoadingFallback />}><AdminLogin /></Suspense>} />

        {/* Admin dashboard */}
        <Route path="/admin" element={<ProtectedRoute><Suspense fallback={<LoadingFallback />}><AdminLayout /></Suspense></ProtectedRoute>}>
          <Route index element={<Suspense fallback={<LoadingFallback />}><DashboardOverview /></Suspense>} />
          <Route path="invoices" element={<Suspense fallback={<LoadingFallback />}><InvoiceList /></Suspense>} />
          <Route path="invoices/new" element={<Suspense fallback={<LoadingFallback />}><InvoiceCreate /></Suspense>} />
          <Route path="invoices/:id" element={<Suspense fallback={<LoadingFallback />}><InvoiceDetail /></Suspense>} />
          <Route path="invoices/:id/edit" element={<Suspense fallback={<LoadingFallback />}><InvoiceEdit /></Suspense>} />
          <Route path="pages" element={<Suspense fallback={<LoadingFallback />}><AdminPages /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<LoadingFallback />}><AdminSettings /></Suspense>} />
          <Route path="navbar" element={<Suspense fallback={<LoadingFallback />}><AdminNavbar /></Suspense>} />
          <Route path="footer" element={<Suspense fallback={<LoadingFallback />}><AdminFooter /></Suspense>} />
          <Route path="messages" element={<Suspense fallback={<LoadingFallback />}><AdminMessages /></Suspense>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SiteProvider>
    </AuthProvider>
  );
}
