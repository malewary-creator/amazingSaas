# Projects Module Documentation

## Overview

The Projects Module manages solar installation projects from initiation to completion. It provides comprehensive project tracking with a **10-stage workflow system**, financial management, team assignment, and real-time progress monitoring.

## Module Structure

```
src/modules/projects/
├── ProjectsModule.tsx         # Main routing component
├── ProjectsList.tsx          # Projects list with stats dashboard
├── ProjectForm.tsx           # Create/edit project form
└── ProjectDetails.tsx        # Detailed view with stage tracker

src/services/
└── projectsService.ts        # Project and stage business logic
```

## Features

### 1. Project Dashboard
- **Statistics Cards**: Total projects, active projects, completed, total value
- **Advanced Filters**: Search by project ID/customer/manager, filter by status
- **Projects Table**: Displays project ID, customer, system size, status, progress, value, manager, target date
- **Quick Actions**: View, edit, delete projects
- **Progress Visualization**: Progress bars for each project

### 2. Project Management
- **Auto-Generated Project IDs**: Format `PROJ-YYYY-NNN` (e.g., PROJ-2025-001)
- **Link to Leads**: Every project linked to a lead and customer
- **Quotation Integration**: Optional link to approved quotations
- **Project Status Tracking**: 8 status states
- **Timeline Management**: Start date, target date, completion date
- **Team Assignment**: Project manager and installation team

### 3. 10-Stage Installation Workflow

Each project automatically gets 10 predefined stages:

1. **Material Planning** - Planning required materials
2. **Material Purchase/Booking** - Ordering and booking materials
3. **Material Delivered to Site** - Materials received at installation site
4. **Structure Installation** - Installing mounting structures
5. **Panel Installation** - Installing solar panels
6. **Inverter & Wiring** - Installing inverter and electrical wiring
7. **Earthing & SPD** - Earthing and surge protection devices
8. **Testing & Commissioning** - System testing and commissioning
9. **Documentation & Handover** - Final documentation and handover
10. **Net Meter Application** - Net metering application and approval

### 4. Stage Management
- **Visual Progress Tracker**: Timeline view with color-coded status
- **Stage Actions**: Start, Complete, Skip stages
- **Stage Assignment**: Assign stages to specific team members
- **Comments & Notes**: Add notes to each stage
- **Timestamps**: Track start and end dates for each stage
- **Progress Calculation**: Auto-calculate overall project progress

### 5. Financial Tracking
- Project value
- Amount paid
- Balance amount
- Payment percentage with visual progress bar
- Real-time financial summary

## Data Models

