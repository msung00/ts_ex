// src/todos.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

/**
 * 할 일(Todo) 데이터의 인터페이스 정의
 */
export interface Todo {
  id: number;
  title: string;
  description: string | null;
  isDone: boolean;
  createdAt: Date;
}

@Injectable()
export class TodosService {
  /**
   * 데이터베이스를 대신하는 인메모리(In-memory) 배열.
   * 서버가 재시작되면 데이터는 초기화됩니다.
   */
  private todos: Todo[] = [
    { 
      id: 1, 
      title: 'Nest.js 공부하기', 
      description: '공식 문서를 정독하고 예제 코드를 따라 쳐본다.', 
      isDone: false, 
      createdAt: new Date() 
    },
    { 
      id: 2, 
      title: 'TypeScript 복습하기', 
      description: '타입, 인터페이스, 제네릭 등 핵심 개념을 복습한다.', 
      isDone: true, 
      createdAt: new Date() 
    },
  ];

  private idCounter = this.todos.length;

  /**
   * 모든 할 일 목록을 반환합니다.
   * @returns {Todo[]} 할 일 객체의 배열
   */
  findAll(): Todo[] {
    return this.todos;
  }

  /**
   * 주어진 ID와 일치하는 할 일을 찾아서 반환합니다.
   * @param id - 찾을 할 일의 고유 ID
   * @returns {Todo} 찾아낸 할 일 객체
   * @throws {NotFoundException} ID에 해당하는 할 일이 없을 경우
   */
  findOne(id: number): Todo {
    const todo = this.todos.find((todo) => todo.id === id);
    if (!todo) {
      throw new NotFoundException(`ID가 '${id}'인 할 일을 찾을 수 없습니다.`);
    }
    return todo;
  }

  /**
   * 새로운 할 일을 생성하고 목록에 추가합니다.
   * @param createTodoDto - 새로운 할 일을 생성하는 데 필요한 데이터
   * @returns {Todo} 새로 생성된 할 일 객체
   */
  create(createTodoDto: CreateTodoDto): Todo {
    const newTodo: Todo = {
      id: ++this.idCounter,
      title: createTodoDto.title,
      description: createTodoDto.description || null,
      isDone: false,
      createdAt: new Date(),
    };
    this.todos.push(newTodo);
    return newTodo;
  }

  /**
   * 주어진 ID의 할 일 정보를 수정합니다.
   * @param id - 수정할 할 일의 고유 ID
   * @param updateTodoDto - 수정할 내용이 담긴 데이터
   * @returns {Todo} 정보가 수정된 할 일 객체
   */
  update(id: number, updateTodoDto: UpdateTodoDto): Todo {
    const todoToUpdate = this.findOne(id);
    
    // Object.assign을 사용하여 정의된 속성만 업데이트
    Object.assign(todoToUpdate, updateTodoDto);

    return todoToUpdate;
  }

  /**
   * 주어진 ID의 할 일을 목록에서 삭제합니다.
   * @param id - 삭제할 할 일의 고유 ID
   * @returns {void}
   * @throws {NotFoundException} ID에 해당하는 할 일이 없을 경우
   */
  remove(id: number): void {
    const todoIndex = this.todos.findIndex((todo) => todo.id === id);
    if (todoIndex === -1) {
      throw new NotFoundException(`ID가 '${id}'인 할 일을 찾을 수 없습니다.`);
    }
    this.todos.splice(todoIndex, 1);
  }
}