# Survey Module Documentation

## Overview

The Survey module manages site surveys for solar installation planning. It handles the complete survey workflow from scheduling to technical assessment, including roof measurements, shadow analysis, structural evaluation, cable routing, earthing, and safety assessments.

## Module Structure

```
src/modules/survey/
├── SurveyModule.tsx      # Main routing component
├── SurveysList.tsx       # Survey list with filters and stats
├── SurveyForm.tsx        # Create/edit survey form
└── SurveyDetails.tsx     # Detailed survey view

src/services/
└── surveysService.ts     # Survey business logic
```

## Features

### 1. Survey Dashboard
- **Statistics Cards**: Total surveys, today's surveys, in-progress, completed
- **Filters**: Search by customer/engineer/lead, filter by status
- **Survey List**: Displays customer, date, engineer, status, usable area
- **Quick Actions**: View, edit, delete surveys

### 2. Survey Scheduling
- Link survey to existing lead
- Assign survey to engineer
- Set survey date and preferred time
- Track survey status (Pending → Assigned → In-progress → Completed)

### 3. Technical Assessment

#### Roof Measurements
- Length and width dimensions (meters)
- **Auto-calculated usable area** (length × width × 0.8 efficiency factor)
- **Estimated system capacity** (~10-12 sq m per kW)
- Roof type (RCC, Sheet, Tile, Asbestos)
- Roof condition (Excellent, Good, Fair, Poor)
- Building height (floors)

#### Shadow Analysis
- Morning shadow patterns
- Noon shadow patterns
- Evening shadow patterns
- Nearby obstructions (buildings, trees, poles, water tanks)

#### Structural Assessment
- Structure type (Simple, Elevated, Special)
- Civil work requirements
- Structural notes

#### Cable Routing
- Panel to inverter distance (meters)
- Inverter to distribution board distance (meters)
- Cable route planning notes

#### Earthing
- Existing earthing availability
- New earthing requirements
- Earthing implementation notes

#### Safety Assessment
- Ladder access availability
- Parapet wall presence
- Safety concerns and PPE requirements

### 4. Survey Actions
- **Mark as Completed**: Change survey status to completed
- **Mark for Revisit**: Flag survey for revisit with reason
- **Edit Survey**: Update survey information
- **Delete Survey**: Remove survey (includes associated photos)

## Data Model

### Survey Type
```typescript
interface Survey {
  id?: number;
  leadId: number;
  assignedTo: number;
  status: 'Pending' | 'Assigned' | 'In-progress' | 'Completed' | 'Revisit Required';
  surveyDate?: Date;
  preferredTime?: string;
  
  // Roof measurements
  roofLength?: number;
  roofWidth?: number;
  usableArea?: number;
  roofType?: string;
  roofCondition?: string;
  buildingHeight?: number;
  
  // Shadow analysis
  shadowAnalysis?: {
    morningNotes?: string;
    noonNotes?: string;
    eveningNotes?: string;
    nearbyObstructions?: string;
  };
  
  // Structural
  structureType?: 'Simple' | 'Elevated' | 'Special';
  civilWorkRequired?: boolean;
  civilWorkNotes?: string;
  
  // Cable routing
  panelToInverterDistance?: number;
  inverterToDBDistance?: number;
  cableRouteNotes?: string;
  
  // Earthing
  existingEarthing?: boolean;
  newEarthingRequired?: boolean;
  earthingNotes?: string;
  
  // Safety
  ladderAccess?: boolean;
  parapetWall?: boolean;
  safetyNotes?: string;
  
  // General
  surveyRemarks?: string;
  revisitReason?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}
```

## Service Functions

### Core CRUD Operations
- `createSurvey(data)`: Create new survey
- `getSurveys(filters)`: Get all surveys with optional filters
- `getSurveyById(id)`: Get single survey
- `getSurveyWithDetails(id)`: Get survey with lead, customer, and engineer data
- `updateSurvey(id, data)`: Update survey
- `deleteSurvey(id)`: Delete survey and associated photos

### Statistics
- `getSurveyStats()`: Get comprehensive statistics
  - Total surveys
  - Pending, Assigned, In-progress, Completed, Revisit required counts
  - Today's surveys
  - Upcoming surveys

### Filtering
- `getTodaysSurveys()`: Get surveys scheduled for today
- `getUpcomingSurveys(days)`: Get surveys in next N days (default 7)
- `getSurveysByEngineer(engineerId, status)`: Get surveys by engineer

### Workflow Actions
- `assignSurvey(id, engineerId)`: Assign survey to engineer (sets status to "Assigned")
- `completeSurvey(id)`: Mark survey as completed
- `markForRevisit(id, reason)`: Flag survey for revisit

### Calculations
- `calculateUsableArea(length, width)`: Calculate usable roof area (length × width × 0.8)
- `estimateSystemCapacity(usableArea)`: Estimate solar system capacity in kW

## Routes

- `/survey` - Survey list dashboard
- `/survey/new` - Create new survey
- `/survey/:id` - View survey details
- `/survey/:id/edit` - Edit existing survey

## Usage Examples

