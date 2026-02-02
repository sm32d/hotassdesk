---
theme: seriph
background: https://source.unsplash.com/collection/94734566/1920x1080
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## HotDesk Presentation
  Presentation for the HotDesk project.
drawings:
  persist: false
transition: slide-left
title: HotDesk
---

# HotDesk

The Ultimate Office Desk Booking Solution

<div class="abs-br m-6 flex gap-2">
  <button @click="$slidev.nav.openInEditor()" title="Open in Editor" class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon:edit />
  </button>
</div>

---
layout: default
---

# 1. Introduction

<div class="grid grid-cols-2 gap-4">

<div>

## Team
**Name:** D^3 Vibe

## Members
**Dominik**

**Daniel**

**Darren**

</div>

<div>

<img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" class="rounded-lg shadow-lg opacity-80" />

</div>

</div>

---

# 2. Project Demo & Features

**HotDesk** is a comprehensive desk booking management system.

<div class="grid grid-cols-2 gap-10 pt-4">

<div>

### Key Features
- **Interactive Floor Plan:** Visual desk selection with zoom & pan.
- **Booking System:** AM/PM/Full Day slots with recurrence.
- **Admin Dashboard:** Manage users, seats, and floor plans.
- **Security:** Role-based access (Admin/Employee) & Inactive user protection.

</div>

<div>

### Core Functions
- **Real-time Availability:** Instant feedback on seat status.
- **User Management:** Onboard and deactivate employees easily.
- **Visual Editor:** Admins can drag-and-drop seats on the map.

</div>

</div>

<!--
Presenter Notes:
- Show the Login screen.
- Demonstrate booking a seat on the map.
- Show the Admin Floor Plan editor (moving a seat).
-->

---

# 3. AI Usage in Project

<div class="grid grid-cols-2 gap-8">

<div>

### How AI Helped
- **Accelerated Boilerplate:** Rapid generation of UI components (Tailwind) and API routes.
- **Complex Logic:** Solved difficult math for the **Zoomable Map** and image dimension calculations.
- **Bug Fixing:** Identified and fixed race conditions in React hooks (e.g., the `useEffect` map reload bug).

### Learnings
- AI acts as a **Senior Pair Programmer**, offering immediate feedback.
- It excels at **pattern matching** and **refactoring** existing code.

</div>

<div>

### Do's & Don'ts
- ✅ **Do:** Provide full file context when asking for fixes.
- ✅ **Do:** Use AI to generate initial types and schemas (Prisma).
- ❌ **Don't:** Trust generated code blindly without testing (especially auth logic).
- ❌ **Don't:** Assume AI knows the "visual" output without descriptions.

### Planning
- **Yes**, AI assisted in designing the `Prisma` schema and defining the data relationships (User -> Booking -> Seat).

</div>

</div>

---
layout: center
class: text-center
---

# 4. Development Stats

<div class="flex justify-center gap-20 pt-10">

<div class="flex flex-col items-center">
  <div class="text-6xl font-bold text-green-500">~24</div>
  <div class="text-xl mt-2 opacity-80">Total Hours Spent</div>
</div>

<div class="flex flex-col items-center">
  <div class="text-6xl font-bold text-blue-500">1 + 1</div>
  <div class="text-xl mt-2 opacity-80">Developer + AI Agent</div>
</div>

</div>

<div class="mt-12 text-left w-2/3 mx-auto">

### How we worked together
- **Iterative Loop:** Prompt -> Code -> Test -> Refine.
- **Role Division:** Focused on the "Product Vision" and "User Experience", while the AI handled the "Implementation Details" and "Error Handling".

</div>

---

# 5. Code Quality & Future

<div class="grid grid-cols-2 gap-10">

<div>

### Quality of AI Code
- **Happiness Level:** ⭐⭐⭐⭐½ (4.5/5)
- **Strengths:** Strong typing (TypeScript), modern patterns (Next.js App Router), and great explanation of changes.
- **Weaknesses:** Occasionally hallucinates imports or deprecated methods.

</div>

<div>

### Future Wishlist
- **Context Awareness:** Better understanding of the *entire* project structure without manual file references.
- **Visual Debugging:** Ability for AI to "see" the rendered UI to fix styling issues faster.
- **Proactive Refactoring:** Suggesting architectural improvements before code becomes legacy.

</div>

</div>

---
layout: center
class: text-center
---

# Q & A

## Thank You!

<div class="mt-10 opacity-75">
  Questions?
</div>
