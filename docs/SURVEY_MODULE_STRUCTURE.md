# Survey Module - Complete Structure

## 📁 File Organization

```
shine-solar/
├── src/
│   ├── services/
│   │   └── surveysService.ts ..................... Service layer (267 lines)
│   │       ├── createSurvey()
│   │       ├── getSurveys(filters)
│   │       ├── getSurveyById()
│   │       ├── getSurveyWithDetails()
│   │       ├── updateSurvey()
│   │       ├── deleteSurvey()
│   │       ├── getSurveyStats()
│   │       ├── getTodaysSurveys()
│   │       ├── getUpcomingSurveys()
│   │       ├── assignSurvey()
│   │       ├── completeSurvey()
│   │       ├── markForRevisit()
│   │       ├── getSurveysByEngineer()
│   │       ├── calculateUsableArea()
│   │       └── estimateSystemCapacity()
│   │
│   └── modules/
│       └── survey/
│           ├── SurveyModule.tsx ................. Routing (20 lines)
│           │   └── Routes (/, /new, /:id, /:id/edit)
│           │
│           ├── SurveysList.tsx .................. List view (454 lines)
│           │   ├── Stats Dashboard (4 cards)
│           │   ├── Search & Filters
│           │   ├── Surveys Table
│           │   ├── Action Buttons
│           │   └── Delete Modal
│           │
│           ├── SurveyForm.tsx ................... Form (700+ lines)
│           │   ├── Basic Information
│           │   │   ├── Lead Selection
│           │   │   ├── Engineer Assignment
│           │   │   ├── Status
│           │   │   ├── Survey Date
│           │   │   └── Preferred Time
│           │   │
│           │   ├── Roof Measurements
│           │   │   ├── Length & Width
│           │   │   ├── Usable Area (auto-calc)
│           │   │   ├── Capacity Estimate
│           │   │   ├── Roof Type
│           │   │   ├── Roof Condition
│           │   │   └── Building Height
│           │   │
│           │   ├── Shadow Analysis
│           │   │   ├── Morning Notes
│           │   │   ├── Noon Notes
│           │   │   ├── Evening Notes
│           │   │   └── Nearby Obstructions
│           │   │
│           │   ├── Structural & Civil Work
│           │   │   ├── Structure Type
│           │   │   ├── Civil Work Required
│           │   │   └── Civil Work Notes
│           │   │
│           │   ├── Cable Routing & Earthing
│           │   │   ├── Panel to Inverter Distance
│           │   │   ├── Inverter to DB Distance
│           │   │   ├── Cable Route Notes
│           │   │   ├── Existing Earthing
│           │   │   ├── New Earthing Required
│           │   │   └── Earthing Notes
│           │   │
│           │   └── Safety & General
│           │       ├── Ladder Access
│           │       ├── Parapet Wall
│           │       ├── Safety Notes
│           │       └── Survey Remarks
│           │
│           └── SurveyDetails.tsx ................ Detail view (500+ lines)
│               ├── Header with Status Badge
│               ├── Customer & Lead Info
│               ├── Survey Schedule
│               ├── Roof Measurements Display
│               ├── Shadow Analysis Display
│               ├── Structural Info Display
│               ├── Cable Routing Display
│               ├── Earthing Display
│               ├── Safety Assessment Display
│               ├── Remarks & Notes Display
│               ├── Action Buttons
│               │   ├── Mark Complete
│               │   ├── Mark for Revisit
│               │   ├── Edit
│               │   └── Delete
│               └── Modals
│                   ├── Delete Confirmation
│                   ├── Complete Confirmation
│                   └── Revisit Reason Input
│
└── docs/
    ├── SURVEY_MODULE.md ......................... Full documentation
    └── SURVEY_MODULE_SUMMARY.md ................. Implementation summary
```

## 🎯 Module Flow

