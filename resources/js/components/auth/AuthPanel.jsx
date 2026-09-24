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
  return "/";
}

function PasswordField({ label, value, onChange, minLength, isAr }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-sm font-black text-espresso">
      {label}
      <div className="mt-2 flex h-12 overflow-hidden border border-espresso/12 bg-milk focus-within:border-aubergine">
        <input
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          value={value}
          onChange={onChange}
          className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="border-s border-espresso/10 px-3 text-xs font-black text-aubergine transition hover:bg-aubergine hover:text-milk"
        >
          {visible ? (isAr ? "إخفاء" : "Hide") : isAr ? "إظهار" : "Show"}
        </button>
      </div>
    </label>
  );
}

function ChoiceCard({ title, body, icon, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group border border-espresso/12 bg-milk p-5 text-start transition hover:-translate-y-1 hover:border-aubergine hover:bg-aubergine hover:text-milk disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
    >
      <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-oat text-lg font-black text-espresso transition group-hover:bg-milk group-hover:text-aubergine">
        {icon}
      </span>
      <strong className="block text-lg font-black">{title}</strong>
      <span className="mt-2 block text-sm font-semibold leading-6 opacity-65">{body}</span>
    </button>
  );
}

export default function AuthPanel({ locale = "ar", compact = false, redirectOnSuccess = true }) {
  const isAr = locale === "ar";

  const [mode, setMode] = useState("choose");
  const [session, setSession] = useState({ loading: true, user: null });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const [login, setLogin] = useState({
    identifier: "",
    password: "",
    remember: true,
  });

  const [register, setRegister] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    password_confirmation: "",
    marketing_opt_in: false,
  });

  useEffect(() => {
    let active = true;

    request("/auth/session", { method: "GET", headers: { "Content-Type": "application/json" } })
      .then((data) => active && setSession({ loading: false, user: data.user || null }))
      .catch(() => active && setSession({ loading: false, user: null }));

    request("/auth/google/status", { method: "GET", headers: { "Content-Type": "application/json" } })
      .then((data) => active && setGoogleEnabled(Boolean(data.enabled)))
      .catch(() => active && setGoogleEnabled(false));

    return () => {
      active = false;
    };
  }, []);

  async function submitLogin(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(login),
      });

      setSession({ loading: false, user: data.user });
      window.dispatchEvent(new CustomEvent("omb:auth-updated"));

      if (redirectOnSuccess) {
        window.location.assign(data.redirect || dashboardForRole(data.user?.role));
      } else {
        setMessage(isAr ? "تم تسجيل الدخول بنجاح." : "Signed in successfully.");
      }
    } catch (error) {
      setMessage(
        isAr
          ? "تعذر تسجيل الدخول. تأكد من رقم الهاتف أو البريد وكلمة المرور."
          : error.message
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const data = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(register),
      });

      setSession({ loading: false, user: data.user });
      window.dispatchEvent(new CustomEvent("omb:auth-updated"));

      setRegister({
        name: "",
        phone: "",
        email: "",
        password: "",
        password_confirmation: "",
        marketing_opt_in: false,
      });

      if (redirectOnSuccess) {
        window.location.assign(data.redirect || dashboardForRole(data.user?.role));
      } else {
        setMessage(isAr ? "تم إنشاء الحساب وتسجيل الدخول." : "Account created and signed in.");
      }
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
      setMode("choose");
      setMessage(isAr ? "تم تسجيل الخروج." : "Signed out.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (session.loading) {
    return (
      <div className="border border-espresso/10 bg-oat/20 p-7 text-sm font-black text-espresso/55">
        {isAr ? "جاري تحميل الحساب..." : "Loading account..."}
      </div>
    );
  }

  if (session.user) {
    const user = session.user;
    const isCustomer = user.role === "customer";
    const isAdminLike = user.role === "owner" || user.role === "admin";

    return (
      <div className={`border border-espresso/10 bg-oat/20 ${compact ? "p-6" : "p-7 sm:p-9"}`}>
        <p className="omb-eyebrow-label text-aubergine/65">SIGNED IN</p>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-espresso">{user.name}</h3>

            <div className="mt-2 grid gap-1 text-sm text-espresso/55">
              {user.phone && <p>{isAr ? "الهاتف: " : "Phone: "}{user.phone}</p>}
              {user.email && <p>{isAr ? "البريد: " : "Email: "}{user.email}</p>}
            </div>
          </div>

          <span className="inline-flex border border-aubergine/20 bg-aubergine/5 px-3 py-1.5 text-xs font-black text-aubergine">
            {roleCopy[user.role]?.[locale] || user.role}
          </span>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {isCustomer && (
            <a href="/" className="omb-btn omb-btn-secondary">
              {isAr ? "متابعة التسوق" : "Continue shopping"}
            </a>
          )}

          {isAdminLike && (
            <a href="/" className="omb-btn omb-btn-secondary">
              {isAr ? "العودة للموقع" : "Back to storefront"}
            </a>
          )}

          <a href={dashboardForRole(user.role)} className="omb-btn omb-btn-primary">
            {user.role === "owner"
              ? isAr ? "لوحة المالك" : "Owner dashboard"
              : user.role === "admin"
                ? isAr ? "لوحة الإدمن" : "Admin dashboard"
                : user.role === "delivery"
                  ? isAr ? "لوحة التوصيل" : "Delivery dashboard"
                  : isAr ? "حسابي وطلباتي" : "My account"}
          </a>

          {isCustomer && (
            <a href="/wishlist" className="omb-btn omb-btn-secondary">
              {isAr ? "المفضلة" : "Wishlist"}
            </a>
          )}

          {isCustomer && (
            <a href="/cart" className="omb-btn omb-btn-secondary">
              {isAr ? "السلة" : "Bag"}
            </a>
          )}

          {isAdminLike && (
            <a href="/admin/orders" className="omb-btn omb-btn-secondary">
              {isAr ? "الطلبات" : "Orders"}
            </a>
          )}
        </div>

        <div className="mt-6 border-t border-espresso/10 pt-5">
          <p className="text-xs leading-6 text-espresso/55">
            {isCustomer
              ? isAr
                ? "طلباتك، حالتها، السائق عند التعيين، والكوبونات التي فتحتها تظهر ضمن صفحة الحساب."
                : "Your orders, live status, assigned driver and unlocked coupons are available in the account page."
              : user.role === "delivery"
                ? isAr
                  ? "حساب التوصيل مخصص للداشبورد فقط."
                  : "Delivery accounts are intended for the delivery dashboard only."
                : isAr
                  ? "الدور والصلاحية مفعّلان من الـBackend، وليسا مجرد إخفاء أزرار بالواجهة."
                  : "The role and route permissions are enforced by the backend, not only hidden in the UI."}
          </p>

          <button
            type="button"
            disabled={busy}
            onClick={logout}
            className="mt-4 text-sm font-black text-aubergine underline disabled:opacity-40"
          >
            {isAr ? "تسجيل الخروج" : "Sign out"}
          </button>
        </div>

        {message && <p className="mt-4 text-sm font-black text-aubergine">{message}</p>}
      </div>
    );
  }

  return (
    <div className={`border border-espresso/10 bg-oat/20 ${compact ? "p-6" : "p-7 sm:p-9"}`}>
      {mode !== "choose" && (
        <button
          type="button"
          onClick={() => {
            setMode("choose");
            setMessage("");
          }}
          className="mb-5 text-sm font-black text-aubergine underline"
        >
          {isAr ? "رجوع لاختيار طريقة الدخول" : "Back to account options"}
        </button>
      )}

      {mode === "choose" && (
        <>
          <div className="grid gap-3">
            <ChoiceCard
              icon="↗"
              title={isAr ? "تسجيل الدخول" : "Sign in"}
              body={isAr ? "ادخل برقم الهاتف أو البريد وكلمة المرور." : "Use phone/email and password."}
              onClick={() => setMode("login")}
            />

            <ChoiceCard
              icon="+"
              title={isAr ? "إنشاء حساب" : "Create account"}
              body={isAr ? "حساب OH MY BABY برقم الهاتف." : "Create an OH MY BABY phone account."}
              onClick={() => setMode("register")}
            />

            <ChoiceCard
              icon="G"
              title={isAr ? "الدخول عبر Google" : "Continue with Google"}
              body={
                googleEnabled
                  ? isAr ? "دخول سريع بدون كلمة مرور جديدة." : "Fast sign in without a new password."
                  : isAr ? "غير مفعّل حالياً من إعدادات الموقع." : "Not enabled in site settings yet."
              }
              disabled={!googleEnabled}
              onClick={() => {
                if (googleEnabled) window.location.href = "/auth/google/redirect";
              }}
            />
          </div>

          {!googleEnabled && (
            <p className="mt-4 text-[11px] leading-5 text-espresso/50">
              {isAr
                ? "Google جاهز برمجياً، لكنه يحتاج GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET داخل .env."
                : "Google is implemented, but GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be added to .env."}
            </p>
          )}
        </>
      )}

      {mode === "login" && (
        <form onSubmit={submitLogin} className="mt-1">
          <h3 className="text-2xl font-black text-espresso">
            {isAr ? "تسجيل الدخول" : "Sign in"}
          </h3>

          <p className="mt-2 text-sm font-semibold leading-6 text-espresso/55">
            {isAr
              ? "استخدم رقم الهاتف أو البريد الإلكتروني."
              : "Use your phone number or email address."}
          </p>

          <label className="mt-6 block text-sm font-black text-espresso">
            {isAr ? "رقم الهاتف أو البريد الإلكتروني" : "Phone number or email"}
            <input
              type="text"
              required
              value={login.identifier}
              onChange={(event) => setLogin((current) => ({ ...current, identifier: event.target.value }))}
              className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 text-sm font-semibold outline-none focus:border-aubergine"
              placeholder={isAr ? "09xxxxxxxx أو name@example.com" : "09xxxxxxxx or name@example.com"}
            />
          </label>

          <div className="mt-5">
            <PasswordField
              label={isAr ? "كلمة المرور" : "Password"}
              value={login.password}
              onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))}
              isAr={isAr}
            />
          </div>

          <label className="mt-4 flex items-center gap-2 text-xs font-bold text-espresso/60">
            <input
              type="checkbox"
              checked={login.remember}
              onChange={(event) => setLogin((current) => ({ ...current, remember: event.target.checked }))}
            />
            {isAr ? "تذكرني" : "Remember me"}
          </label>

          <button type="submit" disabled={busy} className="omb-btn omb-btn-primary mt-6 w-full disabled:opacity-40">
            {busy ? (isAr ? "جاري الدخول..." : "Signing in...") : isAr ? "تسجيل الدخول" : "Sign in"}
          </button>
        </form>
      )}

      {mode === "register" && (
        <form onSubmit={submitRegister} className="mt-1">
          <h3 className="text-2xl font-black text-espresso">
            {isAr ? "إنشاء حساب" : "Create account"}
          </h3>

          <p className="mt-2 text-sm font-semibold leading-6 text-espresso/55">
            {isAr
              ? "الحساب يعتمد على رقم الهاتف. البريد الإلكتروني اختياري."
              : "Your account uses your phone number. Email is optional."}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-black text-espresso">
              {isAr ? "الاسم" : "Name"}
              <input
                required
                value={register.name}
                onChange={(event) => setRegister((current) => ({ ...current, name: event.target.value }))}
                className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 text-sm font-semibold outline-none focus:border-aubergine"
                placeholder={isAr ? "اسمك" : "Your name"}
              />
            </label>

            <label className="block text-sm font-black text-espresso">
              {isAr ? "رقم الهاتف" : "Phone number"}
              <input
                type="tel"
                required
                value={register.phone}
                onChange={(event) => setRegister((current) => ({ ...current, phone: event.target.value }))}
                className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 text-sm font-semibold outline-none focus:border-aubergine"
                placeholder={isAr ? "مثال: 09xxxxxxxx" : "Example: 09xxxxxxxx"}
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-black text-espresso">
            {isAr ? "البريد الإلكتروني — اختياري" : "Email — optional"}
            <input
              type="email"
              value={register.email}
              onChange={(event) => setRegister((current) => ({ ...current, email: event.target.value }))}
              className="mt-2 h-12 w-full border border-espresso/12 bg-milk px-4 text-sm font-semibold outline-none focus:border-aubergine"
              placeholder="name@example.com"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <PasswordField
              label={isAr ? "كلمة المرور" : "Password"}
              value={register.password}
              minLength={8}
              onChange={(event) => setRegister((current) => ({ ...current, password: event.target.value }))}
              isAr={isAr}
            />

            <PasswordField
              label={isAr ? "تأكيد كلمة المرور" : "Confirm password"}
              value={register.password_confirmation}
              minLength={8}
              onChange={(event) => setRegister((current) => ({ ...current, password_confirmation: event.target.value }))}
              isAr={isAr}
            />
          </div>

          <label className="mt-5 flex items-start gap-3 border border-espresso/10 bg-milk p-4 text-sm font-bold leading-6 text-espresso/70">
            <input
              type="checkbox"
              checked={register.marketing_opt_in}
              onChange={(event) => setRegister((current) => ({ ...current, marketing_opt_in: event.target.checked }))}
              className="mt-1"
            />
            <span>
              {isAr
                ? "أوافق على استلام العروض والتحديثات من OH MY BABY عبر معلومات التواصل الخاصة بي."
                : "I agree to receive offers and updates from OH MY BABY using my contact details."}
            </span>
          </label>

          <button type="submit" disabled={busy} className="omb-btn omb-btn-primary mt-6 w-full disabled:opacity-40">
            {busy ? (isAr ? "جاري الإنشاء..." : "Creating...") : isAr ? "إنشاء حساب" : "Create account"}
          </button>

          <p className="mt-3 text-xs leading-6 text-espresso/50">
            {isAr
              ? "إنشاء الحساب العام يعطي دور مشترك فقط. حسابات Owner / Admin / Delivery لا تُنشأ من التسجيل العام."
              : "Public registration creates Member accounts only. Owner / Admin / Delivery roles are never available from public registration."}
          </p>
        </form>
      )}

      {message && (
        <p className="mt-4 border border-aubergine/15 bg-aubergine/5 p-3 text-sm font-black text-aubergine">
          {message}
        </p>
      )}
    </div>
  );
}