import React, { useEffect, useMemo, useState } from "react";
import Reveal from "./ui/Reveal";

async function getJson(url) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

export default function RewardsSection({ locale = "ar" }) {
  const isAr = locale === "ar";
  const [member, setMember] = useState({ loading: true, user: null, rewards: null });

  const steps = isAr
    ? [
        ["01", "اطلب", "كل طلب مكتمل ينحسب تلقائياً بحسابك."],
        ["02", "اقترب", "شوف تقدمك بوضوح بدون نقاط أو تفاصيل معقدة."],
        ["03", "استفد", "لما توصل للمستوى المطلوب بتنفتح مكافأتك."],
      ]
    : [
        ["01", "Order", "Every completed order is counted automatically."],
        ["02", "Progress", "See exactly how close you are to the next reward."],
        ["03", "Enjoy", "Reach the milestone and unlock your reward."],
      ];

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const session = await getJson("/auth/session");
        if (!active) return;
        if (!session.user || session.user.role !== "customer") {
          setMember({ loading: false, user: session.user || null, rewards: null });
          return;
        }
        const overview = await getJson("/api/account/overview");
        if (active) setMember({ loading: false, user: overview.user, rewards: overview.rewards });
      } catch {
        if (active) setMember({ loading: false, user: null, rewards: null });
      }
    };

    load();
    window.addEventListener("omb:auth-updated", load);
    return () => {
      active = false;
      window.removeEventListener("omb:auth-updated", load);
    };
  }, []);

  const progress = useMemo(() => {
    const delivered = Number(member.rewards?.delivered_orders || 0);
    const next = Number(member.rewards?.next_threshold || 0);
    if (!member.rewards || !next) return { delivered, next, remaining: 0, percent: member.rewards ? 100 : 0 };
    // Progress inside the current milestone, with first milestone beginning at zero.
    const previous = delivered >= 20 ? 20 : delivered >= 10 ? 10 : delivered >= 5 ? 5 : 0;
    const span = Math.max(1, next - previous);
    const percent = Math.max(0, Math.min(100, ((delivered - previous) / span) * 100));
    return { delivered, next, remaining: Math.max(0, next - delivered), percent };
  }, [member.rewards]);

  const isCustomer = member.user?.role === "customer" && member.rewards;

  return (
    <section className="omb-rewards-section py-20 sm:py-28" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-10">
        <Reveal>
          <div className="omb-rewards-panel">
            <div className="omb-rewards-copy">
              <div className="omb-rewards-eyebrow">
                <span className="omb-rewards-dot" />
                <span>{isAr ? "مكافآت OH MY BABY" : "OH MY BABY REWARDS"}</span>
              </div>

              <h2>
                {isAr ? (
                  <>اطلب. اقترب.<br />وخد مكافأتك.</>
                ) : (
                  <>Order. Progress.<br />Unlock your reward.</>
                )}
              </h2>

              <p className="omb-rewards-intro">
                {isAr
                  ? "هذا القسم ظاهر حتى للزائر ليعرف فائدة إنشاء الحساب. بعد تسجيل الدخول يتحول الجزء المقابل تلقائياً لتقدمك الحقيقي ومكافآتك الفعلية."
                  : "Visitors can see how the program works. After sign-in, the panel automatically switches to your real progress and unlocked rewards."}
              </p>

              <div className="omb-rewards-steps">
                {steps.map(([number, title, body]) => (
                  <div className="omb-rewards-step" key={number}>
                    <span>{number}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a href={isCustomer ? "/account" : "/#account"} className="omb-rewards-cta">
                {isCustomer
                  ? (isAr ? "افتح حسابي ومكافآتي" : "Open my account & rewards")
                  : (isAr ? "أنشئ حساب وابدأ من أول طلب" : "Create an account and start")}
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            <div className="omb-rewards-card-wrap">
              <div className="omb-rewards-card">
                <div className="omb-rewards-card-top">
                  <div>
                    <span className="omb-rewards-card-kicker">OH MY BABY</span>
                    <strong>
                      {isCustomer
                        ? (isAr ? `مرحباً ${member.user.name}` : `Welcome ${member.user.name}`)
                        : (isAr ? "برنامج المكافآت" : "Rewards program")}
                    </strong>
                  </div>
                  <span className="omb-rewards-level-mark">{isCustomer ? "✓" : "+"}</span>
                </div>

                {isCustomer ? (
                  <>
                    <div className="omb-rewards-level-copy">
                      <span>{isAr ? "طلباتك المكتملة" : "Delivered orders"}</span>
                      <h3>{progress.delivered}</h3>
                    </div>
                    <div className="omb-rewards-progress-row">
                      <strong>
                        {progress.next
                          ? (isAr ? `${progress.remaining} طلب للمكافأة التالية` : `${progress.remaining} orders to next reward`)
                          : (isAr ? "وصلت لكل المستويات الحالية" : "All current levels reached")}
                      </strong>
                      <span>{Math.round(progress.percent)}%</span>
                    </div>
                    <div className="omb-rewards-progress">
                      <span style={{ width: `${progress.percent}%` }} />
                    </div>
                    <div className="omb-rewards-next">
                      <span>{isAr ? "المكافآت المفتوحة" : "Unlocked rewards"}</span>
                      <strong>{member.rewards?.coupons?.length || 0}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="omb-rewards-level-copy">
                      <span>{isAr ? "ابدأ من أول طلب" : "Start with your first order"}</span>
                      <h3>{isAr ? "حسابك يحفظ تقدمك" : "Your account saves progress"}</h3>
                    </div>
                    <div className="omb-rewards-next">
                      <span>{isAr ? "أمثلة المستويات" : "Example milestones"}</span>
                      <strong>{isAr ? "5 طلبات → خصم 5% · 10 طلبات → خصم 10%" : "5 orders → 5% off · 10 orders → 10% off"}</strong>
                    </div>
                  </>
                )}
              </div>
              <p className="omb-rewards-footnote">
                {member.loading
                  ? (isAr ? "جاري التحقق من الحساب..." : "Checking account...")
                  : isCustomer
                    ? (isAr ? "هذه أرقام حسابك الحقيقية وليست مثالاً توضيحياً." : "These are your real account numbers, not a demo.")
                    : (isAr ? "الزائر يرى شرح البرنامج فقط، بدون تقدم وهمي." : "Visitors see the program explanation only—no fake progress.")}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
