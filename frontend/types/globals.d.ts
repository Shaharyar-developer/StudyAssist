declare type NullablePartial<T> = {
    [K in keyof T]?: T[K] | null;
};
declare type Result<T = void> =
    | { success: true; value?: T; reason?: never }
    | { success: false; reason: string; value?: never };
