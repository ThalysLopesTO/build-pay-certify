import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, Users } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";

// --- Brand assets (update if needed) ---
const LOGO_URL = "/lovable-uploads/stackbuild-logo.png"; // <- replace with your uploaded logo if different
const HERO_IMG_URL = "/lovable-uploads/81c0730a-56f4-4b76-b03c-d703c6fcbd76.png"; // construction photo

// Small, accessible, fully-clickable role tile
function RoleTile({
  icon: Icon,
  title,
  subtitle,
  href,
  color = "orange",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  href: string;
  color?: "orange" | "blue";
}) {
  const navigate = useNavigate();

  const palette =
    color === "orange"
      ? {
          badge: "bg-orange-100 text-orange-700 ring-orange-200",
          btn: "bg-orange-600 hover:bg-orange-700 focus-visible:ring-orange-400",
          ring: "ring-1 ring-slate-200",
        }
      : {
          badge: "bg-blue-100 text-blue-700 ring-blue-200",
          btn: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-400",
          ring: "ring-1 ring-slate-200",
        };

  return (
    <button
      onClick={() => navigate(href)}
      className={`group text-left w-full rounded-2xl bg-white/90 backdrop-blur-md ${palette.ring} shadow-xl shadow-slate-900/5 transition-all hover:shadow-2xl hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-slate-200`}
      aria-label={`${title} – ${subtitle}`}
    >
      <div className="p-6 sm:p-7 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div
            className={`shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${palette.badge}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900">
              {title}
            </h3>
            <p className="text-slate-600 text-sm sm:text-base">{subtitle}</p>
          </div>
        </div>

        <div>
          <span
            className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-white font-medium ${palette.btn} transition-colors focus:outline-none`}
          >
            {color === "orange" ? "Access Company Dashboard" : "Access Employee Dashboard"}
          </span>
        </div>
      </div>
    </button>
  );
}

const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) navigate("/admin/dashboard");
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-slate-50 via-white to-orange-50">
        <div className="flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <img
                src={LOGO_URL}
                alt="StackBuild"
                className="h-10 w-auto drop-shadow-sm"
              />
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 mb-2">
              Welcome back
            </h1>
            <p className="text-slate-600">
              You’re already logged in. Redirecting to your dashboard…
            </p>
          </div>
        </div>
        <div className="relative hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${HERO_IMG_URL}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-l from-slate-900/20 to-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[radial-gradient(1200px_600px_at_-10%_-10%,rgba(255,115,0,0.06),transparent),radial-gradient(1000px_500px_at_120%_110%,rgba(16,24,40,0.07),transparent)]">
      {/* Left pane */}
      <div className="flex items-center justify-center px-6 sm:px-10 py-10">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <img
              src={LOGO_URL}
              alt="StackBuild"
              className="h-9 sm:h-10 w-auto mb-6"
            />
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Choose your dashboard
            </h1>
            <p className="text-slate-600 mt-2">
              Select the appropriate login for your role.
            </p>
          </div>

          {/* Tiles */}
          <div className="space-y-5">
            <RoleTile
              icon={Building2}
              title="Company Login"
              subtitle="For administrators, managers, and foremen"
              href="/admin-login"
              color="orange"
            />
            <RoleTile
              icon={Users}
              title="Employee Login"
              subtitle="For field workers and staff"
              href="/employee-login"
              color="blue"
            />
          </div>

          {/* Footer */}
          <div className="mt-8 sm:mt-10">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-sm">Don’t have an account?</span>
              <Link
                to="/subscription-plan"
                className="text-sm font-medium text-orange-700 hover:text-orange-800 underline underline-offset-4"
              >
                Start your free trial
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
              <Link to="/privacy" className="hover:text-slate-700">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-slate-700">
                Terms
              </Link>
              <Link to="/help" className="hover:text-slate-700">
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right pane (image) */}
      <div className="relative hidden lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_IMG_URL}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-slate-900/30 via-slate-900/10 to-transparent" />
      </div>

      {/* Mobile hero image (on top) */}
      <div className="lg:hidden h-44 w-full relative order-first">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_IMG_URL}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/25 to-transparent" />
      </div>
    </div>
  );
};

export default LoginPage;
