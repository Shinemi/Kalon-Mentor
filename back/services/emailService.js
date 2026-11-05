'use strict'

exports.sendPasswordResetEmail = async (email, token) => {
    const { BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, FRONTEND_URL } = process.env

    if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL || !FRONTEND_URL) {
        const error = new Error('Configuration Brevo incomplète.')
        error.code = 'BREVO_CONFIG_MISSING'
        throw error
    }

    const resetUrl = new URL('/reset-password', FRONTEND_URL)
    // Le fragment n'est pas envoyé dans les requêtes HTTP ni les journaux du front.
    resetUrl.hash = new URLSearchParams({ token }).toString()

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY
        },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({
            sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME || 'Kalon Mentor' },
            to: [{ email }],
            subject: 'Réinitialiser votre mot de passe Kalon Mentor',
            htmlContent: `<p>Bonjour,</p><p>Vous avez demandé à réinitialiser votre mot de passe Kalon Mentor.</p><p><a href="${resetUrl.href}">Choisir un nouveau mot de passe</a></p><p>Ce lien est valable 30 minutes et ne peut être utilisé qu’une fois. Une nouvelle demande remplace le lien précédent.</p><p>Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.</p>`,
            textContent: `Pour choisir un nouveau mot de passe : ${resetUrl.href}\nCe lien est valable 30 minutes et ne peut être utilisé qu’une fois. Si vous n’avez pas fait cette demande, ignorez cet e-mail.`
        })
    })

    if (!response.ok) {
        const error = new Error(`Envoi Brevo refusé (${response.status}).`)
        error.code = 'BREVO_SEND_FAILED'
        error.status = response.status
        throw error
    }
}
