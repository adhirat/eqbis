/**
 * Zod schemas for request body validation.
 * Imported by route handlers; also used by @hono/zod-openapi for the API v1 spec.
 */

import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  orgName:  z.string().min(2, 'Organisation name required').max(100),
  orgSlug:  z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const SwitchOrgSchema = z.object({
  orgId: z.string().min(1),
});

export const InviteAcceptSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
});

// ── Users ─────────────────────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
  email:    z.string().email(),
  fullName: z.string().min(2).max(100),
  roleId:   z.string().min(1),
  password: z.string().min(8).optional(),
});

export const UpdateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  photo:    z.string().url().optional().nullable(),
});

export const AssignRoleSchema = z.object({
  roleId: z.string().min(1),
});

// ── Roles ─────────────────────────────────────────────────────────────────────

export const CreateRoleSchema = z.object({
  name:        z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6B7280'),
  permissions: z.array(z.string()).default([]),
});

export const UpdateRoleSchema = CreateRoleSchema.partial();

// ── Organisation ──────────────────────────────────────────────────────────────

export const UpdateOrgSchema = z.object({
  name:         z.string().min(2).max(100).optional(),
  slug:         z.string().min(3).max(40).regex(/^[a-z0-9-]+$/).optional(),
  timezone:     z.string().optional(),
  empIdPrefix:  z.string().min(1).max(10).optional(),
});

export const AddDomainSchema = z.object({
  domain: z
    .string()
    .min(4)
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/, 'Invalid domain'),
});

// ── Employees ────────────────────────────────────────────────────────────────

export const CreateEmployeeSchema = z.object({
  userId:     z.string().nullable().optional(), // link to existing portal user
  firstName:  z.string().min(1).max(50),
  lastName:   z.string().min(1).max(50),
  email:      z.string().email(),
  phone:      z.string().max(20).optional(),
  department: z.string().max(100).optional(),
  jobTitle:   z.string().max(100).optional(),
  startDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  salary:     z.number().positive().optional(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

// ── Timesheets ────────────────────────────────────────────────────────────────

export const TimesheetEntrySchema = z.object({
  date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clockIn: z.string().regex(/^\d{2}:\d{2}$/),  // HH:MM
  clockOut: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes:   z.string().max(500).optional(),
});

export const ApproveTimesheetSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes:  z.string().max(500).optional(),
});

// ── Leaves ───────────────────────────────────────────────────────────────────

export const LeaveRequestSchema = z.object({
  type:      z.enum(['annual', 'sick', 'personal', 'unpaid', 'other']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason:    z.string().max(500).optional(),
});

export const ApproveLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes:  z.string().max(500).optional(),
});

// ── Finance ───────────────────────────────────────────────────────────────────

export const InvoiceItemSchema = z.object({
  description: z.string().min(1).max(200),
  quantity:    z.number().positive(),
  unitPrice:   z.number().nonnegative(),
});

export const CreateInvoiceSchema = z.object({
  clientId:   z.string().optional(),
  clientName: z.string().min(1).max(100),
  clientEmail:z.string().email().optional(),
  issueDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  taxRate:    z.number().nonnegative().optional(),
  notes:      z.string().max(1000).optional(),
  items:      z.array(InvoiceItemSchema).min(1),
});

export const UpdateInvoiceStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
});

// ── CRM / Clients ─────────────────────────────────────────────────────────────

export const CreateClientSchema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email().optional(),
  phone:   z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  address: z.string().max(300).optional(),
  notes:   z.string().max(1000).optional(),
  status:  z.enum(['active', 'inactive', 'lead']).default('active'),
});

export const UpdateClientSchema = CreateClientSchema.partial();

// ── Projects ──────────────────────────────────────────────────────────────────

export const CreateProjectSchema = z.object({
  name:      z.string().min(1).max(150),
  clientId:  z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  budget:    z.number().nonnegative().optional(),
  status:    z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  description: z.string().max(2000).optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const MilestoneSchema = z.object({
  title:   z.string().min(1).max(150),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status:  z.enum(['pending', 'in_progress', 'completed']).default('pending'),
});

export const ProjectCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

// ── Support Tickets ───────────────────────────────────────────────────────────

export const CreateTicketSchema = z.object({
  subject:  z.string().min(1).max(200),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  message:  z.string().min(1).max(5000),
});

export const UpdateTicketSchema = z.object({
  status:     z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority:   z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional().nullable(),
});

export const TicketReplySchema = z.object({
  content: z.string().min(1).max(5000),
  type:    z.enum(['reply', 'internal_note']).default('reply'),
});

// ── Careers ───────────────────────────────────────────────────────────────────

export const CreateCareerSchema = z.object({
  title:       z.string().min(1).max(150),
  department:  z.string().max(100).optional(),
  type:        z.enum(['full_time', 'part_time', 'contract', 'internship']).default('full_time'),
  location:    z.string().max(100).optional(),
  description: z.string().min(1).max(10000),
  isActive:    z.boolean().default(true),
});

export const UpdateCareerSchema = CreateCareerSchema.partial();

// ── Upload presign ────────────────────────────────────────────────────────────

export const PresignSchema = z.object({
  filename:    z.string().min(1).max(255),
  contentType: z.string().min(1),
  size:        z.number().positive().max(100 * 1024 * 1024), // 100MB max
});

export const PresignConfirmSchema = z.object({
  key:    z.string().min(1),
  entity: z.string().optional(), // e.g. "employee:01ABCD"
  field:  z.string().optional(), // e.g. "resume_key"
});

// ── Finance — Receipts ────────────────────────────────────────────────────────

export const CreateReceiptSchema = z.object({
  title:    z.string().min(1).max(200),
  type:     z.enum(['income', 'expense']).default('expense'),
  amount:   z.number().positive(),
  category: z.string().max(100).optional(),
  period:   z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM format').optional(),
  notes:    z.string().max(1000).optional(),
  fileKey:  z.string().optional(),
});
