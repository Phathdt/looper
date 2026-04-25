import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import type { ZodSchema, ZodError } from "zod";

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation failed",
        errors: this.formatErrors(result.error),
      });
    }
    return result.data;
  }

  private formatErrors(error: ZodError) {
    return error.flatten().fieldErrors;
  }
}
