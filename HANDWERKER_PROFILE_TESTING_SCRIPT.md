# Handwerker Profile Editing - Manual Testing Script

**Version:** 1.0  
**Last Updated:** 2025-01-17  
**Test Environment:** Development/Staging  
**Tester:** _____________  
**Date:** _____________

## Prerequisites

- [ ] Test handwerker account created with email: `test.handwerker@bueze.ch`
- [ ] Test images prepared (JPG, PNG formats, various sizes)
- [ ] Test PDF documents prepared (insurance, licenses)
- [ ] Admin account access for verification testing
- [ ] Browser: Chrome/Firefox/Safari (latest version)
- [ ] Network: Stable connection for upload testing

---

## Test Suite 1: Profile & Bio Tab

### TC-101: Load Profile Edit Page
**Priority:** HIGH  
**Prerequisites:** Logged in as handwerker

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/handwerker-profile/edit` | Page loads within 2 seconds |
| 2 | Verify all tabs visible | 5 tabs displayed: Profile & Bio, Fachgebiete, Firma & Kontakt, Banking & Versicherung, Dokumente und Bilder |
| 3 | Check "Profile & Bio" tab is active | Tab highlighted, content visible |
| 4 | Verify profile completeness card displays | Shows percentage and list of missing/completed items |

**Pass Criteria:** All 4 steps succeed  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-102: Edit Bio Field
**Priority:** HIGH  
**Prerequisites:** On Profile & Bio tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Locate "Über mich" textarea | Textarea visible with current bio or placeholder |
| 2 | Enter bio text: "Ich bin ein erfahrener Handwerker mit 15 Jahren Erfahrung in der Schweiz." | Text appears as typed |
| 3 | Wait 2 seconds after stopping typing | Auto-save triggers, "Zuletzt gespeichert" timestamp updates |
| 4 | Refresh page | Bio text persists |

**Pass Criteria:** Auto-save works, data persists  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-103: Set Hourly Rate Range
**Priority:** HIGH  
**Prerequisites:** On Profile & Bio tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Enter min rate: `80` | Value appears in field |
| 2 | Enter max rate: `120` | Value appears in field |
| 3 | Wait for auto-save | Save indicator appears |
| 4 | Switch to Preview mode | Hourly rate displays as "CHF 80-120/Std." |

**Pass Criteria:** Rates save and display correctly in preview  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-104: Set Response Time
**Priority:** MEDIUM  
**Prerequisites:** On Profile & Bio tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Locate "Reaktionszeit (Stunden)" field | Number input visible |
| 2 | Enter value: `24` | Value appears |
| 3 | Wait for auto-save | Timestamp updates |
| 4 | Switch to Preview | "Antwortet normalerweise innerhalb von 24 Stunden" or similar text displays |

**Pass Criteria:** Response time saves and displays  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Suite 2: Fachgebiete (Categories) Tab

### TC-201: View Category Selection
**Priority:** HIGH  
**Prerequisites:** Logged in as handwerker

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Fachgebiete" tab | Tab activates, category grid displays |
| 2 | Count major category cards | All major categories visible (Bau & Renovation, Elektro, etc.) |
| 3 | Verify card styling | Each card has icon, title, color accent |

**Pass Criteria:** All categories visible and styled correctly  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-202: Select Major Category and Subcategories
**Priority:** HIGH  
**Prerequisites:** On Fachgebiete tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Elektro" major category card | Card highlights with brand color border |
| 2 | Observe subcategory accordion | Accordion expands showing subcategories (Elektriker, Elektroinstallationen, etc.) |
| 3 | Click subcategory badge "Elektriker" | Badge turns blue/brand color, checkmark appears |
| 4 | Click another subcategory "Elektroinstallationen" | Second badge also highlights |
| 5 | Wait for auto-save | Save indicator appears |
| 6 | Switch to Preview mode | Both subcategories appear under "Elektro" section in preview |

**Pass Criteria:** Categories save and display grouped by major category in preview  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-203: Deselect Category
**Priority:** MEDIUM  
**Prerequisites:** Category already selected

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click selected "Elektriker" badge | Badge deselects, returns to neutral style |
| 2 | Wait for auto-save | Save triggers |
| 3 | Switch to Preview | "Elektriker" no longer appears in preview |
| 4 | Refresh page | Selection persists (remains deselected) |

**Pass Criteria:** Deselection works and persists  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-204: Select Multiple Major Categories
**Priority:** HIGH  
**Prerequisites:** On Fachgebiete tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Select "Bau & Renovation" → "Maurer" | Badge highlights |
| 2 | Select "Elektro" → "Elektriker" | Badge highlights |
| 3 | Select "Sanitär" → "Sanitärinstallateur" | Badge highlights |
| 4 | Switch to Preview | All 3 categories appear grouped under respective major categories |

**Pass Criteria:** Multiple categories from different majors display correctly  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Suite 3: Service Area Selection

### TC-301: Select Cantons
**Priority:** HIGH  
**Prerequisites:** On Firma & Kontakt tab or service area section

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Locate canton selector | Grid of canton badges visible (ZH, BE, LU, etc.) |
| 2 | Click "ZH" canton badge | Badge highlights with brand color |
| 3 | Click "BE" canton badge | Second badge highlights |
| 4 | Wait for auto-save | Save indicator appears |
| 5 | Switch to Preview | Service areas show "Zürich (ZH), Bern (BE)" or similar format |

**Pass Criteria:** Cantons save and display with full names  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-302: Add Manual Postal Codes
**Priority:** HIGH  
**Prerequisites:** Service area section visible

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Postleitzahl hinzufügen" or similar input | Postal code input appears |
| 2 | Type `8001` | Dropdown suggestions appear (Zürich, 8001) |
| 3 | Select "Zürich, 8001" from dropdown | Badge appears with "8001 - Zürich" |
| 4 | Add another: `3000` | Badge appears with "3000 - Bern" |
| 5 | Wait for auto-save | Save triggers |
| 6 | Switch to Preview | Both postal codes display in service area list |

**Pass Criteria:** Postal codes save and display correctly  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-303: Remove Service Area
**Priority:** MEDIUM  
**Prerequisites:** Canton or postal code already added

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Locate added canton badge "ZH" | Badge visible with X icon |
| 2 | Click X icon on badge | Badge disappears immediately |
| 3 | Wait for auto-save | Save triggers |
| 4 | Refresh page | Canton remains removed |

**Pass Criteria:** Removal works and persists  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-304: Canton Prevents Duplicate Postal Codes
**Priority:** MEDIUM  
**Prerequisites:** Service area section visible

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Select canton "ZH" (covers 8000-8999) | Canton badge appears |
| 2 | Try to manually add `8001` | Input prevents or shows warning: "Already covered by ZH" |
| 3 | Verify message appears | User-friendly message explains overlap |

**Pass Criteria:** System prevents duplicate coverage  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Suite 4: File Uploads

### TC-401: Upload Company Logo
**Priority:** HIGH  
**Prerequisites:** On Firma & Kontakt tab or Dokumente und Bilder tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Locate "Firmenlogo" upload section | Upload button visible |
| 2 | Click upload button, select 2MB JPG file | Upload progress indicator appears |
| 3 | Wait for upload to complete | Success message, logo thumbnail displays with object-contain (no distortion) |
| 4 | Click on logo thumbnail | Popup dialog opens showing full-size logo |
| 5 | Close popup | Returns to edit view |
| 6 | Switch to Preview | Logo displays in preview card with object-contain |

**Pass Criteria:** Logo uploads, displays correctly, popup works  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-402: Upload Multiple Portfolio Images (Parallel)
**Priority:** HIGH  
**Prerequisites:** On Dokumente und Bilder tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Portfoliobilder hochladen" | File selector opens |
| 2 | Select 3 images simultaneously (2MB JPG, 3MB PNG, 1MB JPG) | Upload starts for all 3 files |
| 3 | Observe upload progress | Progress indicators for all 3 files appear simultaneously (parallel upload) |
| 4 | Wait for completion (should be 3-5x faster than sequential) | All 3 thumbnails appear in grid |
| 5 | Verify upload time | Should complete in < 5 seconds total for 6MB combined |
| 6 | Click one thumbnail | Popup shows full image |

**Pass Criteria:** Parallel upload works, significantly faster than sequential  
**Result:** [ ] PASS [ ] FAIL  
**Upload Time:** _______ seconds  
**Notes:** _____________

---

### TC-403: Upload Verification Document (PDF)
**Priority:** HIGH  
**Prerequisites:** On Dokumente und Bilder tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Locate "Verifizierungsdokumente" section | Upload button visible |
| 2 | Click upload, select 5MB PDF (insurance certificate) | Upload starts |
| 3 | Wait for upload | Success message, file card appears with PDF icon |
| 4 | Verify file card shows filename | "versicherung.pdf" or similar name displayed |
| 5 | Click file card | PDF opens in new tab or downloads |
| 6 | Return to page, verify document persists | Document remains in list |

**Pass Criteria:** PDF uploads and is accessible  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-404: File Size Limit Enforcement
**Priority:** HIGH  
**Prerequisites:** On Dokumente und Bilder tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Try to upload 15MB image | Error message: "Dateigrösse überschreitet 10MB Limit" or similar |
| 2 | Verify upload is rejected | No upload occurs, no progress indicator |
| 3 | Try to upload 6MB logo | Error message: "Logo darf maximal 5MB sein" or similar |
| 4 | Verify 4MB file uploads successfully | Upload proceeds without error |

**Pass Criteria:** Size limits enforced correctly with clear error messages  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-405: Delete Portfolio Image
**Priority:** MEDIUM  
**Prerequisites:** Portfolio image already uploaded

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Locate uploaded portfolio image | Thumbnail visible with X/delete icon |
| 2 | Click delete icon | Confirmation dialog appears: "Bild wirklich löschen?" |
| 3 | Confirm deletion | Image disappears from grid |
| 4 | Wait for auto-save | Save triggers |
| 5 | Refresh page | Image remains deleted |
| 6 | Verify in Supabase Storage | File removed from storage bucket |

**Pass Criteria:** Image deletes from both UI and storage  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-406: Delete Verification Document
**Priority:** MEDIUM  
**Prerequisites:** Document already uploaded

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Locate uploaded document card | Card visible with X icon |
| 2 | Click X icon | Confirmation dialog appears |
| 3 | Confirm deletion | Document card disappears |
| 4 | Refresh page | Document remains deleted |

**Pass Criteria:** Document deletes successfully  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Suite 5: Banking & Insurance Tab

### TC-501: Enter Banking Information
**Priority:** HIGH  
**Prerequisites:** On Banking & Versicherung tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Enter bank name: "UBS Switzerland AG" | Text appears |
| 2 | Enter IBAN: "CH93 0076 2011 6238 5295 7" | IBAN formatted with spaces automatically |
| 3 | Verify IBAN validation | Green checkmark or validation indicator appears |
| 4 | Enter invalid IBAN: "CH12 3456" | Red error message: "Ungültige IBAN" |
| 5 | Wait for auto-save with valid IBAN | Save triggers |
| 6 | Switch to Preview | Banking info displays in preview (partially masked: "CH93 ••••" or similar) |

**Pass Criteria:** IBAN validation works, data saves, displays securely in preview  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-502: Enter Insurance Information
**Priority:** HIGH  
**Prerequisites:** On Banking & Versicherung tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Enter insurance provider: "Allianz Suisse" | Text appears |
| 2 | Enter policy number: "POL-123456789" | Text appears |
| 3 | Select insurance valid until date: "2025-12-31" | Date picker opens, date selects |
| 4 | Wait for auto-save | Save triggers |
| 5 | Switch to Preview | Insurance status shows "Versichert bis 31.12.2025" with green checkmark |

**Pass Criteria:** Insurance info saves and displays with validation status  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-503: Enter Company Registration Details
**Priority:** MEDIUM  
**Prerequisites:** On Firma & Kontakt or Banking & Versicherung tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Enter UID: "CHE-123.456.789" | Text appears, formatted automatically |
| 2 | Enter MWST: "CHE-123.456.789 MWST" | Text appears |
| 3 | Verify UID validation | Validation indicator (Swiss UID format check) |
| 4 | Wait for auto-save | Save triggers |
| 5 | Switch to Preview | Company registration details display |

**Pass Criteria:** Swiss business numbers validate and save  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Suite 6: Preview Mode

### TC-601: Toggle Preview Mode
**Priority:** HIGH  
**Prerequisites:** Profile partially filled

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Vorschau" button at top of page | Page switches to preview mode |
| 2 | Verify all filled data displays | Bio, categories, contact info, rates all visible |
| 3 | Verify empty fields don't show | Only completed sections display |
| 4 | Click "Bearbeiten" button | Returns to edit mode with all tabs |

**Pass Criteria:** Preview toggle works smoothly, data displays correctly  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-602: Verify Complete Profile in Preview
**Priority:** HIGH  
**Prerequisites:** All profile sections filled

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Switch to Preview mode | Full profile card displays |
| 2 | Verify header shows: Name, hourly rate, contact button | "Max Muster, CHF 80-120/Std., Kontakt aufnehmen" visible |
| 3 | Verify "Über mich" bio displays | Bio text visible in card |
| 4 | Verify categories grouped by major category | "Elektro: Elektriker, Elektroinstallationen" format |
| 5 | Verify service areas display | "Zürich (ZH), 8001 - Zürich, 3000 - Bern" |
| 6 | Verify portfolio images display | Image grid with clickable thumbnails |
| 7 | Verify professional details | Legal form, insurance status, verification badge |
| 8 | Click logo | Popup opens with full logo |
| 9 | Click portfolio image | Popup opens with full image |

**Pass Criteria:** All data displays correctly in preview, matches input  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-603: Preview Reflects Real-Time Changes
**Priority:** MEDIUM  
**Prerequisites:** In edit mode

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Change hourly rate from 80-120 to 90-130 | Rate updates in field |
| 2 | Wait for auto-save | Save completes |
| 3 | Switch to Preview | New rate "CHF 90-130/Std." displays |
| 4 | Return to edit, add new category | Category selects |
| 5 | Switch to Preview again | New category appears in preview |

**Pass Criteria:** Preview always shows latest saved data  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Suite 7: Auto-Save & Manual Save

### TC-701: Auto-Save After Text Input
**Priority:** HIGH  
**Prerequisites:** On any editable field

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Edit bio field | Type text |
| 2 | Stop typing, wait exactly 2 seconds | Auto-save triggers, "Zuletzt gespeichert: Vor wenigen Sekunden" appears |
| 3 | Verify no duplicate saves | Only one save operation occurs |
| 4 | Refresh page | Changes persist |

**Pass Criteria:** Debounced auto-save works after 2 seconds, no duplicates  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-702: Manual Save Button
**Priority:** MEDIUM  
**Prerequisites:** Changes made but not saved

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Make changes to multiple fields | Changes visible |
| 2 | Click "Speichern" button immediately (before auto-save) | Save triggers manually |
| 3 | Verify loading state | Button shows spinner or "Speichert..." text |
| 4 | Verify success message | Toast or success indicator appears |
| 5 | Verify timestamp updates | "Zuletzt gespeichert" updates |

**Pass Criteria:** Manual save works independently of auto-save  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-703: Prevent Concurrent Saves
**Priority:** HIGH  
**Prerequisites:** On edit page

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Make change, click "Speichern" button | Save starts |
| 2 | While first save is processing, make another change and click "Speichern" again | Second save is prevented/queued |
| 3 | Verify only one save completes at a time | No duplicate database writes |
| 4 | Verify both changes eventually save | All changes persist after second save completes |

**Pass Criteria:** Concurrent saves prevented, no data loss  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-704: Save Failure Handling
**Priority:** MEDIUM  
**Prerequisites:** Ability to simulate network failure

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Make changes | Changes visible |
| 2 | Disconnect network/simulate 500 error | Network offline |
| 3 | Attempt to save | Error message appears: "Speichern fehlgeschlagen. Bitte Verbindung prüfen." |
| 4 | Reconnect network | Connection restored |
| 5 | Click save again | Save succeeds, success message appears |

**Pass Criteria:** Graceful error handling, retry works  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Suite 8: Profile Completeness

### TC-801: Profile Completeness Calculation
**Priority:** HIGH  
**Prerequisites:** New/empty profile

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Load profile edit page | Completeness shows 0% or low percentage |
| 2 | View completeness card | Lists missing required items (Name, Categories, Service Areas, etc.) |
| 3 | Fill in first name and last name | Completeness increases (e.g., to 20%) |
| 4 | Add at least one category | Completeness increases (e.g., to 40%) |
| 5 | Add service area | Completeness increases (e.g., to 60%) |
| 6 | Upload logo | Completeness increases |
| 7 | Fill all required fields | Completeness reaches 100% |
| 8 | Verify green checkmarks | All required items show green checkmarks |

**Pass Criteria:** Completeness accurately reflects filled fields  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-802: Profile Completeness Badge in Dashboard
**Priority:** MEDIUM  
**Prerequisites:** Incomplete profile

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to HandwerkerDashboard | Dashboard loads |
| 2 | Locate profile completeness indicator | Badge or progress bar shows completion percentage |
| 3 | Click "Profil vervollständigen" link | Navigates to profile edit page |
| 4 | Complete more fields, save | Return to dashboard |
| 5 | Verify dashboard percentage updated | New percentage reflects changes |

**Pass Criteria:** Dashboard shows real-time completeness  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Suite 9: Mobile Responsiveness

### TC-901: Mobile Profile Edit
**Priority:** HIGH  
**Device:** iPhone 13 / Samsung Galaxy S21 or browser responsive mode (375px width)

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open profile edit on mobile | Page loads, all tabs visible |
| 2 | Verify tabs stack vertically or scroll horizontally | Tabs accessible, not cut off |
| 3 | Click each tab | Tab switches correctly |
| 4 | Fill text fields | Virtual keyboard doesn't obscure input |
| 5 | Upload image from camera roll | File picker opens, upload works |
| 6 | Verify all buttons are tappable | Buttons have adequate touch targets (min 44x44px) |
| 7 | Switch to preview mode | Preview displays correctly on mobile |

**Pass Criteria:** All functionality works on mobile  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-902: Mobile Image Upload
**Priority:** HIGH  
**Device:** Mobile device

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click portfolio image upload on mobile | Camera roll or file picker opens |
| 2 | Select image from camera roll | Upload starts |
| 3 | Verify upload progress visible | Progress bar displays |
| 4 | Wait for completion | Thumbnail appears in grid |
| 5 | Click thumbnail | Popup opens showing full image on mobile |
| 6 | Pinch to zoom in popup | Image zooms (if supported) |

**Pass Criteria:** Image upload and viewing works smoothly on mobile  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Suite 10: Integration with Admin Approval

### TC-1001: Admin Views Pending Profile
**Priority:** HIGH  
**Prerequisites:** Admin account, handwerker profile pending approval

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Log in as admin | Admin dashboard loads |
| 2 | Navigate to Handwerker Approvals | List of pending profiles displays |
| 3 | Locate test handwerker profile | Profile appears in list with status "Pending" |
| 4 | Click profile to view details | Full profile displays (categories, documents, service areas) |
| 5 | Verify verification documents accessible | PDFs/images can be viewed/downloaded |
| 6 | Verify all profile fields display | All data from profile edit appears |

**Pass Criteria:** Admin can view complete profile for approval  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-1002: Admin Approves Profile
**Priority:** HIGH  
**Prerequisites:** Admin viewing pending profile

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Approve" button | Confirmation dialog appears |
| 2 | Confirm approval | Success message: "Profil genehmigt" |
| 3 | Verify profile status updates to "Approved" | Status changes in UI |
| 4 | Verify email sent to handwerker | Handwerker receives approval email |
| 5 | Log in as handwerker | Profile shows "Verifiziert" badge |
| 6 | Verify handwerker can now submit proposals | Browse leads, submit proposal button active |

**Pass Criteria:** Approval workflow completes, handwerker activated  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-1003: Admin Rejects Profile
**Priority:** HIGH  
**Prerequisites:** Admin viewing pending profile

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click "Reject" button | Rejection dialog with reason field appears |
| 2 | Enter rejection reason: "Bitte gültige Versicherungsdokumente hochladen" | Reason entered |
| 3 | Confirm rejection | Success message: "Profil abgelehnt" |
| 4 | Verify rejection email sent | Handwerker receives email with reason |
| 5 | Log in as handwerker | Profile shows "Abgelehnt" status with reason |
| 6 | Verify handwerker can edit and resubmit | Edit profile, make changes, resubmit for approval |

**Pass Criteria:** Rejection workflow works, handwerker can resubmit  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Suite 11: End-to-End User Flows

### TC-1101: Complete New Handwerker Registration to First Proposal
**Priority:** CRITICAL  
**Prerequisites:** Fresh test account

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Register new handwerker account | Account created, redirected to onboarding |
| 2 | Complete onboarding (categories, service areas) | Onboarding completes, profile created |
| 3 | Navigate to profile edit | Profile loads with onboarding data pre-filled |
| 4 | Add bio, hourly rates, response time | Fields save |
| 5 | Add company info (name, legal form) | Fields save |
| 6 | Add banking info (bank name, IBAN) | Fields save |
| 7 | Add insurance info (provider, policy number, valid until) | Fields save |
| 8 | Upload logo | Logo uploads successfully |
| 9 | Upload 3 portfolio images | All 3 upload in parallel |
| 10 | Upload 2 verification documents (PDF) | Both upload successfully |
| 11 | Verify profile completeness 100% | Completeness card shows 100% |
| 12 | Submit for admin approval | Status changes to "Pending" |
| 13 | Admin approves profile | Approval email sent |
| 14 | Handwerker browses leads | Verified leads visible |
| 15 | Handwerker submits first proposal | Proposal created, shows full profile in preview |
| 16 | Client views proposal | Client sees complete handwerker profile with all data |

**Pass Criteria:** Complete flow works end-to-end without errors  
**Result:** [ ] PASS [ ] FAIL  
**Duration:** _______ minutes  
**Notes:** _____________

---

### TC-1102: Existing Handwerker Updates Profile
**Priority:** HIGH  
**Prerequisites:** Existing verified handwerker

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Log in as existing handwerker | Dashboard loads |
| 2 | Navigate to profile edit | Profile loads with existing data |
| 3 | Update bio (add new paragraph) | Changes save |
| 4 | Add new category (expand to new service) | New category selects and saves |
| 5 | Add new canton to service areas | New canton adds |
| 6 | Upload 2 new portfolio images | Images upload and display |
| 7 | Update hourly rate (increase by CHF 10) | Rate updates |
| 8 | Switch to Preview | All new changes display correctly |
| 9 | Save manually | Success message appears |
| 10 | Submit new proposal on a lead | Proposal includes updated profile data |
| 11 | Client views proposal | Client sees updated information |

**Pass Criteria:** Updates flow through to client-facing proposals  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Suite 12: Edge Cases & Error Scenarios

### TC-1201: Extremely Long Bio Text
**Priority:** LOW  
**Prerequisites:** Profile & Bio tab

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Paste 5000 characters into bio field | Text accepts or shows character limit warning |
| 2 | Attempt to save | Save completes or shows validation error |
| 3 | Switch to preview | Bio displays with proper truncation or scroll |

**Pass Criteria:** Long text handled gracefully  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-1202: Special Characters in Fields
**Priority:** MEDIUM  
**Prerequisites:** Any text field

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Enter company name with special chars: "Müller & Söhne GmbH" | Text accepts umlauts and & symbol |
| 2 | Enter bio with emoji: "Wir sind die Besten! 💪🔨" | Emoji displays correctly |
| 3 | Save | Data saves without corruption |
| 4 | Verify in preview | Special characters display correctly |

**Pass Criteria:** Special characters and emoji supported  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-1203: Session Timeout During Edit
**Priority:** MEDIUM  
**Prerequisites:** Long editing session

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Make changes to profile | Changes visible |
| 2 | Wait for session to expire (simulate or wait 30+ min) | Session expires |
| 3 | Attempt to save | Error message: "Session abgelaufen. Bitte erneut anmelden." |
| 4 | Log in again | Redirects to profile edit |
| 5 | Verify unsaved changes (if auto-saved before timeout) | Recent auto-saves preserved |

**Pass Criteria:** Graceful session expiration handling  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

### TC-1204: Rapid Tab Switching
**Priority:** LOW  
**Prerequisites:** Profile edit page loaded

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Rapidly click between all 5 tabs | Tabs switch smoothly without errors |
| 2 | Make changes on multiple tabs quickly | Changes register on each tab |
| 3 | Verify no data loss | All changes persist after stabilizing |

**Pass Criteria:** No race conditions or data loss  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Suite 13: Performance Testing

### TC-1301: Page Load Time
**Priority:** HIGH  
**Prerequisites:** Clear browser cache

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Clear browser cache | Cache cleared |
| 2 | Navigate to `/handwerker-profile/edit` | Start timer |
| 3 | Wait for page fully loaded | Stop timer when interactive |
| 4 | Record load time | Time ≤ 2 seconds |

**Pass Criteria:** Page loads in under 2 seconds  
**Result:** [ ] PASS [ ] FAIL  
**Load Time:** _______ seconds  
**Notes:** _____________

---

### TC-1302: File Upload Speed (Parallel vs Sequential)
**Priority:** HIGH  
**Prerequisites:** 3 test images (2MB each)

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Upload 3 images simultaneously | Start timer |
| 2 | Wait for all uploads to complete | Stop timer |
| 3 | Record time | Time significantly less than 3x single upload time |
| 4 | Calculate effective speedup | 3-5x faster than sequential |

**Pass Criteria:** Parallel upload at least 3x faster  
**Result:** [ ] PASS [ ] FAIL  
**Upload Time:** _______ seconds  
**Speedup Factor:** _______x  
**Notes:** _____________

---

### TC-1303: Auto-Save Performance Under Load
**Priority:** MEDIUM  
**Prerequisites:** Profile with lots of data

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Make 10 rapid changes across different fields | Changes register |
| 2 | Verify debouncing works | Only 1-2 save operations trigger (not 10) |
| 3 | Verify UI remains responsive | No lag or freezing |
| 4 | Verify all changes eventually saved | Final state includes all 10 changes |

**Pass Criteria:** Debouncing prevents excessive saves, UI responsive  
**Result:** [ ] PASS [ ] FAIL  
**Notes:** _____________

---

## Test Execution Summary

**Total Test Cases:** 50+  
**Executed:** ___ / ___  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___  
**Pass Rate:** ___%

### Critical Issues Found
| Issue ID | Severity | Description | Status |
|----------|----------|-------------|--------|
| | | | |
| | | | |

### Recommendations
- [ ] All critical tests passed - ready for production
- [ ] Minor issues require fixes before release
- [ ] Major issues found - requires another testing round
- [ ] Performance concerns - optimization needed

**Tested By:** _____________  
**Date Completed:** _____________  
**Sign-off:** _____________

---

## Notes & Observations

_Use this space for additional observations, edge cases discovered during testing, or suggestions for improvement:_

