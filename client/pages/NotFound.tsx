import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center justify-center py-24 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Ghost className="h-7 w-7" />
      </span>
      <h1 className="mt-4 font-mono text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-muted-foreground">
        There's nothing monitored at <span className="font-mono">{location.pathname}</span>.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button>Back to Dashboard</Button>
      </Link>
    </main>
  );
};

export default NotFound;
