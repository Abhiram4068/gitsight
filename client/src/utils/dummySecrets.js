export const API_KEYS = {
    STRIPE_SECRET: "sk_live_51Mabcdefghijklmnopqrstuvwxyz1234567890",
    AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
    AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
};

export function doSomethingWithKeys() {
    console.log("Using keys", API_KEYS.STRIPE_SECRET);
    // BAD PRACTICE: Never log secrets
}
