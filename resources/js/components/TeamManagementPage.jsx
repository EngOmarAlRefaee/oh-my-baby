import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

function fmtDate(value, locale) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SY" : "en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function RoleBadge({ role, locale, primary = false }) {
  const labels = {
    owner: locale === "ar" ? "مالك" : "Owner",
    admin: locale === "ar" ? "إدمن" : "Admin",
    delivery: locale === "ar" ? "ديليفري" : "Delivery",
    customer: locale === "ar" ? "زبون" : "Customer",
  };

  return (
    <span className="inline-flex border border-espresso/15 bg-oat/25 px-2.5 py-1 text-[11px] font-black">
      {primary && role === "admin"
        ? (locale === "ar" ? "الإدمن الرئيسي" : "Primary Admin")
        : (labels[role] || role)}
    </span>
  );
}

function permissionCodes(groups = []) {
  return groups.flatMap((group) => group.items || []).map((item) => item.code);
}

function addDependencies(codes, dependencies = {}) {
  const next = new Set(codes || []);
  let changed = true;
  while (changed) {
    changed = false;
    Array.from(next).forEach((code) => {
      (dependencies[code] || []).forEach((dependency) => {
        if (!next.has(dependency)) {
          next.add(dependency);
          changed = true;
        }
      });
    });
  }
  return Array.from(next);
}

function removePermissionAndDependents(codes, removedCode, dependencies = {}) {
  const next = new Set(codes || []);
  next.delete(removedCode);
  let changed = true;
  while (changed) {
    changed = false;
    Array.from(next).forEach((code) => {
      if ((dependencies[code] || []).some((dependency) => !next.has(dependency))) {
        next.delete(code);
        changed = true;
      }
    });
  }
  return Array.from(next);
}

