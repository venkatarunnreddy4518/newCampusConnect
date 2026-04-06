import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {!isHome && (
        <div className="container mx-auto px-4 pt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
      <main className="flex-1">
        {children}
      </main>
      {!isHome && <Footer />}
    </div>
  );
};

export default Layout;
