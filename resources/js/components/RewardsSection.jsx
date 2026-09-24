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
        ["01", "اطلب", "كل طلب مكتمل بيقرّبك خطوة من مكافأتك."],
        ["02", "تابع", "شوف تقدمك ببساطة وبدون تعقيد."],
        ["03", "استفد", "لما توصل للمستوى المطلوب، بتفتح مكافأتك."],
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
  const availableRewards = isCustomer
    ? (member.rewards?.coupons || []).filter((coupon) => coupon?.status === "available")
    : [];
  const rewardUnlocked = availableRewards.length > 0;

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
                  <>كل طلب بيقرّبك<br />من مكافأة أحلى.</>
                ) : (
                  <>Order. Progress.<br />Unlock your reward.</>
                )}
              </h2>

              <p className="omb-rewards-intro">
                {isAr
                  ? "أنشئ حسابك وخلي كل طلب محسوب. بعد تسجيل الدخول بيظهر تقدمك الحقيقي ومكافآتك الفعلية بشكل واضح وبسيط."
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
                  : (isAr ? "أنشئ حسابك وابدأ" : "Create an account and start")}
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
                        : (isAr ? "مكافآتك معنا" : "Rewards program")}
                    </strong>
                  </div>
                  <span className="omb-rewards-level-mark">{isCustomer ? "✓" : "+"}</span>
                </div>

                {isCustomer ? (
                  <>
                    <div className="omb-rewards-level-copy">
                      <span>{isAr ? "تقدمك نحو المستوى التالي" : "Progress to your next level"}</span>
                      <h3>
                        {progress.next
                          ? (isAr
                              ? `الطلب ${progress.delivered} من أصل ${progress.next}`
                              : `Order ${progress.delivered} of ${progress.next}`)
                          : (isAr ? `${progress.delivered} طلب مكتمل` : `${progress.delivered} completed orders`)}
                      </h3>
                    </div>

                    {progress.next ? (
                      <>
                        <div className="omb-rewards-progress-row">
                          <strong>
                            {isAr
                              ? `أنت حالياً عند الطلب رقم ${progress.delivered} من أصل ${progress.next}`
                              : `You are currently on order ${progress.delivered} of ${progress.next}`}
                          </strong>
                          <span>
                            {isAr
                              ? `باقي ${progress.remaining}`
                              : `${progress.remaining} remaining`}
                          </span>
                        </div>
                        <div className="omb-rewards-progress" aria-hidden="true">
                          <span style={{ width: `${progress.percent}%` }} />
                        </div>
                      </>
                    ) : null}

                    {rewardUnlocked ? (
                      <div className="omb-rewards-next omb-rewards-prize-ready">
                        <span>{isAr ? "وصلت لمرحلة مكافأة" : "Reward milestone reached"}</span>
                        <strong>{isAr ? "لديك جائزة 🎁" : "You have a reward 🎁"}</strong>
                      </div>
                    ) : (
                      <div className="omb-rewards-next">
                        <span>{isAr ? "الجائزة تبقى مفاجأة" : "The reward stays a surprise"}</span>
                        <strong>
                          {progress.next
                            ? (isAr
                                ? `أكمل ${progress.remaining} ${progress.remaining === 1 ? "طلب" : "طلبات"} لتحصل على جائزتك وتنتقل للمستوى التالي.`
                                : `Complete ${progress.remaining} more ${progress.remaining === 1 ? "order" : "orders"} to unlock your reward and move to the next level.`)
                            : (isAr ? "أنجزت جميع المستويات الحالية." : "You completed all current levels.")}
                        </strong>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="omb-rewards-level-copy">
                      <span>{isAr ? "أول مكافأة" : "First level"}</span>
                      <h3>{isAr ? "5 طلبات" : "5 orders"}</h3>
                    </div>
                    <div className="omb-rewards-next">
                      <span>{isAr ? "تقدم حقيقي بدون أرقام وهمية" : "Real progress, no fake numbers"}</span>
                      <strong>
                        {isAr
                          ? "بعد تسجيل الدخول، منشوف تقدمك الحقيقي، وكل طلب مكتمل بيقرّبك من المكافأة الجاية."
                          : "After sign-in, you'll see your current order number out of 5, and your progress updates automatically after each completed order."}
                      </strong>
                    </div>
                  </>
                )}
              </div>
              <p className="omb-rewards-footnote">
                {member.loading
                  ? (isAr ? "جاري التحقق من الحساب..." : "Checking account...")
                  : isCustomer
                    ? (isAr ? "هذه أرقام حسابك الحقيقية وليست مثالاً توضيحياً." : "These are your real account numbers, not a demo.")
                    : (isAr ? "سجّل دخولك لتشوف تقدمك الحقيقي ومكافآتك." : "Visitors see the program explanation only—no fake progress.")}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
