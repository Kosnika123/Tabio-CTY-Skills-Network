import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  Code2,
  Palette,
  Smartphone,
  Video,
  PenTool,
  Camera,
  BriefcaseBusiness,
  Star,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const categories = [
  {
    title: "Web Development",
    description: "Websites, platforms and web applications",
    icon: Code2,
  },
  {
    title: "Graphic Design",
    description: "Branding, posters and visual identities",
    icon: Palette,
  },
  {
    title: "UI/UX Design",
    description: "Beautiful digital products and experiences",
    icon: PenTool,
  },
  {
    title: "Mobile Development",
    description: "Modern Android and iOS applications",
    icon: Smartphone,
  },
  {
    title: "Video & Animation",
    description: "Editing, motion graphics and animations",
    icon: Video,
  },
  {
    title: "Photography",
    description: "Photography and visual storytelling",
    icon: Camera,
  },
];

const talents = [
  {
    name: "David Johnson",
    role: "Full Stack Developer",
    location: "Lagos, Nigeria",
    rating: "4.9",
    projects: 18,
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Amara Williams",
    role: "Graphic Designer",
    location: "Abuja, Nigeria",
    rating: "5.0",
    projects: 24,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Daniel Okafor",
    role: "UI/UX Designer",
    location: "Port Harcourt, Nigeria",
    rating: "4.8",
    projects: 13,
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80",
  },
];

const projects = [
  {
    title: "Modern E-commerce Platform",
    category: "Web Development",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Brand Identity Collection",
    category: "Graphic Design",
    image:
      "https://images.unsplash.com/photo-1634942537034-2531766767d1?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Fintech Mobile Experience",
    category: "UI/UX Design",
    image:
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1000&q=80",
  },
];