### Creating a Survey
1. Navigate to `/survey`
2. Click "Schedule Survey" button
3. Select a lead from dropdown (or navigate from lead details with pre-filled leadId)
4. Assign to an engineer
5. Set survey date and preferred time
6. Fill technical assessment sections as needed
7. Save survey

### Conducting a Survey
1. Engineer opens assigned survey from list
2. Clicks "Edit" to update survey
3. Records all measurements on-site:
   - Roof dimensions (auto-calculates usable area)
   - Shadow patterns at different times
   - Structural requirements
   - Cable routing distances
   - Earthing status
   - Safety considerations
4. Adds survey remarks
5. Saves and marks as "Completed"

### Handling Revisits
1. Open survey details
2. Click "Mark for Revisit"
3. Enter reason for revisit
4. Survey status changes to "Revisit Required"
5. Can reassign and reschedule

## Calculation Logic

### Usable Area Calculation
```typescript
usableArea = roofLength × roofWidth × 0.8
// 0.8 factor accounts for:
// - Shadow areas
// - Obstructions
// - Maintenance space
// - Structural limitations
```

### System Capacity Estimation
```typescript
systemCapacity = usableArea / 11
// Assumes 10-12 sq meters per kW
// Uses 11 as middle value
// Displays as approximate value (~X kW)
```

## Integration Points

### With Leads Module
- Survey is always linked to a lead
- Can create survey from lead details page
- Lead status updates when survey is completed

### With Users/Engineers
- Surveys assigned to engineers
- Engineer dashboard shows assigned surveys
- Filtered views by engineer

### With Survey Photos Module
- Survey details can display related photos
- Photos linked by surveyId
- 7 photo types supported:
  - Roof Top View
  - Electrical Panel
  - Inverter Location
  - Nearby Obstructions
  - Building Structure
  - Earthing Point
  - Other

## Best Practices

### Survey Scheduling
- Always link survey to an active lead
- Assign to engineer with appropriate skills/availability
- Set realistic survey dates
- Provide preferred time for customer convenience

### Technical Assessment
- Record accurate roof measurements
- Document shadow patterns at different times of day
- Note all obstructions and their positions
- Measure actual cable routing distances
- Check existing earthing properly
- Document all safety concerns

### Data Entry
- Fill all relevant sections
- Use descriptive notes
- Take comprehensive photos
- Add survey remarks for context
- Flag issues that need attention

### Status Management
- Start with "Pending" when scheduling
- Auto-set to "Assigned" when assigning engineer
- Update to "In-progress" when survey starts
- Mark "Completed" only after thorough assessment
- Use "Revisit Required" with clear reason

## Validation Rules

### Required Fields
- Lead selection (mandatory)
- Engineer assignment (mandatory)
- Survey date (recommended)

### Optional but Important
- Roof measurements (for capacity estimation)
- Shadow analysis (for performance prediction)
- Structural assessment (for installation planning)
- Cable routing (for material estimation)
- Safety assessment (for risk mitigation)

## Status Workflow

```
Pending
  ↓ (Assign Engineer)
Assigned
  ↓ (Start Survey)
In-progress
  ↓ (Complete Assessment)
Completed
  ↓ (If Issues Found)
Revisit Required
  ↓ (Reassign & Reschedule)
[Back to Assigned]
```

## Error Handling

### Form Validation
- Lead not selected: "Please select a lead"
- Engineer not assigned: "Please assign an engineer"
- Invalid date: Date validation with min date check

### Data Loading
- Survey not found: Redirect to survey list with error message
- Lead not found: Display "N/A" for customer details
- Engineer not assigned: Display "Not assigned"

### Deletion Safety
- Confirmation modal before delete
- Cascading delete for associated photos
- Success/error notifications

## Performance Considerations

### Data Loading
- Surveys list enriched with customer and engineer names
- Single query for statistics
- Efficient filtering on IndexedDB

### Form Optimization
- Auto-calculation on input change (debounced)
- Conditional rendering of optional sections
- Lazy loading of dropdown data

## Future Enhancements

- [ ] Survey photo capture and upload
- [ ] GPS location tracking
- [ ] Voice notes for quick observations
- [ ] Survey report PDF generation
- [ ] Survey templates for common scenarios
- [ ] Weather data integration
- [ ] Solar calculator integration
- [ ] Share survey with team members
- [ ] Survey comparison across sites
- [ ] Performance prediction based on survey data

## Testing Checklist

- [ ] Create survey without measurements (basic scheduling)
- [ ] Create survey with full technical assessment
- [ ] Auto-calculation of usable area works
- [ ] System capacity estimation displays
- [ ] Edit existing survey preserves data
- [ ] Status filters work correctly
- [ ] Search by customer/engineer/lead works
- [ ] Mark survey as completed
- [ ] Mark survey for revisit with reason
- [ ] Delete survey confirmation
- [ ] Statistics cards show correct counts
- [ ] Navigation from lead to survey works
- [ ] Engineer assignment dropdown populates
- [ ] Date/time selection works
- [ ] All section checkboxes work
- [ ] Textarea fields save properly

---

**Module Status**: ✅ Complete and Production Ready

**Last Updated**: December 2024
