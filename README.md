# 🎁 Gift Planner

A calm, mobile-first web app for a couple to plan birthday gifts for friends and
family all year round — capture ideas as they come, see who's coming up, and
never scramble at the last minute again.

It's built to be **low-overwhelm**: cards instead of spreadsheets, colour + words
for every status, one obvious next action per person, and an editing experience
simple enough to use one-handed on a phone.

---

## Running the app

You'll need [Node.js](https://nodejs.org/) 18 or newer.

```bash
cd gift-planner
npm install      # first time only
npm run dev      # start the local dev server
```

Then open the URL it prints (usually <http://localhost:5173>). On your phone, open
the same URL using your computer's local network address (Vite prints this too if
you run `npm run dev -- --host`).

To build a production bundle:

```bash
npm run build    # output in dist/
npm run preview  # preview the production build
```

The app works offline and stores everything **privately on your device** — there's
no account, no server, and nothing leaves your phone unless you export it.

---

## Updating data in the app (no coding needed)

Everything below is done by tapping, from the phone:

| You want to… | How |
| --- | --- |
| Add someone | **Birthdays → + Add** (name + birthday is all you need) |
| Edit someone | Tap their card → **Edit details** |
| Capture a gift idea | Tap their card → **+ Add idea** (just a title is fine) |
| Paste a purchase link | In the idea form, paste into **"Paste a link"** |
| Mark a gift bought | On an idea, tap **Mark purchased** |
| Mark it wrapped / message sent | Tap their card → **Finishing touches** |
| Set a birthday reminder | Tap their card → **Add birthday message reminder** |
| Archive someone | Tap their card → **Archive** (restore later in Settings) |
| Manage gift themes | **Settings → Gift themes** |

Forms accept **partial entries** — save a rough thought now, fill in details later.
Extra fields hide behind **"+ Add more details"** so screens stay uncluttered.

---

## Export / import (and the "Codex" fallback)

Open **Settings → Backup & data**:

- **Export backup (JSON)** — downloads a `.json` file with everything. Keep it
  somewhere safe or move it to another device.
- **Copy data to clipboard** — same data, ready to paste anywhere.
- **Import from file…** — loads a `.json` backup, replacing current data.

This JSON is the shared format between the two of you. If one partner is comfortable
with Codex/coding, they can generate or bulk-edit the JSON (e.g. add ten people at
once) and the other simply **imports the file** — no code required on the phone.

---

## How the status colours work

Each person's tile shows a colour **and** a word — never colour alone — based on how
far along their gift is. The status is **derived automatically** from the ideas and
purchases you record, so there's nothing extra to keep in sync.

| Colour | Meaning | Shown as |
| --- | --- | --- |
| 🔴 Red | No ideas captured yet | "No ideas yet" |
| 🟠 Amber | Ideas/options exist, nothing bought | "Ideas saved" / "Options explored" |
| 🟢 Green | Bought or fully sorted | "Purchased" / "Wrapped / ready" / "Message sent" |

The **Weekly Digest** uses the same statuses to group upcoming birthdays into
*Needs attention now* (within 4 weeks, not sorted), *Coming up soon* (within 6
weeks), and *Already sorted*.

---

## Calendar reminders

Each person has an **Add birthday message reminder** button that downloads a
standard `.ics` calendar file ("Send birthday message to [Name]", on their birthday,
repeating yearly). Open it on your phone to add it to Apple Calendar, Google
Calendar, or Outlook. No account linking required.

---

## Project structure

```
src/
  components/   PersonCard, GiftIdeaCard, StatusBadge, WeeklyDigest,
                PersonForm, GiftIdeaForm, CalendarReminderButton, PersonDetail, Modal
  pages/        BirthdaysPage, WeeklyDigestPage, SettingsPage, ChristmasPage
  context/      AppContext  (the data-layer seam — the only path to storage)
  data/         storage.ts (LocalStorage today), sampleData.ts
  types/        index.ts (the single source of truth for the data model)
  utils/        birthdayUtils, statusUtils, calendarUtils, id
```

The data layer is deliberately **abstracted**: components never touch storage
directly, and no people are hardcoded in UI. Swapping LocalStorage for IndexedDB,
Supabase, Firebase, Airtable or Notion is a change to `storage.ts` + `AppContext`
only.

---

## Suggested future enhancements

1. **Christmas planning page** — per-recipient gift tracking (route already stubbed).
2. Shared household login.
3. Cloud sync across both phones.
4. Weekly **email digest** (the digest grouping logic is already reusable).
5. Push notifications.
6. Google / Outlook calendar integration (the reminder logic is structured for it).
7. AI-assisted gift suggestions.
8. Budget tracking and totals.
9. Gift history by year + "do not buy again" notes.
10. Separate views for birthdays, Christmas, anniversaries and other events.

---

Made to feel **calm, organised, friendly, and family-focused** — a friendly planning
dashboard, not a project-management tool.