export default function Home() {
  return (
    <div>

      {/* HERO */}

      <section className="relative overflow-hidden bg-[#f5f8fc]">

        {/* Background decoration */}

        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-navy-300/20 blur-3xl" />

        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-green-300/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.05fr_.95fr] lg:px-8">

          {/* Text */}

          <div>

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-navy-200 bg-white px-4 py-2 text-xs font-bold text-navy-600 shadow-sm">
              <Sparkles size={14} />
              Where talent meets opportunity
            </div>

            <h1 className="max-w-3xl font-['Space_Grotesk'] text-5xl font-bold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">

              Your skills
              <span className="text-navy-600">
                {" "}deserve
              </span>

              <br />

              an opportunity.

            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              TCSN Network connects talented creators, developers
              and professionals with people and businesses
              looking for great work.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">

              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-navy-600"
              >
                Showcase Your Skills

                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/talent"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Find Talent
              </Link>

            </div>

            {/* Trust */}

            <div className="mt-9 flex items-center gap-4">

              <div className="flex">

                {talents.map((talent, index) => (
                  <img
                    key={talent.name}
                    src={talent.image}
                    alt=""
                    className={`h-9 w-9 rounded-full border-2 border-white object-cover ${
                      index !== 0 ? "-ml-2" : ""
                    }`}
                  />
                ))}

                <div className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-navy-100 text-xs font-bold text-navy-600">
                  +5k
                </div>

              </div>

              <div className="text-sm">
                <div className="flex items-center gap-1 font-bold">
                  <Star
                    size={14}
                    className="fill-yellow-400 text-yellow-400"
                  />
                  4.9/5
                </div>

                <span className="text-slate-500">
                  Trusted by growing businesses
                </span>
              </div>

            </div>

          </div>

          {/* Hero visual */}

          <div className="relative">

            <div className="relative ml-auto max-w-lg">

              <div className="overflow-hidden rounded-[28px] shadow-2xl shadow-slate-900/15">

                <img
                  src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85"
                  alt="Creative team collaborating"
                  className="h-[500px] w-full object-cover sm:h-[600px]"
                />

              </div>

              {/* Opportunity card */}

              <div className="absolute -left-6 bottom-12 hidden w-64 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl sm:block">

                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-100 text-navy-600">
                    <BriefcaseBusiness size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      New opportunity
                    </p>

                    <h3 className="mt-1 text-sm font-bold">
                      Brand Designer
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      ₦120,000 project
                    </p>
                  </div>

                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-green-600">
                  <CheckCircle2 size={14} />
                  12 people applied
                </div>

              </div>

              {/* Rating */}

              <div className="absolute -right-5 top-16 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50">
                    <Star
                      size={18}
                      className="fill-yellow-400 text-yellow-400"
                    />
                  </div>

                  <div>
                    <p className="font-bold">
                      4.9/5
                    </p>

                    <p className="text-xs text-slate-400">
                      Talent rating
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* SEARCH */}

      <section className="relative z-10 -mt-8 px-5">

        <div className="mx-auto max-w-4xl">

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10 sm:flex-row">

            <div className="flex flex-1 items-center gap-3 px-3">

              <Search
                size={20}
                className="shrink-0 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search talent, skills or services..."
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
              />

            </div>

            <button
              type="button"
              className="rounded-xl bg-navy-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-navy-700"
            >
              Search
            </button>

          </div>

        </div>

      </section>

      {/* CATEGORIES */}

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8">

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-navy-600">
              Explore skills
            </p>

            <h2 className="mt-3 max-w-xl font-['Space_Grotesk'] text-3xl font-bold tracking-tight sm:text-4xl">
              Find the talent you need.
            </h2>

            <p className="mt-4 max-w-lg leading-7 text-slate-500">
              From code to creativity, discover people with
              the skills to bring your next idea to life.
            </p>

          </div>

          <Link
            to="/talent"
            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-800"
          >
            Explore all skills
            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {categories.map((category) => {

            const Icon = category.icon;

            return (
              <Link
                key={category.title}
                to="/talent"
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-xl hover:shadow-navy-100/50"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-600 transition group-hover:bg-navy-600 group-hover:text-white">
                    <Icon size={23} />
                  </div>

                  <ArrowUpRight
                    size={19}
                    className="text-slate-300 transition group-hover:text-navy-600"
                  />

                </div>

                <h3 className="mt-6 font-['Space_Grotesk'] text-lg font-bold">
                  {category.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {category.description}
                </p>

              </Link>
            );

          })}

        </div>

      </section>

      {/* TALENT */}

      <section className="bg-slate-50 py-24">

        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-navy-600">
                Featured talent
              </p>

              <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-bold tracking-tight sm:text-4xl">
                People doing great work.
              </h2>

            </div>

            <Link
              to="/talent"
              className="group inline-flex items-center gap-2 text-sm font-bold"
            >
              Browse talent
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">

            {talents.map((talent) => (
              <article
                key={talent.name}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >

                <div className="relative h-72 overflow-hidden">

                  <img
                    src={talent.image}
                    alt={talent.name}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />

                  <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-green-600 shadow-lg">
                    Available
                  </span>

                </div>

                <div className="p-6">

                  <h3 className="font-['Space_Grotesk'] text-lg font-bold">
                    {talent.name}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-navy-600">
                    {talent.role}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {talent.location}
                  </p>

                  <div className="my-5 flex items-center gap-5 border-y border-slate-100 py-4 text-sm">

                    <span className="flex items-center gap-1.5 font-semibold">
                      <Star
                        size={15}
                        className="fill-yellow-400 text-yellow-400"
                      />
                      {talent.rating}
                    </span>

                    <span className="text-slate-500">
                      {talent.projects} projects
                    </span>

                  </div>

                  <Link
                    to="/talent"
                    className="block rounded-xl border border-slate-200 py-3 text-center text-sm font-bold transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                  >
                    View Profile
                  </Link>

                </div>

              </article>
            ))}

          </div>

        </div>

      </section>

      {/* PROJECTS */}

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8">

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-navy-600">
              Showcase
            </p>

            <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-bold tracking-tight sm:text-4xl">
              Work worth discovering.
            </h2>

          </div>

          <Link
            to="/projects"
            className="group inline-flex items-center gap-2 text-sm font-bold"
          >
            Explore projects
            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">

          {projects.map((project) => (
            <Link
              key={project.title}
              to="/projects"
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >

              <div className="h-72 overflow-hidden">

                <img
                  src={project.image}
                  alt={project.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

              </div>

              <div className="flex items-center justify-between p-5">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-navy-600">
                    {project.category}
                  </p>

                  <h3 className="mt-2 font-['Space_Grotesk'] font-bold">
                    {project.title}
                  </h3>

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition group-hover:bg-navy-600 group-hover:text-white">
                  <ArrowUpRight size={18} />
                </div>

              </div>

            </Link>
          ))}

        </div>

      </section>

      {/* HOW IT WORKS */}

      <section className="bg-slate-950 py-24 text-white">

        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-navy-400">
              How it works
            </p>

            <h2 className="mt-4 font-['Space_Grotesk'] text-4xl font-bold tracking-tight sm:text-5xl">
              Skills into
              <span className="text-navy-400"> opportunities.</span>
            </h2>

            <p className="mt-5 leading-7 text-slate-400">
              Whether you're here to showcase your skills or
              find someone to bring your project to life,
              getting started is simple.
            </p>

          </div>

          <div className="mt-16 grid md:grid-cols-4">

            {[
              {
                number: "01",
                title: "Create your profile",
                text: "Tell the world what you can do and showcase your best work.",
              },
              {
                number: "02",
                title: "Discover opportunities",
                text: "Find projects, jobs and people looking for your skills.",
              },
              {
                number: "03",
                title: "Do great work",
                text: "Connect with clients and turn ideas into something real.",
              },
              {
                number: "04",
                title: "Get rewarded",
                text: "Build your reputation and earn from your skills.",
              },
            ].map((step) => (
              <div
                key={step.number}
                className="border-l border-slate-800 px-6 py-5 first:border-l-0"
              >

                <span className="text-sm font-bold text-navy-400">
                  {step.number}
                </span>

                <h3 className="mt-8 font-['Space_Grotesk'] text-lg font-bold">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {step.text}
                </p>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* CTA */}

      <section className="px-5 py-20 sm:px-6 lg:px-8">

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 overflow-hidden rounded-[28px] bg-navy-600 px-7 py-14 text-white sm:px-12 lg:flex-row lg:items-center lg:px-16">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-navy-200">
              Your next opportunity
            </p>

            <h2 className="mt-4 max-w-2xl font-['Space_Grotesk'] text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Your talent deserves to be seen.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-navy-100">
              Create your profile, showcase your work and
              start connecting with opportunities.
            </p>

          </div>

          <Link
            to="/register"
            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
          >
            Get Started

            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

        </div>

      </section>

    </div>
  );
}