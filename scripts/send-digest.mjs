/**
 * Weekly Gift Planner digest email.
 *
 * Reads the shared Firestore household document, groups upcoming birthdays
 * into urgent / upcoming / sorted buckets (same logic as the in-app digest),
 * and emails the summary to all household members via Gmail.
 *
 * Required environment variables (set as GitHub Actions secrets):
 *   FIREBASE_SERVICE_ACCOUNT  — JSON string of the Firebase service account key
 *   GMAIL_APP_PASSWORD        — Gmail App Password for smithdk44@gmail.com
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import nodemailer from "nodemailer";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PROJECT_ID = "gift-planner-a342b";
const HOUSEHOLD_ID = "main";
const SENDER_EMAIL = "smithdk44@gmail.com";
const RECIPIENTS = ["smithdk44@gmail.com", "megan.howe@live.com.au"];
const APP_URL = "https://dwayno44.github.io/gift-planning/";

// ---------------------------------------------------------------------------
// Firebase Admin init
// ---------------------------------------------------------------------------

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
const db = getFirestore();

// ---------------------------------------------------------------------------
// Digest logic (mirrors src/utils/birthdayUtils.ts + statusUtils.ts)
// ---------------------------------------------------------------------------

function daysUntilBirthday(birthdayStr, from = new Date()) {
  const [, month, day] = birthdayStr.split("-").map(Number);
  const year = from.getFullYear();
  let next = new Date(year, month - 1, day);
  if (next <= from) next = new Date(year + 1, month - 1, day);
  return Math.ceil((next - from) / 86_400_000);
}

function formatBirthdayShort(birthdayStr) {
  const [, month, day] = birthdayStr.split("-").map(Number);
  return new Date(2000, month - 1, day).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function relativeBirthdayLabel(birthdayStr, from = new Date()) {
  const days = daysUntilBirthday(birthdayStr, from);
  if (days === 0) return "Today! 🎂";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days} days`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks !== 1 ? "s" : ""}`;
}

function deriveStatus(person) {
  const ideas = person.giftIdeas ?? [];
  const active = ideas.filter((i) => i.status !== "rejected");
  const hasPurchase =
    ideas.some((i) => i.status === "purchased") || !!person.purchasedGift?.trim();
  const hasExplored = active.some(
    (i) => i.status === "exploring" || i.status === "shortlisted" || !!i.purchaseUrl
  );

  if (person.birthdayMessageSent) return { label: "Message sent", tone: "green" };
  if (person.readyToGive) return { label: "Wrapped / ready", tone: "green" };
  if (hasPurchase) return { label: "Purchased", tone: "green" };
  if (hasExplored) return { label: "Options explored", tone: "amber" };
  if (active.length > 0) return { label: "Ideas saved", tone: "amber" };
  return { label: "No ideas yet", tone: "red" };
}

function buildDigest(people, from = new Date()) {
  const WEEKS = 6;
  const cutoffDays = WEEKS * 7;

  const within6 = people.filter(
    (p) => !p.archived && daysUntilBirthday(p.birthday, from) <= cutoffDays
  );

  const urgent = [];
  const upcoming = [];
  const sorted = [];

  for (const p of within6) {
    const { tone } = deriveStatus(p);
    const days = daysUntilBirthday(p.birthday, from);
    if (tone === "green") {
      sorted.push({ person: p, days });
    } else if (days <= 28) {
      urgent.push({ person: p, days });
    } else {
      upcoming.push({ person: p, days });
    }
  }

  const byDays = (a, b) => a.days - b.days;
  urgent.sort(byDays);
  upcoming.sort(byDays);
  sorted.sort(byDays);

  return { urgent, upcoming, sorted };
}

// ---------------------------------------------------------------------------
// Email HTML builder
// ---------------------------------------------------------------------------

const TONE_COLORS = {
  red: { bg: "#FEE2E2", text: "#DC2626", dot: "#DC2626" },
  amber: { bg: "#FEF3C7", text: "#D97706", dot: "#D97706" },
  green: { bg: "#D1FAE5", text: "#059669", dot: "#059669" },
};

function personRow(person, days) {
  const { label, tone } = deriveStatus(person);
  const col = TONE_COLORS[tone];
  return `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #F3F4F6;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-weight: 600; color: #111827; font-size: 15px;">${person.name}</div>
              <div style="color: #6B7280; font-size: 13px; margin-top: 2px;">
                🎂 ${formatBirthdayShort(person.birthday)}
                &nbsp;·&nbsp;
                ${relativeBirthdayLabel(person.birthday)}
              </div>
            </td>
            <td align="right" style="white-space: nowrap;">
              <span style="
                display: inline-block;
                background: ${col.bg};
                color: ${col.text};
                border-radius: 99px;
                padding: 3px 10px;
                font-size: 12px;
                font-weight: 600;
              ">${label}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function section(emoji, title, hint, rows, accentColor) {
  if (rows.length === 0) return "";
  return `
    <tr>
      <td style="padding: 24px 0 8px;">
        <div style="font-size: 16px; font-weight: 700; color: #111827;">
          ${emoji} ${title}
          <span style="font-weight: 400; color: #6B7280; font-size: 13px; margin-left: 6px;">${rows.length}</span>
        </div>
        <div style="font-size: 13px; color: #9CA3AF; margin-top: 2px;">${hint}</div>
      </td>
    </tr>
    <tr>
      <td style="background: #fff; border-radius: 12px; border: 1px solid #E5E7EB; padding: 0 16px; overflow: hidden;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${rows.map(({ person, days }) => personRow(person, days)).join("")}
        </table>
      </td>
    </tr>`;
}

function buildEmail(digest, today) {
  const { urgent, upcoming, sorted } = digest;
  const total = urgent.length + upcoming.length + sorted.length;
  const dateStr = today.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });

  const bodyContent =
    total === 0
      ? `<tr><td style="padding: 24px; text-align: center; color: #6B7280;">
           <div style="font-size: 32px;">🌿</div>
           <div style="font-weight: 600; color: #111827; margin-top: 8px;">Nothing on the horizon</div>
           <div style="font-size: 14px; margin-top: 4px;">No birthdays in the next 6 weeks. You're ahead of the game.</div>
         </td></tr>`
      : `
        ${section("🔴", "Needs attention now", "Birthdays within 4 weeks — not sorted yet", urgent, "#DC2626")}
        ${section("🟡", "Coming up soon", "Birthdays within 6 weeks", upcoming, "#D97706")}
        ${section("✅", "Already sorted", "Gift ready to go", sorted, "#059669")}
      `;

  const subjectCount = urgent.length > 0 ? ` — ${urgent.length} need${urgent.length === 1 ? "s" : ""} attention` : "";

  return {
    subject: `🎁 Gift Planner Weekly Digest${subjectCount}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F9FAFB; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 560px;" cellpadding="0" cellspacing="0">

          <!-- Header -->
          <tr>
            <td style="background: #fff; border-radius: 16px 16px 0 0; border: 1px solid #E5E7EB; border-bottom: none; padding: 24px 24px 20px;">
              <div style="font-size: 22px; font-weight: 800; color: #111827;">🎁 Gift Planner</div>
              <div style="font-size: 14px; color: #6B7280; margin-top: 4px;">Weekly digest · ${dateStr}</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background: #F9FAFB; border: 1px solid #E5E7EB; border-top: none; border-bottom: none; padding: 0 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${bodyContent}
                <tr><td style="height: 24px;"></td></tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #fff; border-radius: 0 0 16px 16px; border: 1px solid #E5E7EB; border-top: none; padding: 16px 24px; text-align: center;">
              <a href="${APP_URL}" style="display: inline-block; background: #4F46E5; color: #fff; text-decoration: none; border-radius: 8px; padding: 10px 24px; font-weight: 600; font-size: 14px;">
                Open Gift Planner →
              </a>
              <div style="font-size: 12px; color: #9CA3AF; margin-top: 12px;">
                Sent weekly to household members · <a href="${APP_URL}" style="color: #9CA3AF;">manage in the app</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const snap = await db.doc(`households/${HOUSEHOLD_ID}`).get();
if (!snap.exists) {
  console.log("No household document found — skipping digest.");
  process.exit(0);
}

const data = snap.data();
const people = (data.people ?? []).filter((p) => !p.archived);
const today = new Date();
const digest = buildDigest(people, today);
const total = digest.urgent.length + digest.upcoming.length + digest.sorted.length;

const { subject, html } = buildEmail(digest, today);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SENDER_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

await transporter.sendMail({
  from: `"Gift Planner" <${SENDER_EMAIL}>`,
  to: RECIPIENTS.join(", "),
  subject,
  html,
});

console.log(`Digest sent to ${RECIPIENTS.join(", ")} — ${digest.urgent.length} urgent, ${digest.upcoming.length} upcoming, ${digest.sorted.length} sorted.`);
