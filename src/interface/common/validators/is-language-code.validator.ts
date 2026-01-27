import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import ISO6391 from 'iso-639-1';

/**
 * ISO 639-1 언어 코드 검증 Constraint
 */
@ValidatorConstraint({ name: 'isLanguageCode', async: false })
export class IsLanguageCodeConstraint implements ValidatorConstraintInterface {
  validate(code: string): boolean {
    return ISO6391.validate(code);
  }

  defaultMessage(): string {
    return 'code must be a valid ISO 639-1 language code (e.g., ko, en, ja, zh)';
  }
}

/**
 * ISO 639-1 언어 코드 검증 데코레이터
 *
 * @example
 * ```typescript
 * class CreateLanguageDto {
 *   @IsLanguageCode()
 *   code: string;
 * }
 * ```
 */
export function IsLanguageCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsLanguageCodeConstraint,
    });
  };
}