### 1. List View (`/survey`)
```
┌─────────────────────────────────────────────────────────────┐
│  📊 Survey Dashboard                                         │
├─────────────────────────────────────────────────────────────┤
│  [Total: 12] [Today: 3] [In Progress: 5] [Completed: 8]    │
├─────────────────────────────────────────────────────────────┤
│  🔍 [Search...] [Status Filter ▼] [+ Schedule Survey]      │
├─────────────────────────────────────────────────────────────┤
│  Customer      | Survey Date  | Engineer | Status | Actions │
│  John Doe      | 2024-12-15   | Alice    | ✓ Done | [👁][✏][🗑] │
│  Jane Smith    | 2024-12-16   | Bob      | ⏳ Prog| [👁][✏][🗑] │
│  ...           | ...          | ...      | ...    | ...     │
└─────────────────────────────────────────────────────────────┘
```

### 2. Create/Edit Form (`/survey/new` or `/survey/:id/edit`)
```
┌─────────────────────────────────────────────────────────────┐
│  Schedule New Survey                      [Cancel] [Save]   │
├─────────────────────────────────────────────────────────────┤
│  📋 Basic Information                                        │
│  Lead: [Select Lead ▼]  Engineer: [Select Engineer ▼]      │
│  Status: [Pending ▼]    Date: [📅]  Time: [🕐]             │
├─────────────────────────────────────────────────────────────┤
│  📏 Roof Measurements                                        │
│  Length: [___m] Width: [___m] Usable: [AUTO] 🧮            │
│  Type: [RCC ▼]  Condition: [Good ▼]  Height: [_floors]     │
│  💡 Est. capacity: ~5 kW                                    │
├─────────────────────────────────────────────────────────────┤
│  ☀️ Shadow Analysis                                          │
│  Morning: [____________]  Noon: [____________]              │
│  Evening: [____________]  Obstructions: [____________]      │
├─────────────────────────────────────────────────────────────┤
│  🏗️ Structural & Civil Work                                 │
│  Type: [Simple ▼]  ☑ Civil Work Required                   │
│  Notes: [____________]                                      │
├─────────────────────────────────────────────────────────────┤
│  🔌 Cable Routing & Earthing                                │
│  Panel→Inverter: [___m]  Inverter→DB: [___m]              │
│  ☑ Existing Earthing  ☐ New Required                       │
│  Notes: [____________]                                      │
├─────────────────────────────────────────────────────────────┤
│  🛡️ Safety & General                                         │
│  ☑ Ladder Access  ☑ Parapet Wall                           │
│  Safety: [____________]  Remarks: [____________]            │
└─────────────────────────────────────────────────────────────┘
```

### 3. Detail View (`/survey/:id`)
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back  Survey Details    [⚠ Revisit][✓ Complete][✏ Edit][🗑 Delete]
│  Status: ✅ Completed      Lead: LEAD-2024-001             │
├─────────────────────────────────────────────────────────────┤
│  👤 Customer & Lead Information                              │
│  Name: John Doe          Mobile: +91 9876543210            │
│  Lead ID: LEAD-2024-001                                     │
├─────────────────────────────────────────────────────────────┤
│  📅 Survey Schedule                                          │
│  Assigned: Alice Smith   Date: Dec 15, 2024  Time: 10:30  │
├─────────────────────────────────────────────────────────────┤
│  📏 Roof Measurements                                        │
│  Dimensions: 15m × 10m   Usable: 120 sq m                  │
│  Est. Capacity: ~11 kW   Type: RCC   Condition: Good       │
│  Building: 2 floors                                         │
├─────────────────────────────────────────────────────────────┤
│  ☀️ Shadow Analysis                                          │
│  Morning: Minimal shadow from east side tree               │
│  Noon: No significant shadows                              │
│  Evening: Shadow from water tank (2m × 2m)                 │
│  Obstructions: Water tank, TV antenna                      │
├─────────────────────────────────────────────────────────────┤
│  🏗️ Structural & Civil Work                                 │
│  Type: Simple           Civil Work: Yes                     │
│  Notes: Need parapet wall extension for safety             │
├─────────────────────────────────────────────────────────────┤
│  🔌 Cable Routing                                            │
│  Panel→Inverter: 25m    Inverter→DB: 15m                  │
│  Route: Along parapet, through existing conduit            │
├─────────────────────────────────────────────────────────────┤
│  ⚡ Earthing                                                  │
│  Existing: Yes          New Required: No                    │
│  Notes: Good earthing pit available near panel area        │
├─────────────────────────────────────────────────────────────┤
│  🛡️ Safety Assessment                                        │
│  Ladder Access: Available    Parapet Wall: Present         │
│  Notes: Safety harness recommended for installation        │
├─────────────────────────────────────────────────────────────┤
│  📝 Remarks & Notes                                          │
│  Survey: Excellent site for 10-12 kW system installation   │
│  Recommendations: Proceed with system design                │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### Creating a Survey
```
User Input (Form)
    ↓
Validation
    ↓
surveysService.createSurvey()
    ↓
Dexie.js (IndexedDB)
    ↓
Success Notification
    ↓
Navigate to List
```

