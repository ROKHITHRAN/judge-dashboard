import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Login } from "./components/Login";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Cases } from "./components/Cases";
import { Evidence } from "./components/Evidence";
import { Logs } from "./components/Logs";
import { Files } from "./components/Files";
import { MyCases } from "./components/MyCases";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView("dashboard");
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "my_cases":
        return <MyCases />;
      case "cases":
        return <Cases />;
      case "evidence":
        return <Evidence />;
      case "logs":
        return <Logs />;
      case "files":
        return <Files />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <div className="lg:pl-80">
        <main className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">{renderView()}</main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
