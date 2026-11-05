'use strict'

exports.sendPasswordResetEmail = async (email, token) => {
    const {
        BREVO_API_KEY,
        BREVO_SENDER_EMAIL,
        BREVO_SENDER_NAME,
        FRONTEND_URL
    } = process.env

    if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !FRONTEND_URL) {
        throw new Error('Configuration Brevo incomplète.')
    }

    const resetUrl = new URL('/reset-password', FRONTEND_URL)
    resetUrl.hash = new URLSearchParams({ token }).toString()

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
            sender: {
                email: BREVO_SENDER_EMAIL,
                name: BREVO_SENDER_NAME || 'Kalon Mentor'
            },
            to: [{ email }],
            subject: 'Réinitialiser votre mot de passe Kalon Mentor',
            htmlContent: `
                <p>Bonjour,</p>
                <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
                <p><a href="${resetUrl.href}">Choisir un nouveau mot de passe</a></p>
                <p>Ce lien est valable 30 minutes et utilisable une seule fois.</p>
                <p>Si vous n’avez pas fait cette demande, ignorez cet e-mail.</p>
            `
        })
    })

    if (!response.ok) {
        throw new Error(`Envoi Brevo refusé (${response.status}).`)
    }
}
