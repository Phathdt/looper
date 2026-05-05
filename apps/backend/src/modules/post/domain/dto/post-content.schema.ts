import { z } from 'zod'

export const postContentSchema = z
  .string()
  .trim()
  .min(1, 'Content is required')
  .max(5000, 'Content must be 5000 characters or fewer')
