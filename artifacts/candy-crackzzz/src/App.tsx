import { Redirect, Route, Router as WouterRouter, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

import HomePage from "@/pages/HomePage";
import MenuPage from "@/pages/MenuPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import OrderSuccessPage from "@/pages/OrderSuccessRewards";
import GalleryPage from "@/pages/GalleryPage";
import SeasonalPage from "@/pages/SeasonalPage";
import CustomOrdersPage from "@/pages/CustomOrdersPage";
import ContactPage from "@/pages/ContactPage";
import RewardsPage from "@/pages/RewardsPagePlus";
import NotFound from "@/pages/not-found";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminProductForm from "@/pages/admin/AdminProductForm";
import AdminOrders from "@/pages/admin/AdminOrdersReferralBadges";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminBranding from "@/pages/admin/AdminBranding";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminAccount from "@/pages/admin/AdminAccount";
import AdminMessages from "@/pages/admin/AdminMessages";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/menu" component={MenuPage} />
      <Route path="/menu/:slug" component={ProductDetailPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/order-success" component={OrderSuccessPage} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/seasonal" component={SeasonalPage} />
      <Route path="/custom-orders" component={CustomOrdersPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/rewards" component={RewardsPage} />

      <Route path="/admin/setup">{() => <Redirect to="/admin/login" />}</Route>
      <Route path="/admin/login" component={AdminLogin} />

      <Route path="/admin">
        {() => <ProtectedRoute><AdminDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/admin/products">
        {() => <ProtectedRoute allowedRoles={['owner']}><AdminProducts /></ProtectedRoute>}
      </Route>
      <Route path="/admin/products/new">
        {() => <ProtectedRoute allowedRoles={['owner']}><AdminProductForm /></ProtectedRoute>}
      </Route>
      <Route path="/admin/products/:id/edit">
        {() => <ProtectedRoute allowedRoles={['owner']}><AdminProductForm /></ProtectedRoute>}
      </Route>
      <Route path="/admin/orders">
        {() => <ProtectedRoute><AdminOrders /></ProtectedRoute>}
      </Route>
      <Route path="/admin/settings">
        {() => <ProtectedRoute allowedRoles={['owner']}><AdminSettings /></ProtectedRoute>}
      </Route>
      <Route path="/admin/branding">
        {() => <ProtectedRoute allowedRoles={['owner']}><AdminBranding /></ProtectedRoute>}
      </Route>
      <Route path="/admin/payments">
        {() => <ProtectedRoute allowedRoles={['owner']}><AdminPayments /></ProtectedRoute>}
      </Route>
      <Route path="/admin/reviews">
        {() => <ProtectedRoute allowedRoles={['owner']}><AdminReviews /></ProtectedRoute>}
      </Route>
      <Route path="/admin/account">
        {() => <ProtectedRoute><AdminAccount /></ProtectedRoute>}
      </Route>
      <Route path="/admin/messages">
        {() => <ProtectedRoute><AdminMessages /></ProtectedRoute>}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
