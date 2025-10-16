import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <main className="container mx-auto py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="mt-4 inline-block text-primary underline underline-offset-4">
          Return to Home
        </a>
      </div>
    </main>
  );
};

export default NotFound;
