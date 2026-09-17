import React, { useEffect, useState } from "react";

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": csrfToken(),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firstError = Object.values(data.errors || {})?.[0]?.[0];
    throw new Error(firstError || data.message || "Request failed");
  }
  return data;
}

const roleCopy = {
  owner: { ar: "Owner", en: "Owner" },
  admin: { ar: "Admin", en: "Admin" },
  delivery: { ar: "Delivery", en: "Delivery" },
  customer: { ar: "مشترك", en: "Member" },
};

function dashboardForRole(role) {
  if (role === "owner") return "/owner";
  if (role === "admin") return "/admin";
  if (role === "delivery") return "/delivery";
  return "/account";
}

export default function AuthPanel({ locale = "ar", compact = false, redirectOnSuccess = true }) {
  const isAr = locale === "ar";
  const [mode, setMode] = useState("login");
  const [session, setSession] = useState({ loading: true, user: null });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "", remember: true });
  const [register, setRegister] = useState({ name: "", email: "", phone: "", password: "", password_confirmation: "" });

  useEffect(() => {
    let active = true;
    request("/auth/session", { method: "GET", headers: { "Content-Type": "application/json" } })
      .then((data) => active && setSession({ loading: false, user: data.user || null }))
      .catch(() => active && setSession({ loading: false, user: null }));
    request("/auth/google/status", { method: "GET", headers: { "Content-Type": "application/json" } })
      .then((data) => active && setGoogleEnabled(Boolean(data.enabled)))
      .catch(() => active && setGoogleEnabled(false));
    return () => { active = false; };
  }, []);

  async function submitLogin(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const data = await request("/auth/login", { method: "POST", body: JSON.stringify(login) });
      setSession({ loading: false, user: data.user });
      window.dispatchEvent(new CustomEvent("omb:auth-updated"));
      if (redirectOnSuccess) window.location.assign(data.redirect || dashboardForRole(data.user?.role));
      else setMessage(isAr ? "تم تسجيل الدخول بنجاح." : "Signed in successfully.");
    } catch (error) {
      setMessage(isAr ? "تعذر تسجيل الدخول. تأكدي من البريد وكلمة المرور." : error.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const data = await request("/auth/register", { method: "POST", body: JSON.stringify(register) });
      setSession({ loading: false, user: data.user });
      window.dispatchEvent(new CustomEvent("omb:auth-updated"));
      if (redirectOnSuccess) window.location.assign(data.redirect || dashboardForRole(data.user?.role));
      else setMessage(isAr ? "تم إنشاء الحساب وتسجيل الدخول." : "Account created and signed in.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await request("/auth/logout", { method: "POST", body: "{}" });
      setSession({ loading: false, user: null });
      window.dispatchEvent(new CustomEvent("omb:auth-updated"));
      setMessage(isAr ? "تم تسجيل الخروج." : "Signed out.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (session.loading) {
    return <div className="border border-espresso/10 bg-oat/20 p-7 text-sm font-black text-espresso/55">{isAr ? "جاري تحميل الحساب..." : "Loading account..."}</div>;
  }

  if (session.user) {
    const user = session.user;
    return (
      <div className={`border border-espresso/10 bg-oat/20 ${compact ? "p-6" : "p-7 sm:p-9"}`}>
        <p className="omb-eyebrow-label text-aubergine/65">SIGNED IN</p>
        <h3 className="mt-3 text-2xl font-black text-espresso">{user.name}</h3>
        <p className="mt-1 text-sm text-espresso/55">{user.email}</p>
        <span className="mt-4 inline-flex border border-aubergine/20 bg-aubergine/5 px-3 py-1.5 text-xs font-black text-aubergine">{roleCopy[user.role]?.[locale] || user.role}</span>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <a href={dashboardForRole(user.role)} className="omb-btn omb-btn-primary">
            {user.role === "owner" ? (isAr ? "لوحة المالك" : "Owner dashboard") : user.role === "admin" ? (isAr ? "لوحة الإدمن" : "Admin dashboard") : user.role === "delivery" ? (isAr ? "لوحة التوصيل" : "Delivery dashboard") : (isAr ? "حسابي وطلباتي" : "My account")}
          </a>
          {user.role === "customer" && <a href="/wishlist" className="omb-btn omb-btn-secondary">{isAr ? "المفضلة" : "Wishlist"}</a>}
          {user.role === "customer" && <a href="/cart" className="omb-btn omb-btn-secondary">{isAr ? "السلة" : "Bag"}</a>}
          {(["owner", "admin"].includes(user.role)) && <a href="/admin/orders" className="omb-btn omb-btn-secondary">{isAr ? "الطلبات" : "Orders"}</a>}
        </div>

        <div className="mt-6 border-t border-espresso/10 pt-5">
          <p className="text-xs leading-6 text-espresso/55">
            {user.role === "customer"
              ? isAr
                ? "طلباتك، حالتها، السائق عند التعيين، والكوبونات التي فتحتها تظهر ضمن صفحة الحساب."
                : "Your orders, live status, assigned driver and unlocked coupons are available in the account page."
              : isAr
                ? "الدور والصلاحية مفعّلان من الـBackend، وليسا مجرد إخفاء أزرار بالواجهة."
                : "The role and route permissions are enforced by the backend, not only hidden in the UI."}
          </p>
          <button type="button" disabled={busy} onClick={logout} className="mt-4 text-sm font-black text-aubergine underline disabled:opacity-40">{isAr ? "تسجيل الخروج" : "Sign out"}</button>
        </div>
        {message && <p className="mt-4 text-sm font-black text-aubergine">{message}</p>}
      </div>
    );
  }

  return (
    <div className={`border border-espresso/10 bg-oat/20 ${compact ? "p-6" : "p-7 sm:p-9"}`}>
      <a
        href={googleEnabled ? "/auth/google/redirect" : undefined}
        aria-disabled={!googleEnabled}
        onClick={(event) => { if (!googleEnabled) event.preventDefault(); }}
        className={`omb-btn w-full border border-espresso/15 bg-milk text-espresso ${googleEnabled ? "" : "cursor-not-allowed opacity-50"}`}
      >
        <span className="me-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-espresso/15 font-black">G</span>
        {isAr ? "المتابعة بحساب Google" : "Continue with Google"}
      </a>
      {!googleEnabled && <p className="mt-2 text-[11px] leading-5 text-espresso/50">{isAr ? "جاهز برمجياً؛ فعّله بإضافة GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET في .env." : "Implemented; add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable it."}</p>}
      <div className="my-5 flex items-center gap-3 text-[10px] font-black uppercase tracking-[.14em] text-espresso/35"><span className="h-px flex-1 bg-espresso/10"/><span>{isAr ? "أو" : "or"}</span><span className="h-px flex-1 bg-espresso/10"/></div>
      <div className="grid grid-cols-2 border border-espresso/10 bg-milk p-1">
        <button type="button" onClick={() => setMode("login")} className={`px-4 py-3 text-sm font-black ${mode === "login" ? "bg-aubergine text-milk" : "text-espresso"}`}>{isAr ? "تسجيل الدخول" : "Sign in"}</button>
        <button type="button" onClick={() => setMode("register")} className={`px-4 py-3 text-sm font-black ${mode === "register" ? "bg-aubergine text-milk" : "text-espresso"}`}>{isAr ? "إنشاء حساب" : "Create account"}</button>
      </div>

      {mode === "login" ? (
        <form onSubmit={submitLogin} className="mt-6">
          <label className="block text-sm font-black">{isAr ? "البريد الإلكتروني" : "Email"}<input type="email" required value={login.email} onChange={(e) => setLogin((current) => ({ ...current, email: e.target.value }))} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none" placeholder="name@example.com" /></label>
          <label className="mt-5 block text-sm font-black">{isAr ? "كلمة المرور" : "Password"}<input type="password" required value={login.password} onChange={(e) => setLogin((current) => ({ ...current, password: e.target.value }))} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none" /></label>
          <label className="mt-4 flex items-center gap-2 text-xs font-bold text-espresso/60"><input type="checkbox" checked={login.remember} onChange={(e) => setLogin((current) => ({ ...current, remember: e.target.checked }))} />{isAr ? "تذكرني" : "Remember me"}</label>
          <button type="submit" disabled={busy} className="omb-btn omb-btn-primary mt-6 w-full disabled:opacity-40">{busy ? (isAr ? "جاري الدخول..." : "Signing in...") : isAr ? "تسجيل الدخول" : "Sign in"}</button>
        </form>
      ) : (
        <form onSubmit={submitRegister} className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-black">{isAr ? "الاسم" : "Name"}<input required value={register.name} onChange={(e) => setRegister((current) => ({ ...current, name: e.target.value }))} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none" /></label>
            <label className="block text-sm font-black">{isAr ? "رقم الهاتف" : "Phone"}<input required value={register.phone} onChange={(e) => setRegister((current) => ({ ...current, phone: e.target.value }))} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none" /></label>
          </div>
          <label className="mt-4 block text-sm font-black">{isAr ? "البريد الإلكتروني" : "Email"}<input type="email" required value={register.email} onChange={(e) => setRegister((current) => ({ ...current, email: e.target.value }))} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none" /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-black">{isAr ? "كلمة المرور" : "Password"}<input type="password" minLength="8" required value={register.password} onChange={(e) => setRegister((current) => ({ ...current, password: e.target.value }))} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none" /></label>
            <label className="block text-sm font-black">{isAr ? "تأكيد كلمة المرور" : "Confirm password"}<input type="password" minLength="8" required value={register.password_confirmation} onChange={(e) => setRegister((current) => ({ ...current, password_confirmation: e.target.value }))} className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 outline-none" /></label>
          </div>
          <button type="submit" disabled={busy} className="omb-btn omb-btn-primary mt-6 w-full disabled:opacity-40">{busy ? (isAr ? "جاري الإنشاء..." : "Creating...") : isAr ? "إنشاء حساب مشترك" : "Create member account"}</button>
          <p className="mt-3 text-xs leading-6 text-espresso/50">{isAr ? "إنشاء الحساب العام يعطي دور مشترك فقط. Owner / Admin / Delivery لا يتم إنشاؤهم من التسجيل العام." : "Public registration creates Member accounts only. Owner / Admin / Delivery roles are never available from public registration."}</p>
        </form>
      )}
      {message && <p className="mt-4 text-sm font-black text-aubergine">{message}</p>}
    </div>
  );
}
