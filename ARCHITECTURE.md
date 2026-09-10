# DevKnowledge Architecture

```text
Browser / Next.js UI
        |
        | fetch /api/* (same origin)
        v
Next.js Route Handlers
        |
        +---- JWT verification + role/ownership rules
        |
        +---- Prisma 7 + PostgreSQL adapter ----> Neon PostgreSQL
        |
        +---- /api/ai/chat --------------------> Gemini Cloud API
```

The browser never receives `DATABASE_URL`, `JWT_SECRET`, or `GEMINI_API_KEY`.

## Permission model

- `MEMBER`: create knowledge and manage their own content.
- `MODERATOR`: member capabilities plus manage shared snippets/docs/forum content.
- `ADMIN`: same content-management capability as moderator and intended as the base for future user/role administration.

All permission checks are repeated in backend mutation routes. UI visibility is only a convenience and is not treated as authorization.
