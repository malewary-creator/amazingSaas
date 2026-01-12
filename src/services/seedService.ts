import { db } from '@/services/database';
import { settingsService } from '@/services/settingsService';
import type {
  Address,
  Customer,
  Lead,
  Survey,
  Item,
  Quotation,
  QuotationItem,
  Project,
  ProjectStage,
} from '@/types';

type SeedCounts = {
  customers?: number;
  leads?: number;
  surveys?: number;
  projects?: number;
  quotations?: number;
  invoices?: number;
  payments?: number;
  items?: number;
  serviceTickets?: number;
};

const year = new Date().getFullYear();
const pad3 = (n: number) => String(n).padStart(3, '0');

function seq(prefix: string, index: number) {
  return `${prefix}-${year}-${pad3(index)}`;
}

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeAddress(): Address {
  const cities = ['Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Aurangabad', 'Thane'];
  const states = ['Maharashtra', 'Gujarat', 'Karnataka', 'Madhya Pradesh'];
  const city = randomOf(cities);
  return {
    city,
    state: randomOf(states),
    pincode: String(400000 + Math.floor(Math.random() * 50000)),
    area: 'Main Road',
  };
}

function makeCustomer(i: number): Customer {
  const names = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikas', 'Neha', 'Akash', 'Pooja'];
  const lastNames = ['Patil', 'Sharma', 'Joshi', 'Khan', 'Deshmukh', 'Kulkarni'];
  const name = `${randomOf(names)} ${randomOf(lastNames)}`;
  return {
    customerId: `CUST-${pad3(i)}`,
    name,
    mobile: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}${i}@example.com`,
    address: makeAddress(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeLead(customerId: number, i: number): Lead {
  const sources: Lead['source'][] = ['Referral', 'Social Media', 'Website', 'Advertisement'];
  const statuses: Lead['status'][] = ['New', 'In-progress', 'Converted', 'On-hold'];
  const systemTypes: Lead['systemType'][] = ['On-grid', 'Off-grid', 'Hybrid'];
  return {
    leadId: seq('LEAD', i),
    customerId,
    source: randomOf(sources),
    status: randomOf(statuses),
    assignedTo: 1,
    requiredSystemSize: Number((3 + Math.random() * 7).toFixed(1)),
    systemType: randomOf(systemTypes),
    roofType: randomOf(['RCC', 'Sheet', 'Tile', 'Ground']),
    tentativeBudget: 200000 + Math.floor(Math.random() * 600000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeSurvey(leadId: number): Survey {
  const status: Survey['status'][] = ['Pending', 'Assigned', 'In-progress', 'Completed'];
  return {
    leadId,
    assignedTo: 2,
    status: randomOf(status),
    surveyDate: new Date(),
    roofLength: Number((10 + Math.random() * 20).toFixed(1)),
    roofWidth: Number((8 + Math.random() * 15).toFixed(1)),
    usableArea: Number((60 + Math.random() * 120).toFixed(1)),
    panelToInverterDistance: 15 + Math.floor(Math.random() * 30),
    inverterToDBDistance: 5 + Math.floor(Math.random() * 20),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Survey;
}

function makeItems(count: number): Item[] {
  const items: Item[] = [];
  for (let i = 1; i <= count; i++) {
    const category = randomOf(['Panel', 'Inverter', 'Structure', 'Cable', 'Protection Device', 'Accessory'] as Item['category'][]);
    const base: Item = {
      itemCode: `ITEM-${pad3(i)}`,
      category,
      name: `${category} ${i}`,
      brand: randomOf(['LONGi', 'Adani', 'Waaree', 'Fronius', 'Sungrow', 'ABB']),
      model: `M-${pad3(i)}`,
      specification: 'Standard',
      status: 'active',
      unit: category === 'Cable' ? 'Meter' : 'Nos',
      gstRate: randomOf([5, 12, 18]),
      sellingPrice: 1000 + Math.floor(Math.random() * 20000),
      currentStock: 10 + Math.floor(Math.random() * 50),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Item;
    if (category === 'Panel') base.wattage = randomOf([450, 500, 550]);
    if (category === 'Inverter') base.capacity = randomOf([3, 5, 10, 25]);
    items.push(base);
  }
  return items;
}

function makeQuotation(leadId: number, customerId: number, index: number): Quotation {
  const quotationNumber = seq('QUO', index);
  const basePrice = 100000 + Math.floor(Math.random() * 600000);
  const gstPercent = 18;
  const discountPercent = randomOf([0, 2, 5]);
  const subtotal = basePrice;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const taxableAmount = subtotal - discountAmount;
  const totalGST = Math.round((taxableAmount * gstPercent) / 100);
  const grandTotal = taxableAmount + totalGST;

  return {
    quotationNumber,
    leadId,
    customerId,
    status: 'Draft',
    quotationDate: new Date(),
    validityDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    companyName: 'Shine Electrical & Solar',
    clientName: 'Valued Customer',
    projectPurpose: randomOf(['Residential', 'Commercial', 'Industrial']),
    phase: randomOf(['1ph', '3ph']),
    siteLocation: makeAddress().city,
    systemType: randomOf(['On-grid', 'Off-grid', 'Hybrid']),
    dcCapacity: Number((3 + Math.random() * 7).toFixed(1)),
    moduleTechnology: randomOf(['Mono PERC', 'Polycrystalline']),
    inverterType: randomOf(['String Inverter', 'Hybrid Inverter']),
    mountingStructure: 'GI Structure',
    safetyDevices: 'DC SPD, AC SPD, Earthing',
    powerEvacuation: 'Net Metering',
    developerName: 'Shine Electrical',
    offerValidityDays: 15,
    plantCapacity: Number((3 + Math.random() * 7).toFixed(1)),
    priceBasis: 'Lump Sum',
    basePrice,
    gstPercent,
    subtotal,
    discountAmount,
    discountPercent,
    taxableAmount,
    cgst: gstPercent / 2,
    sgst: gstPercent / 2,
    totalGST,
    grandTotal,
    paymentSchedule: [
      { percentage: 40, condition: 'Advance on Booking' },
      { percentage: 50, condition: 'On Material Delivery' },
      { percentage: 10, condition: 'After Commissioning' },
    ],
    termsAndConditions: 'Standard EPC terms apply. Prices subject to change.',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Quotation;
}

function makeQuotationItems(quotationId: number, items: Item[]): QuotationItem[] {
  const lines: QuotationItem[] = [];
  const pick = items.slice(0, Math.min(5, items.length));
  let lineNumber = 1;
  for (const it of pick) {
    const qty = it.category === 'Cable' ? 50 + Math.floor(Math.random() * 100) : 1 + Math.floor(Math.random() * 4);
    const unitPrice = it.sellingPrice || 1000;
    const discount = randomOf([0, 2, 5]);
    const taxableAmount = Math.round(qty * unitPrice * (1 - discount / 100));
    const gstRate = it.gstRate || 18;
    const gstAmount = Math.round((taxableAmount * gstRate) / 100);
    const totalAmount = taxableAmount + gstAmount;
    lines.push({
      quotationId,
      itemId: (it.id as number) || 0,
      lineNumber: lineNumber++,
      component: it.name,
      specification: it.specification || '',
      quantity: qty,
      make: it.brand,
      unit: it.category === 'Cable' ? 'Meter' : 'Nos',
      unitPrice,
      discount,
      taxableAmount,
      gstRate,
      gstAmount,
      totalAmount,
    });
  }
  return lines;
}

function defaultProjectStages(projectId: number): ProjectStage[] {
  const names: ProjectStage['stageName'][] = [
    'Material Planning',
    'Material Purchase/Booking',
    'Material Delivered to Site',
    'Structure Installation',
    'Panel Installation',
    'Inverter & Wiring',
    'Earthing & SPD',
    'Testing & Commissioning',
    'Documentation & Handover',
    'Net Meter Application',
  ];
  return names.map((n, idx) => ({
    projectId,
    stageName: n,
    stageOrder: idx + 1,
    status: idx === 0 ? 'In-progress' : 'Pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

export async function seedDemoData(options?: { reset?: boolean; counts?: SeedCounts }) {
  const counts: Required<SeedCounts> = {
    customers: options?.counts?.customers ?? 20,
    leads: options?.counts?.leads ?? 24,
    surveys: options?.counts?.surveys ?? 16,
    projects: options?.counts?.projects ?? 12,
    quotations: options?.counts?.quotations ?? 15,
    invoices: options?.counts?.invoices ?? 10,
    payments: options?.counts?.payments ?? 20,
    items: options?.counts?.items ?? 25,
    serviceTickets: options?.counts?.serviceTickets ?? 8,
  } as Required<SeedCounts>;

  if (options?.reset) {
    await db.clearAllData();
    await db.seedInitialData();
  }

  // Seed Items first (used by quotations and stock)
  const existingItems = await db.items.count();
  if (existingItems === 0) {
    const items = makeItems(counts.items);
    await db.items.bulkAdd(items);
  }
  const itemsAll = await db.items.toArray();

  // Customers
  const customers: Customer[] = [];
  for (let i = 1; i <= counts.customers; i++) {
    customers.push(makeCustomer(i));
  }
  await db.customers.bulkAdd(customers);

  // Leads
  const leads: Lead[] = [];
  for (let i = 1; i <= counts.leads; i++) {
    const customerIndex = 1 + Math.floor(Math.random() * counts.customers);
    const customerRecord = await db.customers.offset(customerIndex - 1).limit(1).toArray();
    const customerId = customerRecord[0]?.id as number;
    leads.push(makeLead(customerId, i));
  }
  await db.leads.bulkAdd(leads);
  const leadsAll = await db.leads.toArray();

  // Surveys for a subset of leads
  const surveys: Survey[] = [];
  for (let i = 0; i < counts.surveys; i++) {
    const lead = randomOf(leadsAll);
    surveys.push(makeSurvey(lead.id as number));
  }
  await db.surveys.bulkAdd(surveys);

  // Quotations
  const quotations: Quotation[] = [];
  for (let i = 1; i <= counts.quotations; i++) {
    const lead = randomOf(leadsAll);
    const customer = await db.customers.get(lead.customerId);
    quotations.push(makeQuotation(lead.id as number, customer?.id as number, i));
  }
  await db.quotations.bulkAdd(quotations);
  const insertedQuotations = await db.quotations.toArray();

  // Quotation Items
  const qItems: QuotationItem[] = [];
  for (const q of insertedQuotations.slice(0, counts.quotations)) {
    qItems.push(...makeQuotationItems(q.id as number, itemsAll));
  }
  if (qItems.length) await db.quotationItems.bulkAdd(qItems);

  // Projects based on some quotations/leads
  const projects: Project[] = [];
  const statuses: Project['status'][] = ['Planning', 'Material Procurement', 'In Progress', 'Installation', 'Testing', 'Completed'];
  for (let i = 1; i <= counts.projects; i++) {
    const lead = randomOf(leadsAll);
    const customer = await db.customers.get(lead.customerId);
    const linkedQuotation = randomOf(insertedQuotations);
    projects.push({
      projectId: seq('PROJ', i),
      leadId: lead.id as number,
      customerId: customer?.id as number,
      quotationId: linkedQuotation?.id,
      status: randomOf(statuses),
      startDate: new Date(),
      systemSize: linkedQuotation?.plantCapacity || lead.requiredSystemSize || 5,
      systemType: (linkedQuotation?.systemType as Project['systemType']) || (lead.systemType as Project['systemType']) || 'On-grid',
      caseType: randomOf(['Cash', 'Finance']),
      projectValue: linkedQuotation?.grandTotal || (300000 + Math.floor(Math.random() * 700000)),
      paymentSchedule: {
        termsName: '40-50-10',
        stages: [
          { stage: 'Booking', percentage: 40, status: 'Due' },
          { stage: 'Material', percentage: 50, status: 'Due' },
          { stage: 'Final', percentage: 10, status: 'Due' },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Project);
  }
  await db.projects.bulkAdd(projects);
  const projectsAll = await db.projects.toArray();

  // Project Stages
  const stages: ProjectStage[] = [];
  for (const p of projectsAll) stages.push(...defaultProjectStages(p.id as number));
  if (stages.length) await db.projectStages.bulkAdd(stages);

  // Invoices & Payments
  // Basic invoice based on quotation totals
  const invoices: any[] = [];
  const invoiceItems: any[] = [];
  const invoiceItemCounts: number[] = [];
  const payments: any[] = [];
  for (const p of projectsAll.slice(0, counts.invoices)) {
    const q = p.quotationId ? await db.quotations.get(p.quotationId) : randomOf(insertedQuotations);
    const invoiceNumber = seq('INV', p.id as number);
    const gstType = 'Intra-state';
    const taxableAmount = q?.taxableAmount || Math.floor(p.projectValue * 0.85);
    const totalGST = Math.round((taxableAmount * 18) / 100);
    const grandTotal = taxableAmount + totalGST;
    const customer = await db.customers.get(p.customerId);
    invoices.push({
      invoiceNumber,
      invoiceType: 'Tax Invoice',
      projectId: p.id,
      customerId: p.customerId,
      status: 'Generated',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      paymentTerms: '10 days',
      billingAddress: customer?.address,
      shippingAddress: customer?.address,
      placeOfSupply: customer?.address.state || 'Maharashtra',
      gstType,
      companyGSTIN: '27ABCDE1234F1Z5',
      customerGSTIN: '27ABCDE5678G1Z6',
      reverseCharge: false,
      subtotal: taxableAmount,
      taxableAmount,
      totalGST,
      grandTotal,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Payments will be generated after invoice totals are finalized
  }

  // Invoice Items - populate line items for each invoice
  if (invoices.length > 0 && itemsAll.length > 0) {
    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      const numItems = 3 + Math.floor(Math.random() * 3); // 3-5 items per invoice
      invoiceItemCounts.push(numItems);

      let invTaxableAmount = 0;
      let invTotalGST = 0;

      for (let j = 0; j < numItems; j++) {
        const item = randomOf(itemsAll);
        const qty = 1 + Math.floor(Math.random() * 10);
        const unitPrice = item.sellingPrice ?? item.mrp ?? item.purchasePrice ?? 5000;
        const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 15) : 0;
        const discountAmt = Math.round((unitPrice * qty * discount) / 100);
        const taxableAmount = unitPrice * qty - discountAmt;
        const gstRate = 18; // Default GST rate
        const gst = Math.round((taxableAmount * gstRate) / 100);
        const cgst = Math.round(gst / 2);
        const sgst = gst - cgst;
        const totalAmount = taxableAmount + gst;

        invTaxableAmount += taxableAmount;
        invTotalGST += gst;

        invoiceItems.push({
          invoiceId: undefined, // Will be set after invoice is created
          lineNumber: j + 1,
          itemName: item.name || `Item ${j + 1}`,
          description: item.specification || 'Demo line item',
          hsnCode: item.hsn || '853651',
          sacCode: '',
          quantity: qty,
          unit: item.unit || 'Unit',
          unitPrice,
          discount,
          discountPercent: discount,
          taxableAmount,
          gstRate,
          cgst,
          sgst,
          igst: 0,
          totalAmount,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Update invoice totals
      inv.subtotal = invTaxableAmount;
      inv.taxableAmount = invTaxableAmount;
      inv.totalGST = invTotalGST;
      inv.grandTotal = invTaxableAmount + invTotalGST;
    }
  }

  if (invoices.length) {
    const invoiceIds = await db.invoices.bulkAdd(invoices, undefined, { allKeys: true });
    // Update invoice items with actual invoice IDs
    if (invoiceItems.length > 0 && Array.isArray(invoiceIds)) {
      let itemIdx = 0;
      for (let i = 0; i < invoiceIds.length; i++) {
        const count = invoiceItemCounts[i] || 0;
        for (let j = 0; j < count && itemIdx < invoiceItems.length; j++) {
          invoiceItems[itemIdx].invoiceId = invoiceIds[i];
          itemIdx++;
        }
      }
      await db.invoiceItems.bulkAdd(invoiceItems);
    }

    // Generate payments per invoice based on finalized grandTotal (3 per invoice)
    if (Array.isArray(invoiceIds)) {
      for (let i = 0; i < invoiceIds.length; i++) {
        const inv = invoices[i];
        const stagesPay = ['Booking', 'Material', 'Final'] as const;
        const percents = [40, 50, 10];
        let cumulative = 0;
        for (let s = 0; s < stagesPay.length; s++) {
          let amt = Math.round((inv.grandTotal * percents[s]) / 100);
          if (s < stagesPay.length - 1) {
            cumulative += amt;
          } else {
            // ensure sum of payments equals grandTotal exactly
            amt = Math.max(0, inv.grandTotal - cumulative);
          }
          payments.push({
            paymentId: seq('PAY', (invoiceIds[i] as number) * 10 + s),
            projectId: inv.projectId,
            customerId: inv.customerId,
            invoiceId: invoiceIds[i],
            paymentStage: stagesPay[s],
            paymentMode: randomOf(['Cash', 'UPI', 'NEFT', 'Cheque']),
            amount: amt,
            paymentDate: new Date(),
            status: randomOf(['Due', 'Received', 'Partially Received']),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
  }
  if (payments.length) await db.payments.bulkAdd(payments);

  // Service Tickets
  const tickets: any[] = [];
  for (let i = 1; i <= counts.serviceTickets; i++) {
    const p = randomOf(projectsAll);
    tickets.push({
      ticketNumber: seq('TKT', i),
      projectId: p.id,
      customerId: p.customerId,
      issueType: randomOf(['Low Generation', 'Inverter Error', 'Wiring Issue', 'Panel Cleaning']),
      issueDescription: 'Autogenerated demo issue',
      priority: randomOf(['Low', 'Medium', 'High']),
      status: randomOf(['Open', 'Assigned', 'Resolved']),
      reportedDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  if (tickets.length) await db.serviceTickets.bulkAdd(tickets);

  // Settings defaults
  await settingsService.updateCompanySettings({
    companyName: 'Shine Electrical & Solar',
    email: 'info@shine-solar.example',
    phone: '9000000000',
    address: 'Main Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    businessType: 'Solar EPC',
  });
  await settingsService.updateTaxSettings({ defaultGSTRate: 18, enableGST: true });
  await settingsService.updateAppearanceSettings({ theme: 'light' });
  await settingsService.initializeDefaultGSTRates();

  return db.getStats();
}

export const seedService = { seedDemoData };
