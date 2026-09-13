export const restaurantKeys = {
  all: ["restaurants"] as const,
  detail: (id: string) => ["restaurants", "detail", id] as const,
};

export const logKeys = {
  mine: (userId: string) => ["logs", userId] as const,
  detail: (id: string) => ["logs", "detail", id] as const,
};

export const listKeys = {
  mine: (userId: string) => ["lists", userId] as const,
};

export const listItemKeys = {
  mine: (userId: string) => ["list-items", userId] as const,
};