function PermissionSelector({ groups = [], value = [], onChange, locale = "ar", disabled = false, dependencies = {} }) {
  const isAr = locale === "ar";
  const allCodes = permissionCodes(groups);
  const selected = new Set(value || []);
  const allSelected = allCodes.length > 0 && allCodes.every((code) => selected.has(code));

  const toggle = (code) => {
    if (disabled) return;
    if (selected.has(code)) onChange(removePermissionAndDependents(value, code, dependencies));
    else onChange(addDependencies([...(value || []), code], dependencies));
  };

  const toggleAll = () => {
    if (disabled) return;
    onChange(allSelected ? [] : addDependencies(allCodes, dependencies));
  };

  if (!groups.length) return null;

  return (
    <div className="border border-espresso/10 bg-milk p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-espresso/10 pb-4">
        <div>
          <p className="text-xs font-black text-aubergine/60">PERMISSIONS</p>
          <h3 className="mt-1 text-base font-black text-espresso">
            {isAr ? "اختيار الصلاحيات" : "Choose permissions"}
          </h3>
        </div>
        <button
          type="button"
          onClick={toggleAll}
          disabled={disabled}
          className="border border-aubergine/25 px-3 py-2 text-xs font-black text-aubergine disabled:opacity-40"
        >
          {allSelected ? (isAr ? "إلغاء تحديد الكل" : "Clear all") : (isAr ? "تحديد الكل" : "Select all")}
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <section key={group.key} className="border border-espresso/10 bg-oat/10 p-4">
            <h4 className="text-sm font-black text-espresso">
              {isAr ? group.title_ar : group.title_en}
            </h4>
            <div className="mt-3 grid gap-2">
              {(group.items || []).map((item) => (
                <label key={item.code} className="flex cursor-pointer items-start gap-3 border-t border-espresso/10 pt-2 first:border-0 first:pt-0">
                  <input
                    type="checkbox"
                    checked={selected.has(item.code)}
                    onChange={() => toggle(item.code)}
                    disabled={disabled}
                    className="mt-1 h-4 w-4 accent-[#7c5f49]"
                  />
                  <span>
                    <strong className="block text-sm text-espresso">{isAr ? item.ar : item.en}</strong>
                    <span className="mt-0.5 block text-[10px] text-espresso/35">{item.code}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-4 text-xs font-black text-aubergine/65">
        {isAr ? `تم اختيار ${value.length} صلاحية` : `${value.length} permissions selected`}
      </p>
    </div>
  );
}


function relevantScopeDomains(role, permissions = []) {
  const hasPrefix = (prefix) => permissions.some((code) => code.startsWith(prefix));
  if (role === "delivery") {
    const domains = [];
    if (hasPrefix("delivery.")) domains.push("orders");
    if (permissions.includes("delivery.customer_phone")) domains.push("customers");
    return domains;
  }
  if (role !== "admin") return [];
  const domains = [];
  if (hasPrefix("orders.")) domains.push("orders");
  if (hasPrefix("products.")) domains.push("products");
  if (hasPrefix("delivery.")) domains.push("delivery");
  return domains;
}

function DataScopeSelector({ role, permissions = [], value = {}, onChange, data, locale = "ar" }) {
  const isAr = locale === "ar";
  const definitions = data?.scope_definitions?.[role] || {};
  const labels = data?.scope_mode_labels || {};
  const sections = data?.scope_section_options || [];
  const viewerScopes = data?.viewer_data_scopes || {};
  const domains = relevantScopeDomains(role, permissions).filter((domain) => definitions[domain]);

  if (!domains.length) return null;

  const modeAllowed = (domain, mode) => {
    if (data?.viewer_role === "owner") return true;
    const parent = viewerScopes[domain];
    if (!parent) return false;
    if (parent.mode === "all") return true;
    return parent.mode === mode;
  };

  const sectionOptions = (domain) => {
    if (data?.viewer_role === "owner") return sections;
    const parent = viewerScopes[domain];
    if (parent?.mode !== "section") return sections;
    const allowed = new Set(parent.values || []);
    return sections.filter((item) => allowed.has(item.code));
  };

  const setMode = (domain, mode) => {
    if (!modeAllowed(domain, mode)) return;
    onChange({
      ...value,
      [domain]: { mode, values: mode === "section" ? (value?.[domain]?.values || []) : [] },
    });
  };

  const toggleSection = (domain, code) => {
    const current = new Set(value?.[domain]?.values || []);
    if (current.has(code)) current.delete(code); else current.add(code);
    onChange({ ...value, [domain]: { mode: "section", values: Array.from(current) } });
  };

  return (
    <div className="border border-espresso/10 bg-milk p-4 sm:p-5">
      <div className="border-b border-espresso/10 pb-4">
        <p className="text-xs font-black text-aubergine/60">DATA SCOPE</p>
        <h3 className="mt-1 text-base font-black text-espresso">{isAr ? "نطاق البيانات" : "Data scope"}</h3>
        <p className="mt-1 text-xs leading-6 text-espresso/45">
          {isAr ? "حدد أي بيانات يشوفها الحساب داخل الأقسام اللي سمحتله يدخل عليها." : "Choose which records this account can see inside its allowed sections."}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {domains.map((domain) => {
          const def = definitions[domain];
          const current = value?.[domain] || { mode: def.default, values: [] };
          return (
            <section key={domain} className="border border-espresso/10 bg-oat/10 p-4">
              <h4 className="text-sm font-black text-espresso">{isAr ? def.ar : def.en}</h4>
              <div className="mt-3 grid gap-2">
                {(def.modes || []).filter((mode) => modeAllowed(domain, mode)).map((mode) => (
                  <label key={mode} className="flex cursor-pointer items-center gap-3 border-t border-espresso/10 pt-2 first:border-0 first:pt-0">
                    <input
                      type="radio"
                      name={`scope-${role}-${domain}`}
                      checked={current.mode === mode}
                      onChange={() => setMode(domain, mode)}
                      className="h-4 w-4 accent-[#7c5f49]"
                    />
                    <strong className="text-sm text-espresso">{isAr ? labels?.[mode]?.ar : labels?.[mode]?.en}</strong>
                  </label>
                ))}
              </div>

              {current.mode === "section" && (
                <div className="mt-4 border-t border-espresso/10 pt-3">
                  <p className="mb-2 text-xs font-black text-espresso/55">{isAr ? "اختر القسم أو الأقسام" : "Choose section(s)"}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sectionOptions(domain).map((section) => (
                      <label key={section.code} className="flex cursor-pointer items-center gap-2 text-xs font-bold text-espresso/75">
                        <input
                          type="checkbox"
                          checked={(current.values || []).includes(section.code)}
                          onChange={() => toggleSection(domain, section.code)}
                          className="h-4 w-4 accent-[#7c5f49]"
                        />
                        <span>{isAr ? section.ar : section.en}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function TeamManagementPage({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [filter, setFilter] = useState("staff");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "admin",
    password: "",
    permissions: [],
    data_scopes: {},
  });

  const load = async () => {
    try {
      setError("");
      setData(await apiFetch("/api/team"));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!editingUser) return undefined;

    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !editSaving) closeEdit();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
    };
  }, [editingUser, editSaving]);

  useEffect(() => {
    if (!data) return;
    if (!data.creatable_roles?.includes(form.role)) {
      setForm((current) => ({
        ...current,
        role: data.creatable_roles?.[0] || "customer",
        permissions: [],
        data_scopes: data.scope_defaults?.[data.creatable_roles?.[0]] || {},
      }));
    }
  }, [data]);

  const viewerPermissions = useMemo(() => new Set(data?.viewer_effective_permissions || []), [data]);
  const viewerHas = (code) => data?.viewer_role === "owner" || viewerPermissions.has("*") || viewerPermissions.has(code);

  const rows = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.users;
    if (filter === "admin") return data.users.filter((u) => u.role === "admin");
    if (filter === "delivery") return data.users.filter((u) => u.role === "delivery");
    if (filter === "customer") return data.users.filter((u) => u.role === "customer");
    return data.users.filter((u) => ["admin", "delivery"].includes(u.role));
  }, [data, filter]);

  const groupsFor = (role) => data?.permission_groups?.[role] || [];

  const setCreateRole = (role) => {
    setForm((current) => ({ ...current, role, permissions: [], data_scopes: data?.scope_defaults?.[role] || {} }));
    setError("");
    setSuccess("");
  };

  const createAccount = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    if (["admin", "delivery"].includes(form.role) && !form.permissions.length) {
      setBusy(false);
      setError(isAr ? "اختَر صلاحية واحدة على الأقل قبل إنشاء الحساب." : "Choose at least one permission before creating the account.");
      return;
    }

    try {
      await apiFetch("/api/team", { method: "POST", body: JSON.stringify(form) });
      const nextRole = data.creatable_roles?.[0] || "customer";
      setForm({ name: "", email: "", phone: "", role: nextRole, password: "", permissions: [], data_scopes: data.scope_defaults?.[nextRole] || {} });
      setSuccess(isAr ? "تم إنشاء الحساب مع الصلاحيات المختارة." : "Account created with the selected permissions.");
      await load();
    } catch (e) {
      const errors = e.data?.errors;
      setError(errors ? Object.values(errors).flat().join(" · ") : e.message);
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      permissions: user.permissions || [],
      data_scopes: user.data_scopes || data?.scope_defaults?.[user.role] || {},
    });
    setError("");
    setSuccess("");
    setEditError("");
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditForm(null);
    setEditError("");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser || !editForm || editSaving) return;

    setEditError("");
    setError("");
    setSuccess("");

    if (!editForm.name?.trim()) {
      setEditError(isAr ? "الاسم مطلوب قبل الحفظ." : "Name is required before saving.");
      return;
    }
    if (!editForm.email?.trim()) {
      setEditError(isAr ? "البريد الإلكتروني مطلوب قبل الحفظ." : "Email is required before saving.");
      return;
    }
    if (!editForm.phone?.trim()) {
      setEditError(isAr ? "رقم الهاتف مطلوب قبل الحفظ." : "Phone number is required before saving.");
      return;
    }
    if (editForm.password && editForm.password.length < 8) {
      setEditError(isAr ? "كلمة المرور الجديدة لازم تكون 8 أحرف على الأقل." : "New password must be at least 8 characters.");
      return;
    }
    if (["admin", "delivery"].includes(editingUser.role) && !editForm.permissions.length) {
      setEditError(isAr ? "لازم يبقى للحساب صلاحية واحدة على الأقل." : "The account must keep at least one permission.");
      return;
    }

    setEditSaving(true);
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password;
      await apiFetch(`/api/team/${editingUser.id}`, { method: "PUT", body: JSON.stringify(payload) });
      await load();
      closeEdit();
      setSuccess(isAr ? "تم حفظ بيانات الحساب والصلاحيات بنجاح." : "Account and permissions saved successfully.");
    } catch (err) {
      const errors = err.data?.errors;
      const message = errors ? Object.values(errors).flat().join(" · ") : err.message;
      setEditError(message || (isAr ? "تعذر حفظ التعديلات." : "Could not save changes."));
    } finally {
      setEditSaving(false);
    }
  };

  const suspend = async (user) => {
    const reason = window.prompt(isAr ? `سبب إيقاف حساب ${user.name}:` : `Reason for suspending ${user.name}:`);
    if (!reason?.trim()) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/team/${user.id}/suspend`, { method: "POST", body: JSON.stringify({ reason: reason.trim() }) });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reactivate = async (user) => {
    if (!window.confirm(isAr ? `إعادة تفعيل حساب ${user.name}؟` : `Reactivate ${user.name}?`)) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/team/${user.id}/reactivate`, { method: "POST", body: "{}" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const makePrimary = async (user) => {
    if (!window.confirm(isAr ? `تعيين ${user.name} كإدمن رئيسي؟` : `Make ${user.name} the primary admin?`)) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/team/${user.id}/make-primary-admin`, { method: "POST", body: "{}" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const deletionBlockerLabel = (code) => {
    const ar = {
      owner_account: "حساب الأونر",
      primary_admin: "الإدمن الرئيسي",
      customer_orders: "طلبات زبائن",
      assigned_deliveries: "طلبات توصيل مسندة",
      return_deliveries: "مرتجعات مسندة",
      order_history: "سجل عمليات طلبات",
      reward_coupons: "مكافآت وكوبونات",
      owner_requests: "طلبات مرفوعة للأونر",
      reviewed_owner_requests: "طلبات أونر تمت مراجعتها",
      created_products: "منتجات أنشأها الحساب",
      updated_products: "منتجات عدّلها الحساب",
      wishlist: "قائمة مفضلة",
      product_reviews: "مراجعات منتجات",
      poll_votes: "تصويتات",
      customer_feedback: "ملاحظات زبون",
    };
    const en = {
      owner_account: "owner account", primary_admin: "primary admin", customer_orders: "customer orders",
      assigned_deliveries: "assigned deliveries", return_deliveries: "return deliveries", order_history: "order history",
      reward_coupons: "reward coupons", owner_requests: "owner requests", reviewed_owner_requests: "reviewed owner requests",
      created_products: "created products", updated_products: "updated products", wishlist: "wishlist",
      product_reviews: "product reviews", poll_votes: "poll votes", customer_feedback: "customer feedback",
    };
    return (isAr ? ar : en)[code] || code;
  };

  const deleteAccount = async (user) => {
    if (!user?.deletion?.can_delete) return;
    const typed = window.prompt(
      isAr
        ? `الحذف النهائي مسموح فقط لأن الحساب غير مستخدم. لحذف ${user.name} نهائياً اكتب DELETE`
        : `Permanent deletion is allowed only because this account is unused. Type DELETE to permanently delete ${user.name}.`
    );
    if (typed !== "DELETE") return;

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch(`/api/team/${user.id}`, { method: "DELETE" });
      await load();
      setSuccess(isAr ? "تم حذف الحساب غير المستخدم نهائياً." : "Unused account permanently deleted.");
    } catch (e) {
      const blockers = e.data?.blockers || [];
      const detail = blockers.length ? ` — ${blockers.map(deletionBlockerLabel).join("، ")}` : "";
      setError(`${e.message || (isAr ? "تعذر حذف الحساب." : "Could not delete account.")}${detail}`);
    } finally {
      setBusy(false);
    }
  };

  const canManageTarget = (user) => {
    if (!data || user.id === data.viewer_id) return false;
    if (data.viewer_role === "owner") return ["admin", "delivery", "customer"].includes(user.role);
    if (user.is_primary_admin) return false;
    if (user.role === "admin") return viewerHas("team.create_admin") || viewerHas("team.manage_permissions");
    return ["delivery", "customer"].includes(user.role);
  };

  const canEditTarget = (user) => {
    if (!canManageTarget(user) || !viewerHas("team.edit_accounts")) return false;
    if (["admin", "delivery"].includes(user.role)) return viewerHas("team.manage_permissions");
    return true;
  };
  const canSuspendTarget = (user) => canManageTarget(user) && viewerHas("team.suspend_accounts");

  return (
    <main className="min-h-[75vh] bg-milk px-5 py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="omb-eyebrow-label text-aubergine/65">OH MY BABY — TEAM & PERMISSIONS</p>
            <h1 className="mt-2 text-4xl font-black text-espresso">{isAr ? "الحسابات والفريق" : "Accounts & team"}</h1>
            {data?.viewer_role === "owner" && (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-espresso/55">
                {isAr ? "إدارة حسابات الفريق وتوزيع مهامهم من مكان واحد." : "Manage team accounts and distribute responsibilities from one place."}
              </p>
            )}
          </div>
          <a href={data?.viewer_role === "owner" ? "/owner" : "/admin"} className="omb-btn omb-btn-secondary">
            {isAr ? "رجوع للوحة التحكم" : "Back to dashboard"}
          </a>
        </div>

        {error && <p className="mt-6 border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
        {success && <p className="mt-6 border border-emerald-300 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{success}</p>}

        {data && (
          <>
            <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button type="button" onClick={() => setFilter("admin")} className="border border-espresso/10 bg-oat/20 p-5 text-start hover:border-aubergine/35">
                <p className="text-xs font-black text-espresso/55">ADMINS</p><strong className="mt-2 block text-3xl">{data.summary.admins}</strong><p className="mt-1 text-xs text-espresso/45">{isAr ? `${data.summary.active_admins} فعال` : `${data.summary.active_admins} active`}</p>
              </button>
              <button type="button" onClick={() => setFilter("delivery")} className="border border-espresso/10 bg-oat/20 p-5 text-start hover:border-aubergine/35">
                <p className="text-xs font-black text-espresso/55">DELIVERY</p><strong className="mt-2 block text-3xl">{data.summary.drivers}</strong><p className="mt-1 text-xs text-espresso/45">{isAr ? `${data.summary.active_drivers} فعال` : `${data.summary.active_drivers} active`}</p>
              </button>
              <button type="button" onClick={() => setFilter("customer")} className="border border-espresso/10 bg-oat/20 p-5 text-start hover:border-aubergine/35">
                <p className="text-xs font-black text-espresso/55">CUSTOMERS</p><strong className="mt-2 block text-3xl">{data.summary.customers}</strong><p className="mt-1 text-xs text-espresso/45">{isAr ? "حسابات المشتركين" : "Customer accounts"}</p>
              </button>
            </section>

            <div className={`mt-8 grid gap-6 ${(data.creatable_roles || []).length ? "xl:grid-cols-[.9fr_1.45fr]" : "grid-cols-1"}`}>
              {(data.creatable_roles || []).length ? <form onSubmit={createAccount} className="border border-espresso/10 bg-oat/15 p-5 sm:p-6">
                <p className="text-xs font-black text-aubergine/60">NEW ACCOUNT</p>
                <h2 className="mt-2 text-xl font-black">{isAr ? "إنشاء حساب جديد" : "Create a new account"}</h2>
                <p className="mt-2 text-xs leading-6 text-espresso/50">
                  {isAr ? "اختَر نوع الحساب أولاً، وبعدها حدد الصلاحيات اللي بدك تعطيها إله." : "Choose the account type, then grant only the permissions it needs."}
                </p>

                <div className="mt-5 grid gap-3">
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isAr ? "الاسم" : "Name"} className="border border-espresso/15 bg-milk px-4 py-3 text-sm outline-none focus:border-aubergine" />
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border border-espresso/15 bg-milk px-4 py-3 text-sm outline-none focus:border-aubergine" />
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={isAr ? "رقم الهاتف" : "Phone"} className="border border-espresso/15 bg-milk px-4 py-3 text-sm outline-none focus:border-aubergine" />
                  <label className="grid gap-1 text-xs font-black text-espresso/60">
                    {isAr ? "نوع الحساب" : "Account type"}
                    <select value={form.role} onChange={(e) => setCreateRole(e.target.value)} className="border border-espresso/15 bg-milk px-4 py-3 text-sm font-bold text-espresso outline-none focus:border-aubergine">
                      {(data.creatable_roles || []).map((role) => (
                        <option key={role} value={role}>{role === "admin" ? "Admin" : role === "delivery" ? "Delivery" : (isAr ? "Customer — زبون" : "Customer")}</option>
                      ))}
                    </select>
                  </label>
                  <input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={isAr ? "كلمة المرور — 8 أحرف على الأقل" : "Password — minimum 8 characters"} className="border border-espresso/15 bg-milk px-4 py-3 text-sm outline-none focus:border-aubergine" />
                </div>

                {["admin", "delivery"].includes(form.role) && (
                  <div className="mt-5">
                    <PermissionSelector
                      groups={groupsFor(form.role)}
                      value={form.permissions}
                      onChange={(permissions) => setForm((current) => ({ ...current, permissions }))}
                      locale={locale}
                      dependencies={data.permission_dependencies || {}}
                    />
                    <div className="mt-4">
                      <DataScopeSelector
                        role={form.role}
                        permissions={form.permissions}
                        value={form.data_scopes}
                        onChange={(data_scopes) => setForm((current) => ({ ...current, data_scopes }))}
                        data={data}
                        locale={locale}
                      />
                    </div>
                  </div>
                )}

                {form.role === "customer" && (
                  <div className="mt-5 border border-espresso/10 bg-milk p-4 text-sm leading-7 text-espresso/55">
                    {isAr ? "حساب الزبون ما إله صلاحيات إدارية. بيستخدم الطلبات والمكافآت وحسابه الشخصي فقط." : "Customer accounts do not receive administrative permissions."}
                  </div>
                )}

                <button disabled={busy} className="omb-btn omb-btn-primary mt-5 w-full disabled:opacity-50">
                  {busy ? (isAr ? "لحظة..." : "Please wait...") : (isAr ? "إنشاء الحساب بالصلاحيات المحددة" : "Create account with permissions")}
                </button>
              </form> : null}

              <section className="border border-espresso/10 bg-milk p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div><p className="text-xs font-black text-aubergine/60">EXISTING ACCOUNTS</p><h2 className="mt-1 text-xl font-black">{isAr ? "الحسابات الموجودة" : "Existing accounts"}</h2></div>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-espresso/15 bg-milk px-3 py-2 text-xs font-black">
                    <option value="staff">{isAr ? "الموظفون" : "Staff"}</option>
                    <option value="admin">Admin</option>
                    <option value="delivery">Delivery</option>
                    <option value="customer">{isAr ? "العملاء" : "Customers"}</option>
                    <option value="all">{isAr ? "الكل" : "All"}</option>
                  </select>
                </div>

                <div className="mt-5 grid gap-3">
                  {rows.map((user) => (
                    <article key={user.id} className="border border-espresso/10 bg-oat/10 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <strong>{user.name}</strong>
                            <RoleBadge role={user.role} locale={locale} primary={user.is_primary_admin} />
                            <span className={`text-[11px] font-black ${user.account_status === "active" ? "text-emerald-700" : "text-red-700"}`}>
                              {user.account_status === "active" ? (isAr ? "فعال" : "Active") : (isAr ? "موقوف" : "Suspended")}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-espresso/55">{user.email} · {user.phone || "—"}</p>
                          <p className="mt-1 text-[11px] text-espresso/40">{isAr ? "آخر دخول:" : "Last login:"} {fmtDate(user.last_login_at, locale)}</p>
                          {user.role !== "customer" && (
                            <p className="mt-2 text-xs font-black text-aubergine/65">
                              {isAr
                                ? `${(user.permissions || []).length} صلاحية مفعلة${user.is_primary_admin ? " · إدمن رئيسي" : ""}`
                                : `${(user.permissions || []).length} permissions enabled${user.is_primary_admin ? " · Primary Admin" : ""}`}
                            </p>
                          )}
                          {user.account_status !== "active" && user.suspension_reason && <p className="mt-2 text-xs font-bold text-red-700">{isAr ? "سبب الإيقاف:" : "Suspension reason:"} {user.suspension_reason}</p>}
                          {data.viewer_role === "owner" && user.deletion && !user.deletion.can_delete && (
                            <p className="mt-2 text-[11px] leading-5 text-espresso/45">
                              {isAr ? "الحذف النهائي محمي لأن الحساب مرتبط بـ: " : "Permanent deletion is protected because this account is linked to: "}
                              {(user.deletion.blockers || []).map(deletionBlockerLabel).join(isAr ? "، " : ", ")}
                              {isAr ? ". استخدم إيقاف الحساب بدل الحذف." : ". Suspend the account instead."}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {data.viewer_role === "owner" && user.role === "admin" && !user.is_primary_admin && (
                            <button disabled={busy} onClick={() => makePrimary(user)} className="border border-aubergine/30 px-3 py-2 text-xs font-black text-aubergine hover:bg-aubergine/5 disabled:opacity-50">
                              {isAr ? "جعله الإدمن الرئيسي" : "Make primary"}
                            </button>
                          )}
                          {canEditTarget(user) && (
                            <button disabled={busy} onClick={() => openEdit(user)} className="border border-espresso/20 px-3 py-2 text-xs font-black hover:bg-oat/30 disabled:opacity-50">
                              {isAr ? "تعديل الحساب والصلاحيات" : "Edit account & permissions"}
                            </button>
                          )}
                          {canSuspendTarget(user) && (
                            user.account_status === "active"
                              ? <button disabled={busy} onClick={() => suspend(user)} className="border border-red-300 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50 disabled:opacity-50">{isAr ? "إيقاف الحساب" : "Suspend"}</button>
                              : <button disabled={busy} onClick={() => reactivate(user)} className="border border-espresso/20 px-3 py-2 text-xs font-black hover:bg-oat/30 disabled:opacity-50">{isAr ? "إعادة التفعيل" : "Reactivate"}</button>
                          )}
                          {data.viewer_role === "owner" && user.deletion?.can_delete && (
                            <button disabled={busy} onClick={() => deleteAccount(user)} className="border border-red-500 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50 disabled:opacity-50">
                              {isAr ? "حذف نهائي آمن" : "Safe permanent delete"}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                  {!rows.length && <p className="py-8 text-center text-sm text-espresso/45">{isAr ? "لا توجد حسابات ضمن هذا الفلتر." : "No accounts in this filter."}</p>}
                </div>
              </section>
            </div>

            {data.viewer_role === "owner" && (
              <section className="mt-8 border border-espresso/10 bg-oat/15 p-5 sm:p-6">
                <p className="text-xs font-black text-aubergine/60">OWNER AUDIT LOG</p>
                <h2 className="mt-1 text-xl font-black">{isAr ? "السجل الداخلي للأونر" : "Owner internal audit log"}</h2>
                <p className="mt-2 text-xs leading-6 text-espresso/45">{isAr ? "هاد السجل داخلي للأونر فقط، وما بيظهر للزبون أو للموظفين كجزء من حالة الطلب." : "This audit trail is visible to the owner only."}</p>
                <div className="mt-4 grid gap-2">
                  {(data.activity || []).map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-espresso/10 pt-3 first:border-0 first:pt-0">
                      <div className="text-sm"><strong>{item.actor?.name || "System"}</strong><span className="mx-2 text-espresso/35">→</span><span>{item.target?.name || "—"}</span><p className="mt-1 text-xs text-espresso/45">{item.action}{item.note ? ` · ${item.note}` : ""}</p></div>
                      <span className="text-[11px] text-espresso/40">{fmtDate(item.created_at, locale)}</span>
                    </div>
                  ))}
                  {!(data.activity || []).length && <p className="text-sm text-espresso/45">{isAr ? "لا يوجد سجل بعد." : "No activity yet."}</p>}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {editingUser && editForm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden overscroll-contain bg-black/60 p-3 backdrop-blur-[2px] sm:p-6"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !editSaving) closeEdit(); }}
        >
          <form
            onSubmit={saveEdit}
            noValidate
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto overscroll-contain border border-espresso/15 bg-milk shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
          >
            <div className="sticky top-0 z-20 flex flex-wrap items-start justify-between gap-4 border-b border-espresso/10 bg-milk p-5 pb-5 sm:p-7 sm:pb-5">
              <div>
                <p className="text-xs font-black text-aubergine/60">EDIT ACCOUNT</p>
                <h2 className="mt-1 text-2xl font-black text-espresso">{isAr ? `تعديل ${editingUser.name}` : `Edit ${editingUser.name}`}</h2>
                <div className="mt-2"><RoleBadge role={editingUser.role} locale={locale} primary={editingUser.is_primary_admin} /></div>
              </div>
              <button type="button" onClick={closeEdit} className="border border-espresso/15 px-3 py-2 text-xs font-black">{isAr ? "إغلاق" : "Close"}</button>
            </div>

            <div className="px-5 sm:px-7">
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder={isAr ? "الاسم" : "Name"} className="border border-espresso/15 bg-milk px-4 py-3 text-sm outline-none focus:border-aubergine" />
              <input required type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" className="border border-espresso/15 bg-milk px-4 py-3 text-sm outline-none focus:border-aubergine" />
              <input required value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder={isAr ? "رقم الهاتف" : "Phone"} className="border border-espresso/15 bg-milk px-4 py-3 text-sm outline-none focus:border-aubergine" />
              <input type="password" minLength={8} value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder={isAr ? "كلمة مرور جديدة — اختياري" : "New password — optional"} className="border border-espresso/15 bg-milk px-4 py-3 text-sm outline-none focus:border-aubergine" />
            </div>

            {["admin", "delivery"].includes(editingUser.role) && (
              <div className="mt-5">
                <PermissionSelector
                  groups={groupsFor(editingUser.role)}
                  value={editForm.permissions}
                  onChange={(permissions) => setEditForm((current) => ({ ...current, permissions }))}
                  locale={locale}
                  dependencies={data.permission_dependencies || {}}
                />
                <div className="mt-4">
                  <DataScopeSelector
                    role={editingUser.role}
                    permissions={editForm.permissions}
                    value={editForm.data_scopes}
                    onChange={(data_scopes) => setEditForm((current) => ({ ...current, data_scopes }))}
                    data={data}
                    locale={locale}
                  />
                </div>
              </div>
            )}

            {editingUser.role === "customer" && (
              <div className="mt-5 border border-espresso/10 bg-oat/15 p-4 text-sm text-espresso/55">
                {isAr ? "الزبون ما عنده صلاحيات إدارية؛ هون بتعدل بيانات حسابه فقط." : "Customers have no administrative permissions; only profile data is editable here."}
              </div>
            )}

            {editError && (
              <div className="mt-6 border border-red-400 bg-red-50 p-3 text-sm font-black leading-6 text-red-700">
                {editError}
              </div>
            )}
            </div>

            <div className="sticky bottom-0 z-20 mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-espresso/10 bg-milk p-5 sm:px-7">
              <button type="button" onClick={closeEdit} disabled={editSaving} className="omb-btn omb-btn-secondary disabled:opacity-50">{isAr ? "إلغاء" : "Cancel"}</button>
              <button type="submit" disabled={editSaving} className="omb-btn omb-btn-primary disabled:opacity-50">
                {editSaving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التعديلات" : "Save changes")}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
