# Team C_datasheet-SubTracker

A lightweight subscription tracker web app (target price: $4.99).

## Features
- Add subscriptions with cost, billing cycle (weekly / monthly / yearly), next renewal date and category
- Total cost per month and per year, normalized across billing cycles
- Upcoming renewals (next 7 days) highlighted yellow; overdue in red
- Export to CSV
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
