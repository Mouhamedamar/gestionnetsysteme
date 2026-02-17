import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import Installation from './pages/Installation';
import Dashboard from './pages/Dashboard';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardTechnicien from './pages/DashboardTechnicien';
import DashboardCommercial from './pages/DashboardCommercial';
import Products from './pages/Products';
import Clients from './pages/Clients';
import StockMovements from './pages/StockMovements';
import StockNotifications from './pages/StockNotifications';
import Stock from './pages/Stock';
import Invoices from './pages/Invoices';
import Quotes from './pages/Quotes';
import Expenses from './pages/Expenses';
import Interventions from './pages/Interventions';
import Installations from './pages/Installations';
import InstallationPaymentReminders from './pages/InstallationPaymentReminders';
import CreateInstallation from './pages/CreateInstallation';
import ProFormaInvoices from './pages/ProFormaInvoices';
import InvoiceItems from './pages/InvoiceItems';
import CreateInvoice from './pages/CreateInvoice';
import CreateQuote from './pages/CreateQuote';
import CreateExpense from './pages/CreateExpense';
import Profile from './pages/Profile';
import Users from './pages/Users';
import ZoneDeTravail from './pages/ZoneDeTravail';
import Pointage from './pages/Pointage';
import Layout from './components/Layout';
import Notification from './components/Notification';
import InstallationCheck from './components/InstallationCheck';

const PrivateRoute = ({ children }) => {
  const { loggedIn } = useApp();
  return loggedIn ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { notification, setNotification, user } = useApp();

  // Composant pour router vers le bon dashboard selon le rôle
  const DashboardRouter = () => {
    const role = user?.role || 'admin';
    switch (role) {
      case 'admin':
        return <DashboardAdmin />;
      case 'technicien':
        return <DashboardTechnicien />;
      case 'commercial':
        return <DashboardCommercial />;
      default:
        return <DashboardAdmin />;
    }
  };

  return (
    <>
      <Routes>
        <Route path="/installation" element={<Installation />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardRouter />} />
          <Route path="products" element={<Products />} />
          <Route path="clients" element={<Clients />} />
          <Route path="stock" element={<Stock />} />
          <Route path="stock-movements" element={<StockMovements />} />
          <Route path="stock-notifications" element={<StockNotifications />} />
          <Route path="interventions" element={<Interventions />} />
          <Route path="installations" element={<Installations />} />
          <Route path="installations/rappels-paiement" element={<InstallationPaymentReminders />} />
          <Route path="installations/add" element={<CreateInstallation />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<CreateInvoice />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="quotes/new" element={<CreateQuote />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="expenses/new" element={<CreateExpense />} />
          <Route path="expenses/:id/edit" element={<CreateExpense />} />
          <Route path="invoices/:id/items" element={<InvoiceItems />} />
          <Route path="proforma-invoices" element={<ProFormaInvoices />} />
          <Route path="proforma-invoices/new" element={<CreateInvoice />} />
          <Route path="users" element={<Users />} />
          <Route path="zone-de-travail" element={<ZoneDeTravail />} />
          <Route path="pointage" element={<Pointage />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
};

function App() {
  return (
    <Router>
      <AppProvider>
        <InstallationCheck>
          <AppRoutes />
        </InstallationCheck>
      </AppProvider>
    </Router>
  );
}

export default App;

