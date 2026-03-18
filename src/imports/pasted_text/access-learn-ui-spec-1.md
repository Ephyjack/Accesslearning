Upgrade and extend the existing UI design for a web application called **Access Learn**. Do NOT redesign from scratch. Build on the current layout and style.

Access Learn is an AI-powered online classroom and educational community platform. The system includes persistent classrooms, teacher-controlled access, and community-based learning.

Maintain the existing design style:

* Modern SaaS dashboard
* Deep blue, white, and light purple accents
* Clean layout, rounded cards, smooth shadows
* Minimal and highly intuitive UI

Add the following NEW FEATURES and UI components:

---

1. USER ONBOARDING FLOW (NEW SCREENS)

Before accessing dashboards, users must complete a profile:

For Teachers:

* Country selector
* School name input
* ID number input
* Role confirmation (Teacher)
* Profile avatar upload

For Students:

* Country selector
* School name input
* Role confirmation (Student)
* Profile avatar upload

Include a progress step UI (Step 1 of 2, etc.)

---

2. COMMUNITY SYSTEM (LIKE DISCORD / TELEGRAM)

Add a left sidebar for Communities:

* List of joined communities
* “+ Create Community” button
* “Join with Code” option

Community Types:

* Public communities
* Private communities (locked icon)
* School-based communities

Inside a Community:

* Channel list (General, Classes, Announcements)
* Member list panel
* Role badges (Teacher, Student, Admin)

Restrict UI:

* Students cannot see teacher-only groups
* Teacher-only channels are visually locked for students

---

3. CLASSROOM ROOMS (PERSISTENT VIDEO ROOMS)

Inside each community, add “Rooms” or “Classes” section:

Each room card should include:

* Room name (e.g., “SS1 Physics Room”)
* Teacher name
* Number of participants
* Status indicator (Live 🔴 / Offline ⚪)
* Buttons:

  * Enter Room
  * Start Class (Teacher only)
  * Delete (Teacher only)

Rooms are persistent (always visible even when offline)

---

4. TEACHER-CONTROLLED ACCESS SYSTEM

When a student tries to join a room:

* Show “Request to Join” modal
* Status: Pending Approval

Teacher UI:

* “Join Requests” panel
* Approve / Deny buttons
* List of waiting students

Add permission states:

* Approved users
* Pending users
* Blocked users

---

5. CLASSROOM INTERFACE IMPROVEMENTS

Update the classroom screen to include:

Top Bar:

* Room name
* Live status indicator
* Participant count
* Leave button

Main Area:

* Video area (teacher focus)
* Screen share / PDF viewer

Side Panel Tabs:

* Chat
* Participants
* Assignments
* Join Requests (Teacher only)

AI Panels:

* Live transcript panel
* Translated subtitles panel

---

6. DASHBOARD UPDATES

Teacher Dashboard:

* List of created rooms
* Button: “Create New Room”
* Room analytics (participants, sessions)
* Access management shortcut

Student Dashboard:

* List of joined rooms
* “Pending approval” labels
* Quick join buttons

---

7. VISUAL DETAILS

* Use icons for lock (private), live status, roles
* Add subtle animations for:

  * Join request notifications
  * Live class indicator
* Maintain consistent spacing and typography
* Keep UI clean and uncluttered

---

GOAL:

The UI should feel like a hybrid of:

* Zoom (video classroom)
* Discord (community structure)
* Google Classroom (education workflow)

But uniquely focused on:

* structured classrooms
* teacher authority
* accessibility and global learning

Do not overcomplicate the layout. Keep it elegant, clear, and scalable.
