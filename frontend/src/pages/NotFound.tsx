import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button"; // If you're using shadcn/ui or similar

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">
      <div className="text-center max-w-md bg-white p-10 rounded-2xl shadow-xl border">
        <h1 className="text-6xl font-bold text-red-500 mb-6">404</h1>
        <p className="text-2xl font-semibold text-gray-800 mb-3">
          Oops! Page not found
        </p>
        {/* <p className="text-gray-500 mb-6">
          The page <code className="text-sm bg-gray-100 px-2 py-1 rounded">{location.pathname}</code> does not exist.
        </p> */}
        <Button onClick={() => navigate("/")} className="w-full">
          Go back to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
