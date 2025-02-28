export function base64UrlToBase64(base64Url: string) {
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
        base64 += "=";
    }
    return base64;
}
export const transformValue = (v: number, x: number, y: number): number => {
    const newMin = 0;
    const newMax = 100;
    return ((v - x) / (y - x)) * (newMax - newMin) + newMin;
};
