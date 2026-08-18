# Final Site Inspection Report — 7 Star Family

A digital version of the printed "Final Site Inspection Report" checklist, available only to the 7 Star Family company account. Foremen fill it out on site, admins/managers review it, and every submission is saved with a branded PDF matching the printed form.

## Where it lives

- New menu item **Site Inspections** under Jobsite/Operations for admin, management, and foreman sidebars.
- Visible only when the logged-in user's active company is 7 Star Family; hidden for all other companies.
- Two views: a list of past inspections (searchable by date, job #, client, supervisor) and the inspection form.

## The form (mirrors the printed sheet)

1. **Project Information** — Client, Date, Insurance Company, Supervisor, Adjuster, Crew Members, Claim #, Builder / Restoration Company, Job #, Property Address. Optional jobsite picker that auto-fills address.
2. **Seven checklist sections**, each with the exact printed items as checkboxes:
   1. Demolition (7 items)
   2. Material Samples (6 items)
   3. Moisture Inspection (4 items)
   4. Mold Remediation (6 items)
   5. Benefect Application (4 items)
   6. Cleaning & Site Protection (10 items, incl. the three NEW items)
   7. Final Inspection (7 items)
   Each section shows a progress count (e.g. 5/7) and a "check all" toggle.
3. **Quality Control** — Moisture Meter Used, Final Moisture Reading, and Yes/No toggles for Photos Uploaded, Customer Walkthrough Completed, Deficiencies Found, Corrective Actions Completed.
4. **Supervisor Comments / Additional Notes** — free text.
5. **Photos** — upload/capture multiple site photos with optional captions; appended as pages at the end of the PDF.
6. **Signatures** — three on-screen draw pads (Supervisor, Crew Leader, Client/Restoration Rep — optional), each with printed name and date.

Save as **Draft** (editable later) or **Submit** (locked, PDF generated). Mobile-first layout: one section per collapsible card, big tap targets, sticky save bar.

## The PDF

Recreates the reference layout: black header band with the 7 Star Family logo, gold "FINAL SITE INSPECTION REPORT" title and service/values lines; boxed Project Information grid; the seven checklist blocks in the same 4-up / 3-up arrangement with dark gold section headers and filled check boxes; Quality Control strip; comments box; signature row with the drawn signature images, printed names and dates; footer band with the "7 STARS FAMILY STANDARD" text and values list. Photos follow on additional pages, 2 per page with captions.

File name: `Final-Site-Inspection_<Job#-or-Client>_<YYYY-MM-DD>.pdf`

## Technical notes

- Migration: `site_inspections` table (company_id, jobsite_id, inspection_date, project info fields, `checklist jsonb`, `quality_control jsonb`, comments, `signatures jsonb`, status draft/submitted, created_by, created_by_name, timestamps) with GRANTs, RLS scoped to the user's company, and an `updated_at` trigger. Plus `site_inspection_photos` (inspection_id, file_path, caption, sort order) and a public `site-inspection-photos` storage bucket, following the `employee_bills` / `employee_bill_photos` pattern.
- Company gating via a small `useIsSevenStars()` helper comparing the active company id (`2e1d103d-d0c3-4ede-92d1-7be02c9d0246`) — used in `menuData.ts`, `managementMenuData.ts`, `foremanTabRoutes.tsx`, plus a route guard on the page.
- Checklist items live in one `siteInspectionChecklist.ts` constant so form and PDF stay in sync; stored answers keyed by stable item ids.
- New files: `src/hooks/useSiteInspections.ts`, `src/components/admin/site-inspections/` (list table, form, section card, signature pad, photo uploader), `src/utils/siteInspectionPDF.ts` (jsPDF + hand-drawn layout, reusing the branding/logo loader from `dailySheetPDF.ts`), route + page under admin/management/foreman.
- Signature pads: lightweight canvas component, exported as PNG data URLs stored in the `signatures` jsonb.
- QA: generate a sample PDF, render pages to images and inspect for clipping/overlap before finishing.