### Project Type
```typescript
interface Project {
  id?: number;
  projectId: string;              // Auto: PROJ-2025-001
  leadId: number;
  customerId: number;
  quotationId?: number;
  
  status: ProjectStatus;
  startDate?: Date;
  targetDate?: Date;
  completionDate?: Date;
  
  systemSize: number;             // kW
  systemType: 'On-grid' | 'Off-grid' | 'Hybrid';
  
  projectValue: number;
  totalPaid?: number;
  balanceAmount?: number;
  
  projectManager?: number;        // User ID
  installationTeam?: number[];    // User IDs array
  
  remarks?: string;
  cancellationReason?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Project Status
- `Planning` - Initial planning phase
- `Material Procurement` - Procuring materials
- `In Progress` - Active installation
- `Installation` - Physical installation ongoing
- `Testing` - Testing phase
- `Completed` - Project completed
- `On-hold` - Temporarily paused
- `Cancelled` - Project cancelled

### ProjectStage Type
```typescript
interface ProjectStage {
  id?: number;
  projectId: number;
  stageName: StageName;
  stageOrder: number;             // 1-10
  status: StageStatus;
  startDate?: Date;
  endDate?: Date;
  assignedTo?: number;
  comments?: string;
  completedBy?: number;
  completedAt?: Date;
}
```

### Stage Status
- `Pending` - Not started
- `In-progress` - Currently working
- `Completed` - Finished
- `Skipped` - Skipped this stage

## Service Functions

### Core CRUD Operations
- `generateProjectId()`: Auto-generate PROJ-YYYY-NNN format ID
- `createProject(data)`: Create project with auto-initialized stages
- `getProjects(filters)`: Get all projects with optional filters
- `getProjectById(id)`: Get single project
- `getProjectWithDetails(id)`: Get project with lead, customer, quotation, manager, team, stages
- `updateProject(id, data)`: Update project
- `deleteProject(id)`: Delete project and all stages

### Stage Management
- `initializeProjectStages(projectId)`: Create all 10 default stages
- `getProjectStages(projectId)`: Get all stages for a project
- `updateStage(stageId, data)`: Update stage details
- `startStage(stageId)`: Mark stage as in-progress
- `completeStage(stageId, userId)`: Mark stage as completed
- `skipStage(stageId, reason)`: Skip a stage with reason
- `getCurrentStage(projectId)`: Get currently active stage
- `assignStage(stageId, userId)`: Assign stage to user

### Progress & Statistics
- `calculateProjectProgress(projectId)`: Calculate % completion based on stages
- `getStageCompletionSummary(projectId)`: Get detailed stage breakdown
- `getProjectStats()`: Get comprehensive statistics
- `getProjectsByStatus(status)`: Filter projects by status
- `getProjectsByManager(managerId)`: Get projects by manager

### Financial
- `updatePayment(projectId, totalPaid)`: Update payment and recalculate balance
- `getPaymentSummary(projectId)`: Get complete payment summary with percentages

## Routes

- `/projects` - Projects list dashboard
- `/projects/new` - Create new project
- `/projects/:id` - View project details with stage tracker
- `/projects/:id/edit` - Edit existing project

## Usage Examples

### Creating a Project
1. Navigate to `/projects`
2. Click "Create Project" button
3. Select a lead (pre-filled if coming from lead details)
4. Optionally select a quotation
5. Enter system details (size, type)
6. Enter financial details (project value, initial payment)
7. Assign project manager
8. Select installation team members
9. Set start and target dates
10. Add any remarks
11. Save project

**Result**: Project created with auto-generated ID and all 10 stages initialized to "Pending"

### Managing Project Stages
1. Navigate to project details (`/projects/:id`)
2. View the 10-stage progress timeline
3. For each stage:
   - **Pending**: Click "Start" to begin the stage
   - **In-progress**: Click "Complete" to finish the stage
   - Can skip stages if not applicable
4. Project progress auto-updates as stages complete
5. Overall progress bar shows completion percentage

### Tracking Progress
The project details page shows:
- **Overall Progress**: Visual progress bar with percentage
- **Stage Breakdown**: Completed/In-progress/Pending/Skipped counts
- **Financial Progress**: Payment progress bar
- **Timeline**: Start date, target date, completion date
- **Visual Stage Tracker**: Color-coded timeline of all 10 stages

### Financial Management
1. Create project with initial `projectValue`
2. Record `totalPaid` as payments come in
3. System auto-calculates `balanceAmount`
4. Payment progress bar shows percentage paid
5. Update payment using `updatePayment()` service function

## Workflow

### Project Lifecycle
```
Lead Created → Survey Done → Quotation Approved → Project Created
    ↓
Planning (Status)
    ↓
Material Procurement (Status)
    ↓
In Progress (Status)
    ↓ (10 Stages Execute)
Installation (Status)
    ↓
Testing (Status)
    ↓
Completed (Status) + completionDate set
```

### Stage Execution Flow
```
All Stages: Pending
    ↓
Stage 1: Material Planning
    ↓ Start → In-progress
    ↓ Complete → Completed
Stage 2: Material Purchase/Booking
    ↓ Start → In-progress
    ↓ Complete → Completed
...
Stage 10: Net Meter Application
    ↓ Complete → Completed

