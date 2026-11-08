import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table linked with Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').default(''),
  role: text('role').default('admin'),
  schoolId: text('school_id').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Registered institutional schools
export const schools = pgTable('schools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  motto: text('motto').default(''),
  levelType: text('level_type').default('SHS'),
  region: text('region').default('Greater Accra'),
  district: text('district').default(''),
  address: text('address').default(''),
  phone: text('phone').default(''),
  email: text('email').default(''),
  currency: text('currency').default('GH₵'),
  currentAcademicYear: text('current_academic_year').default('2025/2026'),
  currentTerm: text('current_term').default('Term 1'),
  ownerUid: text('owner_uid').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Enrolled student records
export const students = pgTable('students', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  studentNumber: text('student_number').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  gender: text('gender').default('Male'),
  gradeName: text('grade_name').default(''),
  stream: text('stream').default('A'),
  guardianName: text('guardian_name').default(''),
  guardianPhone: text('guardian_phone').default(''),
  status: text('status').default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Classes and streams
export const classes = pgTable('classes', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  name: text('name').notNull(),
  gradeId: text('grade_id').default(''),
  stream: text('stream').default('A'),
  level: text('level').default('Basic'),
  capacity: integer('capacity').default(40),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Fee payment records
export const feePayments = pgTable('fee_payments', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull(),
  studentId: text('student_id').default(''),
  studentName: text('student_name').default(''),
  amountPaid: integer('amount_paid').notNull(),
  paymentMethod: text('payment_method').default('MTN Mobile Money'),
  receiptNumber: text('receipt_number').default(''),
  term: text('term').default('Term 1'),
  academicYear: text('academic_year').default('2025/2026'),
  date: text('date').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});
