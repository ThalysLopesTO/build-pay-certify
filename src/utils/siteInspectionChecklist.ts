/**
 * Final Site Inspection Report checklist definition (7 Star Family).
 * Single source of truth shared by the form and the PDF generator so both stay in sync.
 */

export interface ChecklistItem {
  id: string;
  label: string;
  isNew?: boolean;
}

export interface ChecklistSection {
  id: string;
  number: number;
  title: string;
  items: ChecklistItem[];
}

export const SITE_INSPECTION_SECTIONS: ChecklistSection[] = [
  {
    id: 'demolition',
    number: 1,
    title: 'Demolition',
    items: [
      { id: 'demo_drywall', label: 'All authorized drywall removed' },
      { id: 'demo_insulation', label: 'All wet insulation removed' },
      { id: 'demo_cuts', label: 'Straight, professional cuts' },
      { id: 'demo_nails', label: 'No exposed nails or screws' },
      { id: 'demo_debris', label: 'No debris left behind' },
      { id: 'demo_floor_protection', label: 'Floor protection installed at entrances and on all stairs' },
      { id: 'demo_stairs', label: 'Existing stairs not demolished unless written approval has been received' },
    ],
  },
  {
    id: 'material_samples',
    number: 2,
    title: 'Material Samples',
    items: [
      { id: 'samples_flooring', label: 'Collect two (2) samples of flooring' },
      { id: 'samples_baseboard', label: 'Collect two (2) samples of baseboard' },
      { id: 'samples_door_casing', label: 'Collect two (2) samples of door casing' },
      { id: 'samples_leave_set', label: 'Leave one complete set of samples at the jobsite' },
      { id: 'samples_deliver_set', label: 'Deliver the second complete set of samples to WPMB' },
      { id: 'samples_labeled', label: 'Samples labeled with Job # and Claim #' },
      { id: 'samples_photos', label: 'Photos taken of samples before packaging' },
    ],
  },
  {
    id: 'moisture',
    number: 3,
    title: 'Moisture Inspection',
    items: [
      { id: 'moisture_area_inspected', label: 'Entire work area inspected' },
      { id: 'moisture_readings', label: 'High moisture readings documented' },
      { id: 'moisture_framing', label: 'No wet framing missed' },
      { id: 'moisture_hidden', label: 'Additional hidden moisture investigated' },
    ],
  },
  {
    id: 'mold',
    number: 4,
    title: 'Mold Remediation',
    items: [
      { id: 'mold_identified', label: 'Mold identified' },
      { id: 'mold_surface_cleaned', label: 'Surface mold cleaned whenever possible' },
      { id: 'mold_removal', label: 'Removal of contaminated drywall, studs or other materials when cleaning is not sufficient' },
      { id: 'mold_photos_before', label: 'Photos taken before mold remediation/removal' },
      { id: 'mold_photos_after', label: 'Photos taken after mold remediation/removal' },
      { id: 'mold_supervisor', label: 'Supervisor notified' },
    ],
  },
  {
    id: 'benefect',
    number: 5,
    title: 'Benefect® Application',
    items: [
      { id: 'benefect_studs', label: 'Applied to all exposed studs' },
      { id: 'benefect_plates', label: 'Applied to plates (sole plates)' },
      { id: 'benefect_framing', label: 'All exposed framing treated' },
      { id: 'benefect_no_areas_missed', label: 'No areas missed' },
    ],
  },
  {
    id: 'cleaning',
    number: 6,
    title: 'Cleaning & Site Protection',
    items: [
      { id: 'clean_impeccable', label: 'Property impeccably clean' },
      { id: 'clean_hepa', label: 'HEPA vacuum completed' },
      { id: 'clean_dust', label: 'Dust removed from all surfaces' },
      { id: 'clean_corners', label: 'Corners and edges cleaned' },
      { id: 'clean_garbage', label: 'Garbage bagged and removed' },
      { id: 'clean_entrances', label: 'Entrances cleaned' },
      { id: 'clean_floor_covering', label: 'Protective floor covering removed only after final inspection' },
      { id: 'clean_plastic_tape', label: 'Close with plastic and tape', isNew: true },
      { id: 'clean_toilet', label: 'When toilet is removed, bag it in a garbage bag, place it in the hole and tape to the drain pipe', isNew: true },
      { id: 'clean_contents', label: 'Customer contents stored in boxes or clear plastic bags', isNew: true },
    ],
  },
  {
    id: 'final',
    number: 7,
    title: 'Final Inspection',
    items: [
      { id: 'final_windows', label: 'Windows secured' },
      { id: 'final_doors', label: 'Doors secured' },
      { id: 'final_closets', label: 'Closets checked' },
      { id: 'final_under_stairs', label: 'Under stairs checked' },
      { id: 'final_no_tools', label: 'No tools left onsite' },
      { id: 'final_photos', label: 'Final photos uploaded' },
      { id: 'final_ready', label: 'Ready for Titan / WPMB Final Inspection' },
    ],
  },
];

export const QUALITY_CONTROL_TOGGLES = [
  { id: 'photos_uploaded', label: 'Photos Uploaded' },
  { id: 'customer_walkthrough', label: 'Customer Walkthrough Completed' },
  { id: 'deficiencies_found', label: 'Deficiencies Found' },
  { id: 'corrective_actions', label: 'Corrective Actions Completed' },
] as const;

export const COMPANY_STANDARD_TEXT =
  'No crew leaves the jobsite until the work area is clean, safe, treated, documented and ready for the final inspection by Titan / WPMB.';

export const COMPANY_VALUES = [
  'PROFESSIONALISM',
  'INTEGRITY',
  'QUALITY',
  'ACCOUNTABILITY',
  'SAFETY',
];

export const ALL_CHECKLIST_ITEM_IDS = SITE_INSPECTION_SECTIONS.flatMap(s =>
  s.items.map(i => i.id)
);

export const countChecked = (
  section: ChecklistSection,
  checklist: Record<string, boolean>
) => section.items.filter(i => checklist[i.id]).length;