Progress: 100% → Project Status: Completed
```

## Integration Points

### With Leads Module
- Projects created from approved leads
- Lead status updates when project created
- Lead ID and customer data linked

### With Quotations Module
- Projects can link to approved quotations
- Quotation data pre-fills system size and value
- Quotation status updated

### With Users Module
- Project managers assigned from users
- Installation team members from users
- Stage assignments to specific users
- Completion tracking by user

## Best Practices

### Project Creation
- Always link to an existing lead
- Link quotation if available for accurate values
- Assign project manager before starting
- Select installation team early
- Set realistic target dates
- Start project only when ready

### Stage Management
- Start stages in sequence (don't skip ahead)
- Complete one stage before starting next
- Add comments for important notes
- Assign stages to specific team members
- Document reasons if skipping stages
- Update stages promptly

### Financial Tracking
- Enter accurate project value
- Update payments as received
- Monitor balance amount
- Track payment percentage
- Ensure full payment before completion

### Team Management
- Assign experienced project manager
- Select appropriate team size
- Ensure team availability
- Assign stages based on expertise
- Track individual contributions

## Validation Rules

### Required Fields
- Lead selection (mandatory)
- System size > 0 (mandatory)
- Project value > 0 (mandatory)

### Business Rules
- Cannot delete project with payments
- Cannot skip stage without reason
- Cannot complete stage without starting
- Target date must be after start date
- Balance = Project Value - Total Paid
- Progress = (Completed Stages / Total Stages) × 100

## Status Color Coding

### Project Status
- **Planning**: Yellow
- **Material Procurement**: Orange
- **In Progress**: Blue
- **Installation**: Blue
- **Testing**: Purple
- **Completed**: Green
- **On-hold**: Gray
- **Cancelled**: Red

### Stage Status
- **Pending**: Gray
- **In-progress**: Blue
- **Completed**: Green (with checkmark)
- **Skipped**: Gray (with X)

## Performance Considerations

### Data Loading
- Projects list enriched with customer and manager names
- Progress calculated on-demand
- Stages loaded with project details
- Efficient filtering on IndexedDB

### Real-time Updates
- Progress auto-calculates when stages update
- Financial summary updates with payments
- Statistics refresh after changes

## Error Handling

### Form Validation
- Lead not selected: "Please select a lead"
- Invalid system size: "Please enter valid system size"
- Invalid project value: "Please enter valid project value"

### Data Loading
- Project not found: Redirect to projects list
- Lead not found: Display error message
- Stage not found: Skip stage updates

### Actions
- Delete confirmation required
- Stage action confirmations
- Success/error toast notifications

## Calculations

### Progress Calculation
```typescript
progress = (completedStages / totalStages) × 100
// Example: 7 completed out of 10 = 70%
```

### Financial Calculation
```typescript
balanceAmount = projectValue - totalPaid
paymentPercentage = (totalPaid / projectValue) × 100
```

### Stage Ordering
```typescript
stageOrder = 1 to 10
Sorted by stageOrder for display
```

## Future Enhancements

- [ ] Material tracking per stage
- [ ] Photo upload for each stage
- [ ] Stage duration analytics
- [ ] Gantt chart view
- [ ] Project templates
- [ ] Milestone notifications
- [ ] Performance reports
- [ ] Resource allocation
- [ ] Budget vs actual tracking
- [ ] Quality checkpoints
- [ ] Customer portal access
- [ ] SMS notifications per stage
- [ ] Email reports
- [ ] Export project reports
- [ ] Clone project functionality

## Testing Checklist

- [ ] Create project with all fields
- [ ] Create project with minimum fields
- [ ] Edit existing project
- [ ] Delete project confirmation
- [ ] Start stage (Pending → In-progress)
- [ ] Complete stage (In-progress → Completed)
- [ ] Skip stage with reason
- [ ] Progress calculation accuracy
- [ ] Payment calculation accuracy
- [ ] Balance amount calculation
- [ ] Search projects by ID
- [ ] Search by customer name
- [ ] Filter by status
- [ ] View project details
- [ ] Navigate through stages
- [ ] Team member selection
- [ ] Project manager assignment
- [ ] Date validations
- [ ] Financial summary display
- [ ] Statistics accuracy

---

**Module Status**: ✅ Complete and Production Ready

**Last Updated**: November 2025
