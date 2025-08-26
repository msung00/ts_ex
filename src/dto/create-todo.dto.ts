// src/dto/create-todo.dto.ts
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

/**
 * 새로운 할 일을 생성할 때 사용되는 데이터 전송 객체(DTO)입니다.
 * 클라이언트로부터 받은 데이터의 유효성을 검사하는 데 사용됩니다.
 */
export class CreateTodoDto {
  /**
   * 할 일의 제목입니다.
   * 비어 있지 않아야 하며, 문자열 타입이어야 합니다.
   * @example "Nest.js 프로젝트 설정하기"
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;

  /**
   * 할 일에 대한 상세 설명입니다. (선택 사항)
   * 문자열 타입이어야 합니다.
   * @example "프로젝트 초기 구조를 잡고 필요한 모듈을 설치한다."
   */
  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;
}