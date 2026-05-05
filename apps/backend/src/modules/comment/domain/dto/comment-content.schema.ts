import { z } from 'zod'

export const commentContentSchema = z
  .string()
  .trim()
  .min(1, 'Content is required')
  .max(500, 'Content must be 500 characters or fewer')
