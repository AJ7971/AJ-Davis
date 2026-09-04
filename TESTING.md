# TESTING.md

Version 1 tests (already completed on main / v1.0 branch)
- Add/Edit/Delete courses and assignments, persistence via localStorage.

Version 2 tests (run on v2 branch or after switching to v2 branch):

Test scenario (from your spec):
1) Create 5 assignments
   - Use the UI to add 5 assignments (they can be across courses or no-course)
2) Complete 2 assignments
   - Use 'Mark Complete' on two items
3) Make 1 unfinished assignment overdue
   - Set its due date to a past date (e.g., 2020-01-01) and ensure it remains unfinished
4) Give grades to only 3 assignments
   - Use the inline grade input to add numeric grades to any 3 assignments

Verify dashboard shows:
- Total = 5
- Completed = 2
- Remaining = 3
- Overdue = 1
- Average uses only the 3 graded assignments (displayed under Average)

After running the steps above, save the TEST REPORT here with timestamps and notes.
