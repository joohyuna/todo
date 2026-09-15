# ADR-0005: 미완료 항목 자동 이월 없음

- **Status**: Accepted

## Context

일간 ToDo 모델을 설계하면서, 어제 완료하지 못한 항목을 오늘 목록에 자동으로 옮길지(carry-over) 정해야 했다.

## Decision

이월 기능을 넣지 않는다. 각 날짜(`Todo.date`)의 목록은 완전히 독립적이며, 완료하지 못한 항목은 그 날짜에 그대로 남는다.

## Consequences

- 데이터 모델·조회 로직이 단순해진다(항상 `where: { userId, date }` 단일 날짜 조회).
- 사용자가 어제 못 한 일을 보려면 직접 날짜를 이동해야 한다.
- 이월을 원하면 이 결정을 뒤집는 새 ADR + RFC가 필요하다 — `docs/prd/todo-app.md`의 확장 후보에 후보로만 남겨둔 상태.
