export const EmailTemplates = {
    otp: (name: string, code: string) => ({
        subject: `Your Verification Code: ${code}`,
        text: `Hello ${name}, your verification code is ${code}. It expires in 10 minutes.`,
        html: `<p>Hello <strong>${name}</strong>,</p><p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`
    })
};
