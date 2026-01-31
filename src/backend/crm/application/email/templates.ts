export const EmailTemplates = {
    otp: (name: string, code: string) => ({
        subject: "Your Verification Code - Nelson AI",
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #333;">Hello ${name},</h2>
                <p style="color: #666;">Verify your identity to start chatting.</p>
                <p style="color: #666;">Use the following code to complete your verification process:</p>
                <div style="background-color: #f5f8fa; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #007bff;">
                    ${code}
                </div>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
            </div>
        `,
        text: `Hello ${name}, your verification code is: ${code}`
    })
};