### Loading Survey List
```
SurveysList Component Mount
    ↓
surveysService.getSurveys()
    ↓
surveysService.getSurveyStats()
    ↓
Enrich with Customer/Engineer Data
    ↓
Update State & Render
```

### Calculations
```
User Types Length: 15
User Types Width: 10
    ↓
useEffect Trigger
    ↓
calculateUsableArea(15, 10)
    ↓
Result: 15 × 10 × 0.8 = 120 sq m
    ↓
estimateSystemCapacity(120)
    ↓
Result: 120 ÷ 11 = ~11 kW
    ↓
Display Auto-calculated Values
```

## 📊 Statistics Calculation

```typescript
getSurveyStats() returns:
{
  total: 12,              // All surveys
  pending: 2,             // Status = "Pending"
  assigned: 3,            // Status = "Assigned"
  inProgress: 5,          // Status = "In-progress"
  completed: 8,           // Status = "Completed"
  revisitRequired: 1,     // Status = "Revisit Required"
  todaysSurveys: 3,       // surveyDate = today
  upcomingSurveys: 7      // surveyDate in next 7 days
}
```

## 🎨 Component Hierarchy

```
SurveyModule
├── SurveysList
│   ├── StatsCards (4)
│   ├── FilterControls
│   │   ├── SearchInput
│   │   └── StatusSelect
│   ├── SurveysTable
│   │   ├── TableHeader
│   │   └── TableRows
│   │       └── ActionButtons (view, edit, delete)
│   └── ConfirmModal (delete)
│
├── SurveyForm
│   ├── FormHeader (title, actions)
│   ├── Card: Basic Information
│   ├── Card: Roof Measurements
│   ├── Card: Shadow Analysis
│   ├── Card: Structural & Civil
│   ├── Card: Cable & Earthing
│   └── Card: Safety & General
│
└── SurveyDetails
    ├── DetailsHeader (status, actions)
    ├── Card: Customer & Lead Info
    ├── Card: Survey Schedule
    ├── Card: Roof Measurements
    ├── Card: Shadow Analysis (conditional)
    ├── Card: Structural Info
    ├── Card: Cable Routing (conditional)
    ├── Card: Earthing
    ├── Card: Safety
    ├── Card: Remarks (conditional)
    ├── ConfirmModal (delete)
    ├── ConfirmModal (complete)
    └── CustomModal (revisit reason)
```

## 🚀 Quick Start Guide

### For Engineers
1. **View Assignments**: Go to `/survey` and filter by your name
2. **Start Survey**: Click assigned survey → Click "Edit"
3. **Record Data**: Fill all technical sections on-site
4. **Mark Complete**: Save and click "Mark Complete"

### For Managers
1. **Schedule Survey**: Go to `/survey` → Click "+ Schedule Survey"
2. **Assign Engineer**: Select lead and engineer, set date/time
3. **Monitor Progress**: View statistics dashboard
4. **Review Completed**: Filter by "Completed" status

### For Developers
1. **Service Layer**: Import `surveysService` for all operations
2. **Create Survey**: Use `createSurvey(data)` with Survey type
3. **Get Statistics**: Use `getSurveyStats()` for dashboard
4. **Filter Data**: Pass filters object to `getSurveys(filters)`

---

**Module Status**: ✅ **PRODUCTION READY**

**Code Quality**:
- ✅ Zero TypeScript errors
- ✅ Zero linting warnings  
- ✅ Fully type-safe
- ✅ Comprehensive error handling
- ✅ User-friendly notifications

**Documentation**:
- ✅ Code comments
- ✅ Function JSDoc
- ✅ Module documentation
- ✅ Usage examples
- ✅ Visual guides
