// src/dto/update-todo.dto.ts
import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

/**
 * 기존 할 일을 수정할 때 사용되는 데이터 전송 객체(DTO)입니다.
 * 모든 속성은 선택 사항(optional)입니다.
 */
export class UpdateTodoDto {
  /**
   * 수정할 할 일의 제목입니다.
   * @example "Nest.js 심화 학습하기"
   */
  @IsString()
  @IsOptional()
  @MaxLength(50)
  title?: string;

  /**
   * 수정할 할 일의 상세 설명입니다.
   * @example "데이터베이스 연동 및 인증 기능 구현을 학습한다."
   */
  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  /**
   * 할 일의 완료 상태입니다.
   * @example true
   */
  @IsBoolean()
  @IsOptional()
  isDone?: boolean;
}