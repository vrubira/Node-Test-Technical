export const createPostSchema = {
    body: {
      type: 'object',
      required: ['title', 'authorId'],
      properties: {
        title: { type: 'string', minLength: 1 },
        content: { type: 'string' },
        authorId: { type: 'number' }
      }
    }
} as const;
  