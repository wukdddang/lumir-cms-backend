import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Brochure } from '@domain/core/brochure/brochure.entity';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * 브로슈어 순서 항목 인터페이스
 */
export interface BrochureOrderItem {
  id: string;
  order: number;
}

/**
 * 브로슈어 일괄 순서 수정 DTO
 */
export interface UpdateBrochureBatchOrderDto {
  brochures: BrochureOrderItem[];
  updatedBy?: string;
}

/**
 * 브로슈어 일괄 순서 수정 커맨드
 */
export class UpdateBrochureBatchOrderCommand {
  constructor(public readonly data: UpdateBrochureBatchOrderDto) {}
}

/**
 * 브로슈어 일괄 순서 수정 핸들러
 */
@CommandHandler(UpdateBrochureBatchOrderCommand)
export class UpdateBrochureBatchOrderHandler
  implements ICommandHandler<UpdateBrochureBatchOrderCommand>
{
  private readonly logger = new Logger(UpdateBrochureBatchOrderHandler.name);

  constructor(
    @InjectRepository(Brochure)
    private readonly brochureRepository: Repository<Brochure>,
  ) {}

  async execute(
    command: UpdateBrochureBatchOrderCommand,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const { brochures, updatedBy } = command.data;

    // DTO validation이 이미 처리했으므로 간단한 체크만
    if (!brochures || brochures.length === 0) {
      throw new BadRequestException('수정할 브로슈어가 없습니다.');
    }

    this.logger.log(
      `브로슈어 일괄 순서 수정 시작 - 수정할 브로슈어 수: ${brochures.length}`,
    );

    // 브로슈어 ID 목록 추출
    const brochureIds = brochures.map((item) => item.id);

    // 브로슈어 조회
    const existingBrochures = await this.brochureRepository.find({
      where: { id: In(brochureIds) },
    });

    if (existingBrochures.length !== brochures.length) {
      const foundIds = existingBrochures.map((b) => b.id);
      const missingIds = brochureIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `일부 브로슈어를 찾을 수 없습니다. 누락된 ID: ${missingIds.join(', ')}`,
      );
    }

    // 순서 업데이트를 위한 맵 생성
    const orderMap = new Map<string, number>();
    brochures.forEach((item) => {
      orderMap.set(item.id, item.order);
    });

    // 각 브로슈어의 순서 업데이트
    const updatePromises = existingBrochures.map((brochure) => {
      const newOrder = orderMap.get(brochure.id);
      if (newOrder !== undefined) {
        brochure.order = newOrder;
        if (updatedBy) {
          brochure.updatedBy = updatedBy;
        }
      }
      return this.brochureRepository.save(brochure);
    });

    await Promise.all(updatePromises);

    this.logger.log(
      `브로슈어 일괄 순서 수정 완료 - 수정된 브로슈어 수: ${existingBrochures.length}`,
    );

    return {
      success: true,
      updatedCount: existingBrochures.length,
    };
  }
}
