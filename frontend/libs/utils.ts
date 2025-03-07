export function base64UrlToBase64(base64Url: string) {
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
        base64 += "=";
    }
    return base64;
}
export const transformValue = (v: number, x: number, y: number): number => {
    if (x === y) return 0;
    const newMin = 0;
    const newMax = 100;
    const transformedValue = ((v - x) / (y - x)) * (newMax - newMin) + newMin;
    return Math.max(newMin, Math.min(newMax, transformedValue));
};

export const valueToPercentage = (
    value: number,
    upperBound: number,
): number => {
    return transformValue(value, 0, upperBound);
};
