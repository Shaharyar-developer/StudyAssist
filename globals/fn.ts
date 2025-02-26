type Result<T = void> =
    | { success: true; value?: T; reason?: never }
    | { success: false; reason: string; value?: never };

export type { Result };

export const ok = <T = void>(value?: T): Result<T> => ({
    success: true,
    value,
});
export const err = (reason: string): Result<never> => ({
    success: false,
    reason,
});
