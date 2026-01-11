/**
 * Seed dummy data for HR module testing
 */

import { employeeService } from '@/services/employeeService';
import { attendanceService } from '@/services/attendanceService';
import { expenseService } from '@/services/expenseService';
import { leaveService } from '@/services/leaveService';
import { salaryService } from '@/services/salaryService';
import type { EmployeeCategory, ExpenseCategory } from '@/types';

export async function seedHRData() {
  console.log('🌱 Seeding HR data...');

  try {
    // Create employees
    const employees = [
      {
        name: 'Rajesh Kumar',
        category: 'Computer Operator' as EmployeeCategory,
        phone: '9876543210',
        email: 'rajesh.kumar@example.com',
        address: {
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
        },
        idProofType: 'Aadhaar' as const,
        idProofNumber: 'XXXX-XXXX-1234',
        joiningDate: new Date('2024-01-15'),
        status: 'active' as const,
        emergencyContactName: 'Sunita Kumar',
        emergencyContactPhone: '9876543211',
        bankAccountNumber: '1234567890',
        ifscCode: 'SBIN0001234',
      },
      {
        name: 'Amit Sharma',
        category: 'Welder' as EmployeeCategory,
        phone: '9876543220',
        email: 'amit.sharma@example.com',
        address: {
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
        },
        idProofType: 'PAN' as const,
        idProofNumber: 'ABCDE1234F',
        joiningDate: new Date('2024-03-10'),
        status: 'active' as const,
        emergencyContactName: 'Priya Sharma',
        emergencyContactPhone: '9876543221',
        bankAccountNumber: '9876543210',
        ifscCode: 'HDFC0001234',
      },
      {
        name: 'Suresh Patel',
        category: 'Labour' as EmployeeCategory,
        phone: '9876543230',
        address: {
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380001',
        },
        idProofType: 'Aadhaar' as const,
        idProofNumber: 'XXXX-XXXX-5678',
        joiningDate: new Date('2024-02-20'),
        status: 'active' as const,
        emergencyContactName: 'Ramesh Patel',
        emergencyContactPhone: '9876543231',
      },
      {
        name: 'Vijay Singh',
        category: 'Supervisor' as EmployeeCategory,
        phone: '9876543240',
        email: 'vijay.singh@example.com',
        address: {
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302001',
        },
        idProofType: 'Driving License' as const,
        idProofNumber: 'DL-1234567890',
        joiningDate: new Date('2023-11-05'),
        status: 'active' as const,
        emergencyContactName: 'Lakshmi Singh',
        emergencyContactPhone: '9876543241',
        bankAccountNumber: '5555666677',
        ifscCode: 'ICIC0001234',
      },
      {
        name: 'Ramesh Kumar',
        category: 'Temporary Hiring' as EmployeeCategory,
        phone: '9876543250',
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
        idProofType: 'Voter ID' as const,
        idProofNumber: 'VOT1234567',
        joiningDate: new Date('2025-01-05'),
        status: 'active' as const,
        emergencyContactName: 'Geeta Kumar',
        emergencyContactPhone: '9876543251',
      },
    ];

    const employeeIds: number[] = [];
    for (const emp of employees) {
      const id = await employeeService.createEmployee(emp);
      employeeIds.push(id);
      console.log(`✓ Created employee: ${emp.name} (ID: ${id})`);
    }

    // Setup salaries for employees
    console.log('\n💰 Setting up salaries...');
    
    // Computer Operator - Monthly Fixed
    await salaryService.setupSalary({
      employeeId: employeeIds[0],
      salaryType: 'Monthly',
      salaryStructure: 'Fixed',
      baseSalary: 25000,
      da: 2000,
      hra: 5000,
      conveyance: 1500,
      effectiveDate: new Date('2024-01-15'),
      status: 'active',
    });

    // Welder - Daily
    await salaryService.setupSalary({
      employeeId: employeeIds[1],
      salaryType: 'Daily',
      salaryStructure: 'Fixed',
      dailyRate: 800,
      effectiveDate: new Date('2024-03-10'),
      status: 'active',
    });

    // Labour - Daily
    await salaryService.setupSalary({
      employeeId: employeeIds[2],
      salaryType: 'Daily',
      salaryStructure: 'Fixed',
      dailyRate: 600,
      effectiveDate: new Date('2024-02-20'),
      status: 'active',
    });

    // Supervisor - Monthly Fixed
    await salaryService.setupSalary({
      employeeId: employeeIds[3],
      salaryType: 'Monthly',
      salaryStructure: 'Fixed',
      baseSalary: 35000,
      da: 3000,
      hra: 7000,
      conveyance: 2000,
      effectiveDate: new Date('2023-11-05'),
      status: 'active',
    });

    // Temporary - Daily
    await salaryService.setupSalary({
      employeeId: employeeIds[4],
      salaryType: 'Daily',
      salaryStructure: 'Fixed',
      dailyRate: 500,
      effectiveDate: new Date('2025-01-05'),
      status: 'active',
    });

    console.log('✓ Salaries configured');

    // Add attendance for current month
    console.log('\n📋 Adding attendance records...');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Add attendance for last 10 days
    for (let i = 10; i >= 1; i--) {
      const date = new Date(currentYear, currentMonth, today.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const empId of employeeIds.slice(0, 4)) { // First 4 employees present
        const checkInTime = new Date(date);
        checkInTime.setHours(9, 0, 0);
        
        const checkOutTime = new Date(date);
        checkOutTime.setHours(18, 0, 0);

        await attendanceService.recordAttendance({
          employeeId: empId,
          date: date,
          status: 'Present',
          checkInTime,
          checkOutTime,
          workingHours: 9 * 3600, // 9 hours in seconds
          siteId: `Site-${Math.floor(Math.random() * 3) + 1}`,
        });
      }
    }

    // Add today's attendance (checked in, not checked out yet)
    for (const empId of employeeIds.slice(0, 3)) {
      await attendanceService.checkIn(empId, `Site-${Math.floor(Math.random() * 3) + 1}`);
    }

    console.log('✓ Attendance records added');

    // Add some leave applications
    console.log('\n🏖️ Adding leave applications...');
    
    // Pending leave
    await leaveService.applyLeave({
      employeeId: employeeIds[0],
      leaveType: 'Casual',
      fromDate: new Date(currentYear, currentMonth, today.getDate() + 5),
      toDate: new Date(currentYear, currentMonth, today.getDate() + 7),
      numberOfDays: 3,
      entitlement: 'Paid',
      reason: 'Family function',
      status: 'Applied',
    });

    // Approved leave
    const approvedLeaveId = await leaveService.applyLeave({
      employeeId: employeeIds[1],
      leaveType: 'Sick',
      fromDate: new Date(currentYear, currentMonth, today.getDate() - 3),
      toDate: new Date(currentYear, currentMonth, today.getDate() - 2),
      numberOfDays: 2,
      entitlement: 'Paid',
      reason: 'Medical checkup',
      status: 'Applied',
    });
    await leaveService.approveLeave(approvedLeaveId, 1, 'Approved for medical reasons');

    console.log('✓ Leave applications added');

    // Add daily expenses
    console.log('\n💸 Adding expenses...');
    
    const expenseCategories: ExpenseCategory[] = [
      'Tea / Coffee',
      'Naasta / Food',
      'Water Can',
      'Travel / Fuel',
      'Misc Site Expenses',
    ];

    // Add expenses for last 7 days
    for (let i = 7; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth, today.getDate() - i);
      
      // Add 2-4 expenses per day
      const numExpenses = Math.floor(Math.random() * 3) + 2;
      for (let j = 0; j < numExpenses; j++) {
        const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        const amount = Math.floor(Math.random() * 500) + 100;
        
        const expenseId = await expenseService.addExpense({
          date,
          category,
          amount,
          description: `Daily ${category.toLowerCase()} expense`,
          site: `Site-${Math.floor(Math.random() * 3) + 1}`,
          status: i > 2 ? 'Approved' : 'Pending',
        });

        // Approve older expenses
        if (i > 2) {
          await expenseService.approveExpense(expenseId, 1, 'Approved');
        }
      }
    }

    console.log('✓ Expenses added');

    console.log('\n✅ HR data seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- ${employees.length} employees created`);
    console.log(`- ${employees.length} salary setups configured`);
    console.log('- Attendance records for last 10 working days');
    console.log('- 2 leave applications (1 pending, 1 approved)');
    console.log('- ~20 expense records (recent ones pending)');
    console.log('\nYou can now visit:');
    console.log('- http://localhost:3000/employees');
    console.log('- http://localhost:3000/employees/attendance/checkin');
    console.log('- http://localhost:3000/employees/leaves');
    console.log('- http://localhost:3000/expenses');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

// Auto-run if called directly
if (typeof window !== 'undefined') {
  // Browser environment - expose globally
  (window as any).seedHRData = seedHRData;
}
