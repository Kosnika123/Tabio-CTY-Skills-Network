import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  Search,
  BriefcaseBusiness,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  CalendarDays,
  Wallet,
  User,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
  MapPin,
  Tag,
  FileText,
  Loader2,
  Save,
  ExternalLink,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

const OPPORTUNITY_BUCKET = "opportunity-images";

const CATEGORY_OPTIONS = [
  ["development", "Development"],
  ["design", "Graphic Design"],
  ["uiux", "UI / UX"],
  ["video", "Video Editing"],
  ["photography", "Photography"],
  ["writing", "Writing"],
  ["marketing", "Marketing"],
];

const STATUS_OPTIONS = [
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["open", "Open"],
  ["in_progress", "In Progress"],
  ["completed", "Completed"],
  ["rejected", "Rejected"],
  ["cancelled", "Cancelled"],
];

const PROJECT_TYPES = [
  "Fixed Price",
  "Part Time",
  "Full Time",
  "Contract",
  "One Time",
];

const EMPTY_FORM = {
  title: "",
  short_description: "",
  description: "",
  category: "development",
  budget: "",
  deadline: "",
  location: "Remote",
  project_type: "Fixed Price",
  skills: "",
  status: "open",
};

export default function AdminOpportunities() {
  const [opportunities, setOpportunities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [openMenu, setOpenMenu] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [existingImages, setExistingImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [viewOpportunity, setViewOpportunity] = useState(null);

  const fileInputRef = useRef(null);

  const fetchOpportunities = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data, error: fetchError } = await supabase
        .from("opportunities")
        .select(
          `
            id,
            title,
            short_description,
            description,
            category,
            budget,
            deadline,
            location,
            project_type,
            skills,
            images,
            status,
            client_id,
            created_at,
            updated_at,
            client:client_id (
              id,
              full_name,
              username,
              avatar_url
            )
          `
        )
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        throw fetchError;
      }

      setOpportunities(data || []);
    } catch (err) {
      console.error("Failed to load opportunities:", err);

      setError(
        err.message || "Unable to load opportunities."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const filteredOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return opportunities.filter((opportunity) => {
      const matchesSearch =
        !query ||
        opportunity.title?.toLowerCase().includes(query) ||
        opportunity.short_description
          ?.toLowerCase()
          .includes(query) ||
        opportunity.description
          ?.toLowerCase()
          .includes(query) ||
        opportunity.category?.toLowerCase().includes(query) ||
        opportunity.client?.full_name
          ?.toLowerCase()
          .includes(query) ||
        opportunity.client?.username
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        opportunity.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        opportunity.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    opportunities,
    search,
    statusFilter,
    categoryFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: opportunities.length,

      pending: opportunities.filter(
        (item) => item.status === "pending"
      ).length,

      approved: opportunities.filter(
        (item) =>
          item.status === "approved" ||
          item.status === "open"
      ).length,

      active: opportunities.filter(
        (item) =>
          item.status === "in_progress" ||
          item.status === "completed"
      ).length,
    };
  }, [opportunities]);

  const formatCurrency = (amount) => {
    if (
      amount === null ||
      amount === undefined ||
      amount === ""
    ) {
      return "Not specified";
    }

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (date) => {
    if (!date) return "No deadline";

    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name, username) => {
    const value = name || username || "CL";

    const parts = value
      .trim()
      .split(" ")
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return value.substring(0, 2).toUpperCase();
  };

  const openCreateModal = () => {
    setActionError("");
    setEditingOpportunity(null);
    setForm(EMPTY_FORM);
    setExistingImages([]);
    setSelectedImages([]);
    setShowForm(true);
    setOpenMenu(null);
  };

  const openEditModal = (opportunity) => {
    setActionError("");
    setEditingOpportunity(opportunity);

    setForm({
      title: opportunity.title || "",
      short_description:
        opportunity.short_description || "",
      description: opportunity.description || "",
      category: opportunity.category || "development",
      budget:
        opportunity.budget !== null &&
        opportunity.budget !== undefined
          ? String(opportunity.budget)
          : "",
      deadline: opportunity.deadline
        ? opportunity.deadline.substring(0, 10)
        : "",
      location: opportunity.location || "Remote",
      project_type:
        opportunity.project_type || "Fixed Price",
      skills: Array.isArray(opportunity.skills)
        ? opportunity.skills.join(", ")
        : opportunity.skills || "",
      status: opportunity.status || "open",
    });

    setExistingImages(
      Array.isArray(opportunity.images)
        ? opportunity.images
        : []
    );

    setSelectedImages([]);
    setShowForm(true);
    setOpenMenu(null);
  };

  const closeForm = () => {
    if (saving || uploadingImages) return;

    setShowForm(false);
    setEditingOpportunity(null);
    setForm(EMPTY_FORM);
    setExistingImages([]);
    setSelectedImages([]);
    setActionError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageSelection = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isSmallEnough =
        file.size <= 5 * 1024 * 1024;

      return isImage && isSmallEnough;
    });

    if (validFiles.length !== files.length) {
      setActionError(
        "Some images were skipped. Only image files up to 5MB are allowed."
      );
    }

    setSelectedImages((current) => [
      ...current,
      ...validFiles,
    ]);

    event.target.value = "";
  };

  const removeSelectedImage = (index) => {
    setSelectedImages((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  const removeExistingImage = (index) => {
    setExistingImages((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  const uploadImages = async (files) => {
    if (!files.length) return [];

    setUploadingImages(true);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const extension =
          file.name.split(".").pop() || "jpg";

        const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

        const filePath = `opportunities/${fileName}`;

        const { error: uploadError } =
          await supabase.storage
            .from(OPPORTUNITY_BUCKET)
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: publicUrlData,
        } = supabase.storage
          .from(OPPORTUNITY_BUCKET)
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          uploadedUrls.push(
            publicUrlData.publicUrl
          );
        }
      }

      return uploadedUrls;
    } finally {
      setUploadingImages(false);
    }
  };

  const deleteStorageImages = async (urls) => {
    if (!urls?.length) return;

    const paths = urls
      .map((url) => {
        try {
          const parsed = new URL(url);

          const marker = `/storage/v1/object/public/${OPPORTUNITY_BUCKET}/`;

          const index = parsed.pathname.indexOf(marker);

          if (index === -1) return null;

          return decodeURIComponent(
            parsed.pathname.substring(
              index + marker.length
            )
          );
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (!paths.length) return;

    const { error: removeError } =
      await supabase.storage
        .from(OPPORTUNITY_BUCKET)
        .remove(paths);

    if (removeError) {
      console.warn(
        "Could not remove some storage images:",
        removeError
      );
    }
  };

  const handleSaveOpportunity = async (event) => {
    event.preventDefault();

    setActionError("");

    if (!form.title.trim()) {
      setActionError(
        "Please provide an opportunity title."
      );
      return;
    }

    if (!form.short_description.trim()) {
      setActionError(
        "Please provide a short description."
      );
      return;
    }

    if (!form.description.trim()) {
      setActionError(
        "Please provide the full project description."
      );
      return;
    }

    if (!form.budget) {
      setActionError(
        "Please provide the project budget."
      );
      return;
    }

    setSaving(true);

    try {
      const newlyUploadedImages =
        await uploadImages(selectedImages);

      const allImages = [
        ...existingImages,
        ...newlyUploadedImages,
      ];

      const skills = form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const payload = {
        title: form.title.trim(),
        short_description:
          form.short_description.trim(),
        description: form.description.trim(),
        category: form.category,
        budget: Number(form.budget),
        deadline: form.deadline || null,
        location: form.location.trim() || "Remote",
        project_type: form.project_type,
        skills,
        images: allImages,
        status: form.status,
      };

      if (editingOpportunity) {
        const { error: updateError } =
          await supabase
            .from("opportunities")
            .update(payload)
            .eq("id", editingOpportunity.id);

        if (updateError) {
          if (newlyUploadedImages.length) {
            await deleteStorageImages(
              newlyUploadedImages
            );
          }

          throw updateError;
        }

        const removedImages =
          (editingOpportunity.images || []).filter(
            (url) => !existingImages.includes(url)
          );

        if (removedImages.length) {
          await deleteStorageImages(removedImages);
        }
      } else {
        const { error: insertError } =
          await supabase
            .from("opportunities")
            .insert({
              ...payload,

              // Admin-created opportunities
              // do not need a client.
              client_id: null,
            });

        if (insertError) {
          if (newlyUploadedImages.length) {
            await deleteStorageImages(
              newlyUploadedImages
            );
          }

          throw insertError;
        }
      }

      closeForm();
      await fetchOpportunities(true);
    } catch (err) {
      console.error(
        "Failed to save opportunity:",
        err
      );

      setActionError(
        err.message ||
          "Something went wrong while saving the opportunity."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateOpportunityStatus = async (
    opportunity,
    status
  ) => {
    setActionError("");
    setOpenMenu(null);

    try {
      const { error: updateError } =
        await supabase
          .from("opportunities")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", opportunity.id);

      if (updateError) {
        throw updateError;
      }

      setOpportunities((current) =>
        current.map((item) =>
          item.id === opportunity.id
            ? {
                ...item,
                status,
              }
            : item
        )
      );
    } catch (err) {
      console.error(
        "Failed to update opportunity status:",
        err
      );

      setActionError(
        err.message ||
          "Unable to update opportunity status."
      );
    }
  };

  const handleDeleteOpportunity = async (
    opportunity
  ) => {
    setActionError("");
    setOpenMenu(null);

    const confirmed = window.confirm(
      `Are you sure you want to delete "${opportunity.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const { error: deleteError } =
        await supabase
          .from("opportunities")
          .delete()
          .eq("id", opportunity.id);

      if (deleteError) {
        throw deleteError;
      }

      if (
        Array.isArray(opportunity.images) &&
        opportunity.images.length
      ) {
        await deleteStorageImages(
          opportunity.images
        );
      }

      setOpportunities((current) =>
        current.filter(
          (item) => item.id !== opportunity.id
        )
      );
    } catch (err) {
      console.error(
        "Failed to delete opportunity:",
        err
      );

      setActionError(
        err.message ||
          "Unable to delete the opportunity."
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
            <Link
              to="/admin"
              className="transition hover:text-navy-600"
            >
              Dashboard
            </Link>

            <span>/</span>

            <span>Opportunities</span>
          </div>

          <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-slate-950">
            Opportunities
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Create, review, publish and manage
            opportunities available to TCSN Network talents.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => fetchOpportunities(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-navy-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-navy-700"
          >
            <Plus size={17} />

            Add Opportunity
          </button>
        </div>
      </div>

      {/* GLOBAL ACTION ERROR */}
      {actionError && !showForm && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-semibold">
              Action failed
            </p>

            <p className="mt-1 text-xs leading-5">
              {actionError}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActionError("")}
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OpportunityStat
          icon={BriefcaseBusiness}
          label="Total Opportunities"
          value={stats.total}
        />

        <OpportunityStat
          icon={Clock3}
          label="Pending Review"
          value={stats.pending}
        />

        <OpportunityStat
          icon={CheckCircle2}
          label="Approved / Open"
          value={stats.approved}
        />

        <OpportunityStat
          icon={Wallet}
          label="Active Projects"
          value={stats.active}
        />
      </div>

      {/* TABLE CARD */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TOOLBAR */}
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search opportunities..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:bg-white focus:ring-4 focus:ring-navy-500/10"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <FilterSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={[
                  ["all", "All categories"],
                  ...CATEGORY_OPTIONS,
                ]}
              />

              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  ["all", "All status"],
                  ...STATUS_OPTIONS,
                ]}
              />
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Couldn't load opportunities
              </p>

              <p className="mt-1 text-xs leading-5">
                {error}
              </p>

              <button
                onClick={() => fetchOpportunities()}
                className="mt-3 text-xs font-bold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && !error && (
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex gap-4 p-5"
              >
                <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />

                <div className="flex-1">
                  <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />

                  <div className="mt-2 h-3 w-40 animate-pulse rounded bg-slate-100" />

                  <div className="mt-3 h-3 w-72 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          filteredOpportunities.length === 0 && (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">
                <BriefcaseBusiness size={25} />
              </div>

              <h3 className="mt-5 text-base font-bold text-slate-900">
                No opportunities found
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                There are no opportunities matching
                your current search and filters.
              </p>

              {opportunities.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-navy-700"
                >
                  <Plus size={15} />
                  Create first opportunity
                </button>
              )}
            </div>
          )}

        {/* TABLE */}
        {!loading &&
          !error &&
          filteredOpportunities.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Opportunity
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Client
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Budget
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Deadline
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredOpportunities.map(
                    (opportunity) => (
                      <tr
                        key={opportunity.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        {/* OPPORTUNITY */}
                        <td className="px-5 py-5">
                          <div className="flex items-start gap-3">
                            {opportunity.images?.[0] ? (
                              <img
                                src={
                                  opportunity.images[0]
                                }
                                alt={opportunity.title}
                                className="h-11 w-11 shrink-0 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                                <BriefcaseBusiness
                                  size={18}
                                />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="max-w-[320px] truncate text-sm font-bold text-slate-900">
                                {opportunity.title}
                              </p>

                              <div className="mt-1 flex items-center gap-2">
                                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                                  {opportunity.category ||
                                    "General"}
                                </span>

                                {opportunity.images
                                  ?.length > 0 && (
                                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <ImageIcon
                                      size={11}
                                    />
                                    {
                                      opportunity
                                        .images.length
                                    }
                                  </span>
                                )}

                                <span className="text-[10px] text-slate-400">
                                  {formatDate(
                                    opportunity.created_at
                                  )}
                                </span>
                              </div>

                              {opportunity.short_description && (
                                <p className="mt-2 max-w-[340px] truncate text-[11px] text-slate-400">
                                  {
                                    opportunity.short_description
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* CLIENT */}
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            {opportunity.client
                              ?.avatar_url ? (
                              <img
                                src={
                                  opportunity.client
                                    .avatar_url
                                }
                                alt={
                                  opportunity.client
                                    .full_name ||
                                  "Client"
                                }
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                {getInitials(
                                  opportunity.client
                                    ?.full_name,
                                  opportunity.client
                                    ?.username
                                )}
                              </div>
                            )}

                            <div>
                              <p className="text-xs font-bold text-slate-700">
                                {opportunity.client
                                  ?.full_name ||
                                  opportunity.client
                                    ?.username ||
                                  "Admin created"}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {opportunity.client
                                  ? "Client"
                                  : "Created by Admin"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* BUDGET */}
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2">
                            <Wallet
                              size={15}
                              className="text-slate-400"
                            />

                            <span className="text-sm font-bold text-slate-700">
                              {formatCurrency(
                                opportunity.budget
                              )}
                            </span>
                          </div>
                        </td>

                        {/* DEADLINE */}
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <CalendarDays
                              size={15}
                              className="text-slate-400"
                            />

                            {formatDate(
                              opportunity.deadline
                            )}
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-5">
                          <OpportunityStatus
                            status={opportunity.status}
                          />
                        </td>

                        {/* ACTIONS */}
                        <td className="relative px-5 py-5 text-right">
                          <button
                            onClick={() =>
                              setOpenMenu(
                                openMenu ===
                                  opportunity.id
                                  ? null
                                  : opportunity.id
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {openMenu ===
                            opportunity.id && (
                            <div className="absolute right-5 top-14 z-30 w-52 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
                              <button
                                onClick={() => {
                                  setViewOpportunity(
                                    opportunity
                                  );
                                  setOpenMenu(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                <Eye size={14} />
                                View opportunity
                              </button>

                              <button
                                onClick={() =>
                                  openEditModal(
                                    opportunity
                                  )
                                }
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                <Pencil size={14} />
                                Edit opportunity
                              </button>

                              {opportunity.status ===
                                "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      updateOpportunityStatus(
                                        opportunity,
                                        "open"
                                      )
                                    }
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-green-600 transition hover:bg-green-50"
                                  >
                                    <CheckCircle2
                                      size={14}
                                    />
                                    Approve & Open
                                  </button>

                                  <button
                                    onClick={() =>
                                      updateOpportunityStatus(
                                        opportunity,
                                        "rejected"
                                      )
                                    }
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                  >
                                    <XCircle
                                      size={14}
                                    />
                                    Reject
                                  </button>
                                </>
                              )}

                              {opportunity.status ===
                                "rejected" && (
                                <button
                                  onClick={() =>
                                    updateOpportunityStatus(
                                      opportunity,
                                      "open"
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-green-600 transition hover:bg-green-50"
                                >
                                  <CheckCircle2
                                    size={14}
                                  />
                                  Reopen
                                </button>
                              )}

                              {opportunity.status ===
                                "approved" && (
                                <button
                                  onClick={() =>
                                    updateOpportunityStatus(
                                      opportunity,
                                      "open"
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-green-600 transition hover:bg-green-50"
                                >
                                  <CheckCircle2
                                    size={14}
                                  />
                                  Publish
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  updateOpportunityStatus(
                                    opportunity,
                                    "cancelled"
                                  )
                                }
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                              >
                                <XCircle size={14} />
                                Cancel
                              </button>

                              <div className="my-1 border-t border-slate-100" />

                              <button
                                onClick={() =>
                                  handleDeleteOpportunity(
                                    opportunity
                                  )
                                }
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>

                              <button
                                onClick={() =>
                                  setOpenMenu(null)
                                }
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                <User size={14} />
                                View client
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

        {/* FOOTER */}
        {!loading &&
          !error &&
          filteredOpportunities.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-400">
                Showing{" "}
                <span className="font-bold text-slate-600">
                  {filteredOpportunities.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-600">
                  {opportunities.length}
                </span>{" "}
                opportunities
              </p>
            </div>
          )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <OpportunityFormModal
          form={form}
          editing={editingOpportunity}
          existingImages={existingImages}
          selectedImages={selectedImages}
          saving={saving}
          uploadingImages={uploadingImages}
          fileInputRef={fileInputRef}
          onClose={closeForm}
          onChange={handleFormChange}
          onSubmit={handleSaveOpportunity}
          onImageSelect={handleImageSelection}
          onRemoveExistingImage={removeExistingImage}
          onRemoveSelectedImage={removeSelectedImage}
          error={actionError}
        />
      )}

      {/* VIEW MODAL */}
      {viewOpportunity && (
        <OpportunityViewModal
          opportunity={viewOpportunity}
          onClose={() => setViewOpportunity(null)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

/* ================================= */
/* FORM MODAL */
/* ================================= */

function OpportunityFormModal({
  form,
  editing,
  existingImages,
  selectedImages,
  saving,
  uploadingImages,
  fileInputRef,
  onClose,
  onChange,
  onSubmit,
  onImageSelect,
  onRemoveExistingImage,
  onRemoveSelectedImage,
  error,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {editing
                ? "Edit Opportunity"
                : "Create Opportunity"}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {editing
                ? "Update the opportunity information and publish settings."
                : "Create a new project opportunity for talents on TCSN Network."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploadingImages}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <form
          onSubmit={onSubmit}
          className="overflow-y-auto"
        >
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_320px]">
            {/* MAIN */}
            <div className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0"
                  />

                  <p className="text-xs leading-5">
                    {error}
                  </p>
                </div>
              )}

              <FormField
                label="Opportunity title"
                required
              >
                <input
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  placeholder="e.g. Build a Restaurant Website"
                  className="form-input"
                />
              </FormField>

              <FormField
                label="Short description"
                required
                hint="A short summary that talents will see while browsing opportunities."
              >
                <textarea
                  name="short_description"
                  value={form.short_description}
                  onChange={onChange}
                  rows={3}
                  placeholder="Briefly explain what the project is about..."
                  className="form-input resize-none"
                />
              </FormField>

              <FormField
                label="Full project description"
                required
              >
                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  rows={7}
                  placeholder="Describe exactly what needs to be done, deliverables, requirements, expectations, etc."
                  className="form-input resize-none"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Category" required>
                  <select
                    name="category"
                    value={form.category}
                    onChange={onChange}
                    className="form-input"
                  >
                    {CATEGORY_OPTIONS.map(
                      ([value, label]) => (
                        <option
                          key={value}
                          value={value}
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                <FormField label="Project type">
                  <select
                    name="project_type"
                    value={form.project_type}
                    onChange={onChange}
                    className="form-input"
                  >
                    {PROJECT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Budget (NGN)"
                  required
                >
                  <div className="relative">
                    <Wallet
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="budget"
                      type="number"
                      min="0"
                      value={form.budget}
                      onChange={onChange}
                      placeholder="150000"
                      className="form-input pl-10"
                    />
                  </div>
                </FormField>

                <FormField label="Application deadline">
                  <div className="relative">
                    <CalendarDays
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="deadline"
                      type="date"
                      value={form.deadline}
                      onChange={onChange}
                      className="form-input pl-10"
                    />
                  </div>
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Location">
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="location"
                      value={form.location}
                      onChange={onChange}
                      placeholder="Remote / Lagos / Abuja..."
                      className="form-input pl-10"
                    />
                  </div>
                </FormField>

                <FormField label="Skills">
                  <div className="relative">
                    <Tag
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="skills"
                      value={form.skills}
                      onChange={onChange}
                      placeholder="React, Tailwind, Supabase"
                      className="form-input pl-10"
                    />
                  </div>

                  <p className="mt-1.5 text-[10px] text-slate-400">
                    Separate skills with commas.
                  </p>
                </FormField>
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-5">
              {/* STATUS */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className="text-navy-600"
                  />

                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Publishing
                  </p>
                </div>

                <select
                  name="status"
                  value={form.status}
                  onChange={onChange}
                  className="form-input bg-white"
                >
                  {STATUS_OPTIONS.map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>

                <p className="mt-2 text-[10px] leading-5 text-slate-400">
                  Choose <strong>Open</strong> to make
                  an admin-created opportunity visible
                  to talents immediately.
                </p>
              </div>

              {/* IMAGES */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Project images
                    </p>

                    <p className="mt-1 text-[10px] text-slate-400">
                      Optional · Max 5MB each
                    </p>
                  </div>

                  <ImageIcon
                    size={17}
                    className="text-navy-500"
                  />
                </div>

                {(existingImages.length > 0 ||
                  selectedImages.length > 0) && (
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {existingImages.map(
                      (image, index) => (
                        <div
                          key={`existing-${image}-${index}`}
                          className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
                        >
                          <img
                            src={image}
                            alt={`Project ${index + 1}`}
                            className="h-full w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              onRemoveExistingImage(
                                index
                              )
                            }
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )
                    )}

                    {selectedImages.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100"
                        >
                          <img
                            src={URL.createObjectURL(
                              file
                            )}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              onRemoveSelectedImage(
                                index
                              )
                            }
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onImageSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={
                    saving || uploadingImages
                  }
                  className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 px-4 py-7 text-center transition hover:border-navy-300 hover:bg-navy-50/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                    <Upload size={18} />
                  </div>

                  <p className="mt-3 text-xs font-bold text-slate-700">
                    Upload project images
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    PNG, JPG, WEBP
                  </p>
                </button>
              </div>

              {/* INFO */}
              <div className="rounded-xl border border-navy-100 bg-navy-50 p-4">
                <div className="flex items-start gap-3">
                  <FileText
                    size={17}
                    className="mt-0.5 shrink-0 text-navy-600"
                  />

                  <div>
                    <p className="text-xs font-bold text-navy-900">
                      Admin-created opportunity
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-navy-700/70">
                      This opportunity will be created
                      without a client and can be published
                      directly to the talent marketplace.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || uploadingImages}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || uploadingImages}
              className="flex items-center justify-center gap-2 rounded-xl bg-navy-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving || uploadingImages ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  {uploadingImages
                    ? "Uploading images..."
                    : "Saving..."}
                </>
              ) : (
                <>
                  {editing ? (
                    <Save size={16} />
                  ) : (
                    <Plus size={16} />
                  )}

                  {editing
                    ? "Save Changes"
                    : "Create Opportunity"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================================= */
/* VIEW MODAL */
/* ================================= */

function OpportunityViewModal({
  opportunity,
  onClose,
  formatCurrency,
  formatDate,
}) {
  const [activeImage, setActiveImage] =
    useState(
      opportunity.images?.[0] || null
    );

  const skills = Array.isArray(
    opportunity.skills
  )
    ? opportunity.skills
    : typeof opportunity.skills === "string"
      ? opportunity.skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-navy-500">
              Opportunity
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              {opportunity.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {/* IMAGE */}
          {opportunity.images?.length > 0 && (
            <div className="space-y-3">
              <div className="aspect-[16/7] overflow-hidden rounded-2xl bg-slate-100">
                <img
                  src={activeImage}
                  alt={opportunity.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {opportunity.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {opportunity.images.map(
                    (image, index) => (
                      <button
                        key={`${image}-${index}`}
                        onClick={() =>
                          setActiveImage(image)
                        }
                        className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                          activeImage === image
                            ? "border-navy-500"
                            : "border-transparent"
                        }`}
                      >
                        <img
                          src={image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* CONTENT */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
            <div>
              <OpportunityStatus
                status={opportunity.status}
              />

              <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
                {opportunity.short_description}
              </p>

              <div className="mt-5">
                <h3 className="text-sm font-bold text-slate-900">
                  Project Description
                </h3>

                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-500">
                  {opportunity.description}
                </p>
              </div>

              {skills.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-900">
                    Required Skills
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-600"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* DETAILS */}
            <div className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Project Details
              </h3>

              <div className="mt-4 space-y-4">
                <DetailRow
                  icon={Wallet}
                  label="Budget"
                  value={formatCurrency(
                    opportunity.budget
                  )}
                />

                <DetailRow
                  icon={CalendarDays}
                  label="Deadline"
                  value={formatDate(
                    opportunity.deadline
                  )}
                />

                <DetailRow
                  icon={MapPin}
                  label="Location"
                  value={
                    opportunity.location || "Remote"
                  }
                />

                <DetailRow
                  icon={BriefcaseBusiness}
                  label="Project Type"
                  value={
                    opportunity.project_type ||
                    "Fixed Price"
                  }
                />

                <DetailRow
                  icon={Tag}
                  label="Category"
                  value={
                    opportunity.category ||
                    "General"
                  }
                />

                <DetailRow
                  icon={User}
                  label="Client"
                  value={
                    opportunity.client
                      ?.full_name ||
                    opportunity.client
                      ?.username ||
                    "Admin created"
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================= */
/* DETAIL ROW */
/* ================================= */

function DetailRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
        <Icon size={14} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 break-words text-xs font-bold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ================================= */
/* FORM FIELD */
/* ================================= */

function FormField({
  label,
  required = false,
  hint,
  children,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-navy-500">
            *
          </span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-[10px] leading-5 text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

/* ================================= */
/* STAT CARD */
/* ================================= */

function OpportunityStat({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
          <Icon size={19} />
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
          Live
        </span>
      </div>

      <p className="mt-5 text-xs font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-['Space_Grotesk'] text-2xl font-bold text-slate-950">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

/* ================================= */
/* FILTER */
/* ================================= */

function FilterSelect({
  value,
  onChange,
  options,
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10 sm:w-44"
      >
        {options.map(
          ([optionValue, label]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {label}
            </option>
          )
        )}
      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

/* ================================= */
/* STATUS */
/* ================================= */

function OpportunityStatus({ status }) {
  const styles = {
    pending:
      "bg-amber-50 text-amber-600",

    approved:
      "bg-blue-50 text-blue-600",

    open:
      "bg-green-50 text-green-600",

    in_progress:
      "bg-navy-50 text-navy-600",

    completed:
      "bg-green-50 text-green-700",

    rejected:
      "bg-red-50 text-red-600",

    cancelled:
      "bg-slate-100 text-slate-500",
  };

  const labels = {
    pending: "Pending",
    approved: "Approved",
    open: "Open",
    in_progress: "In Progress",
    completed: "Completed",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        styles[status] ||
        "bg-slate-100 text-slate-500"
      }`}
    >
      {labels[status] || "Unknown"}
    </span>
  );
}