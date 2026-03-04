export const EmailTemplates = {
    _wrapTemplate: (content: string) => `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f172a; padding: 25px; text-align: center;">
                <img src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Flogo-blanco.png?alt=media&token=e6caedc9-a247-4e7d-a4ed-c3af55912c4d" alt="Nelson Vallejo Realty" style="height: 40px; width: auto;" />
            </div>
            <div style="padding: 35px 30px; color: #334155; line-height: 1.6;">
                ${content}
            </div>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Nelson Vallejo Realty. All rights reserved.</p>
                <p style="margin: 5px 0 0 0;">Florida, USA</p>
            </div>
        </div>
    `,

    otp: function (name: string, code: string) {
        return {
            subject: `Your Verification Code - Nelson Vallejo`,
            text: `Hello ${name}, your verification code is ${code}. It expires in 10 minutes.`,
            html: this._wrapTemplate(`
                <h2 style="color: #0f172a; margin-top: 0; font-weight: 600;">Verification Code</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>Please use the verification code below to gain access to your personalized AI chat session.</p>
                <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 15px; margin: 25px 0; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">
                    ${code}
                </div>
                <p>This code will expire in 10 minutes.</p>
            `)
        };
    },

    newLeadAdminAlert: function (lead: { name: string, email: string, phone?: string | undefined, source: string, intent?: string | undefined }) {
        const titleText = lead.source.includes('Form') ? 'via the Website Form' : 'via the AI Chatbot';

        return {
            subject: `[New Lead] ${lead.name} via ${lead.source}`,
            text: `You have a new lead!\nName: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone || 'N/A'}\nIntent: ${lead.intent || 'N/A'}\nSource: ${lead.source}`,
            html: this._wrapTemplate(`
                <h2 style="color: #0f172a; margin-top: 0; font-weight: 600;">New Lead Alert</h2>
                <p>A new prospect has initiated a conversation ${titleText}.</p>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 25px 0; border: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${lead.name}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${lead.email}" style="color: #2563eb;">${lead.email}</a></p>
                    <p style="margin: 0 0 10px 0;"><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Intent:</strong> ${lead.intent || 'Not specified'}</p>
                    <p style="margin: 0;"><strong>Source:</strong> ${lead.source}</p>
                </div>
                <p style="font-size: 14px; color: #64748b;">Log in to your admin dashboard to view the full conversation details.</p>
            `)
        };
    },

    welcomeLead: function (name: string) {
        return {
            subject: `Welcome to Nelson Vallejo Realty`,
            text: `Hello ${name}, welcome! We have successfully registered your details. We look forward to helping you find your dream property.`,
            html: this._wrapTemplate(`
                <h2 style="color: #0f172a; margin-top: 0; font-weight: 600;">Welcome, ${name}!</h2>
                <p>Thank you for getting in touch with us.</p>
                <p>Our team and AI assistant are here to guide you through your real estate journey, whether you're buying, selling, or investing in Florida properties.</p>
                <p>Feel free to continue chatting with our AI to refine your property criteria, or let us know if you'd like to schedule a direct consultation with Nelson.</p>
                <br/>
                <p style="margin-bottom: 0;">Best regards,</p>
                <p style="margin-top: 5px; font-weight: 600;">Nelson Vallejo Realty Team</p>
            `)
        };
    }
};
