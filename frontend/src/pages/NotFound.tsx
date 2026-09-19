import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Leaf, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F9FC] p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 mb-4 shadow-sm border border-teal-100">
        <Leaf className="h-6 w-6 transform -rotate-12" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 font-numeric">404</h1>
      <h2 className="mt-2 text-base font-bold text-slate-800">Page Not Found</h2>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">
        The financial module you requested ({location.pathname}) is not available or has been moved.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Return to FinSage Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFound;
