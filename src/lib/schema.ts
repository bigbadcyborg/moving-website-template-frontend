import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const bookingCreateSchema = z.object({
  slotId: z.number(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  moveFromAddress: z.string().min(1),
  moveToAddress: z.string().min(1),
  notes: z.string().optional(),
  depositAmountCents: z.number().optional(),
})
