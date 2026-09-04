# Student Study Planner & Grade Dashboard

Version 2 branch (v2) adds a dashboard, grades, overdue detection, inline complete toggles, sorting and filtering. Work is isolated on the `v2` branch; Version 1 is preserved on the `v1.0` branch.

How to run locally:
1. git clone https://github.com/AJ7971/AJ-Davis
2. git switch v2
3. Open index.html in a browser or serve with a simple static server: python -m http.server 8000

Storage / migration:
- v2 uses localStorage key `studyPlannerData_v2`. If it doesn't exist but a v1 key (`studyPlannerData_v1`) exists, the app will migrate assignments and preserve existing data, adding `grade` fields.
