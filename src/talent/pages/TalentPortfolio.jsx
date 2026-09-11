import { useEffect, useState, useRef, useCallback } from "react";
import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  MapPin,
  RefreshCw,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatCategory = (value = "") =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function TalentPortfolio() {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const userIdRef = useRef(null);

  const loadPortfolio = useCallback(async (targetUserId) => {
    try {
      setLoading(true);
      setError("");

      let currentUserId = targetUserId || userIdRef.current;

      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("You must be logged in to view your portfolio.");
          setLoading(false);
          return;
        }
        currentUserId = user.id;
        userIdRef.current = user.id;
      }

      const [profileResponse, projectsResponse] = await Promise.all([
        supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            username,
            avatar_url,
            bio,
            location,
            phone,
            linkedin_url,
            portfolio_url,
            created_at
          `)
          .eq("id", currentUserId)
          .maybeSingle(),

        supabase
          .from("projects")
          .select(`
            id,
            title,
            description,
            category,
            skills,
            project_url,
            images,
            completed_at,
            created_at,
            opportunity:opportunity_id (
              id,
              title,
              category
            )
          `)
          .eq("talent_id", currentUserId)
          .eq("verification_status", "verified")
          .eq("status", "completed")
          .order("completed_at", { ascending: false }),
      ]);

      if (profileResponse.error) throw profileResponse.error;
      if (projectsResponse.error) throw projectsResponse.error;

      setProfile(profileResponse.data);
      setProjects(projectsResponse.data || []);
    } catch (err) {
      console.error("Error loading portfolio:", err);
      setError(err.message || "Could not load your portfolio.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let channel;

    const setupPortfolio = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to view your portfolio.");
        setLoading(false);
        return;
      }

      userIdRef.current = user.id;
      await loadPortfolio(user.id);

      channel = supabase
        .channel("talent-portfolio-live")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
            filter: `talent_id=eq.${user.id}`,
          },
          () => {
            loadPortfolio(user.id);
          }
        )
        .subscribe();
    };

    setupPortfolio();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadPortfolio]);

  const categories = [
    ...new Set(
      projects
        .map((project) => project.category)
        .filter(Boolean)
    ),
  ];

  if (loading && !profile && projects.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading your portfolio...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Award className="h-4 w-4" />
              Portfolio
            </div>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              My Portfolio
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Your verified TCSN Network projects and professional achievements.
            </p>
          </div>

          <button
            onClick={() => loadPortfolio()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Hero */}
        {profile && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-28 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 sm:h-36" />

            <div className="px-5 pb-6 sm:px-8">
              <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || "Talent"}
                      className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-md sm:h-28 sm:w-28"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 shadow-md sm:h-28 sm:w-28">
                      <User className="h-10 w-10 text-slate-400" />
                    </div>
                  )}

                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-bold text-slate-900">
                        {profile.full_name || "TCSN Network Talent"}
                      </h2>

                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified Work
                      </span>
                    </div>

                    {profile.username && (
                      <p className="mt-1 text-sm text-slate-500">
                        @{profile.username}
                      </p>
                    )}

                    {profile.location && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
              <BriefcaseBusiness className="h-5 w-5 text-slate-700" />
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              {projects.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Verified Projects
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
              <Award className="h-5 w-5 text-slate-700" />
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              {categories.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Skill Categories
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              100%
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Verified Work
            </p>
          </div>
        </div>

        {/* About */}
        {profile?.bio && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              About Me
            </h2>

            <p className="mt-3 max-w-4xl whitespace-pre-line text-sm leading-7 text-slate-600">
              {profile.bio}
            </p>
          </section>
        )}

        {/* Projects */}
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Verified Projects
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Projects completed through TCSN Network and verified by
                the admin team.
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Award className="h-8 w-8 text-slate-400" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                No verified projects yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Complete a TCSN Network project and have it verified by
                the admin team. It will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const image = project.images?.[0];

                return (
                  <article
                    key={project.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative h-48 bg-slate-100">
                      {image ? (
                        <img
                          src={image}
                          alt={project.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BriefcaseBusiness className="h-12 w-12 text-slate-300" />
                        </div>
                      )}

                      <div className="absolute right-3 top-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-green-700 shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {formatCategory(
                          project.category ||
                            project.opportunity?.category ||
                            "Project"
                        )}
                      </p>

                      <h3 className="mt-2 text-lg font-bold text-slate-900">
                        {project.title}
                      </h3>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {project.description ||
                          "Completed project through TCSN Network."}
                      </p>

                      {project.skills?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {project.skills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays className="h-4 w-4" />
                        Completed {formatDate(project.completed_at)}
                      </div>

                      {project.project_url && (
                        <div className="mt-5 border-t border-slate-100 pt-5">
                          <a
                            href={project.project_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Project
                          </a>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}