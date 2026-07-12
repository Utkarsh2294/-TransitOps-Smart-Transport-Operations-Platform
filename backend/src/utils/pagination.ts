import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type Pagination = {
  page: number;
  limit: number;
  skip: number;
};

export const parsePagination = (query: unknown): Pagination => {
  const { page, limit } = paginationSchema.parse(query);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

