# Team C_datasheet-SubTracker

A lightweight subscription tracker web app (target price: $4.99).

## Features
- Add subscriptions with cost, billing cycle (weekly / monthly / yearly), next renewal date and category
- Total cost per month and per year, normalized across billing cycles
- Upcoming renewals (next 7 days) highlighted yellow; overdue in red
- Export to CSV, JSON backup & restore
- Edit, pause/resume, search, "Renewed" button for overdue items
- Multiple currencies, dark mode, spending-by-category chart, mobile layout
- Data stays private in your browser (localStorage), no account or server needed

## Run
Open `index.html` in any modern browser, or serve the folder:
```
python3 -m http.server 8000
```
then visit http://localhost:8000

## Files
- `index.html` – UI
- `app.js` – logic (storage, totals, renewal flags, CSV export)

## Pro (v1.1): trials & reminders
- Mark a subscription as a **free trial**; its date becomes the cancel-by date, with a TRIAL badge and a "Cancel soon" banner
- Per-subscription reminder lead time (1, 3 or 7 days)
- "Enable reminders" turns on browser notifications for upcoming renewals and trial cancel-by dates
