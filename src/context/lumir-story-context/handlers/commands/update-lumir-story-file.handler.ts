import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LumirStory } from '@domain/sub/lumir-story/lumir-story.entity';
import { UpdateLumirStoryFileDto } from '../../interfaces/lumir-story-context.interface';
import { Logger, NotFoundException } from '@nestjs/common';

/**
 * 루미르스토리 파일 수정 커맨드
 */
export class UpdateLumirStoryFileCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateLumirStoryFileDto,
  ) {}
}

/**
 * 루미르스토리 파일 수정 핸들러
 */
@CommandHandler(UpdateLumirStoryFileCommand)
export class UpdateLumirStoryFileHandler
  implements ICommandHandler<UpdateLumirStoryFileCommand>
{
  private readonly logger = new Logger(UpdateLumirStoryFileHandler.name);

  constructor(
    @InjectRepository(LumirStory)
    private readonly lumirStoryRepository: Repository<LumirStory>,
  ) {}

  async execute(command: UpdateLumirStoryFileCommand): Promise<LumirStory> {
    const { id, data } = command;

    this.logger.log(`루미르스토리 파일 수정 시작 - ID: ${id}`);

    // 루미르스토리 조회
    const lumirStory = await this.lumirStoryRepository.findOne({
      where: { id },
    });

    if (!lumirStory) {
      throw new NotFoundException(`루미르스토리를 찾을 수 없습니다. ID: ${id}`);
    }

    // 파일 업데이트
    lumirStory.attachments = data.attachments;
    if (data.updatedBy) {
      lumirStory.updatedBy = data.updatedBy;
    }

    const updated = await this.lumirStoryRepository.save(lumirStory);

    this.logger.log(`루미르스토리 파일 수정 완료 - ID: ${id}`);

    return updated;
  }
}
