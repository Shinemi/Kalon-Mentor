import { useEffect, useRef } from 'react'

type SaveLimitDialogProps = {
    limit: number
    onClose: () => void
}

const SaveLimitDialog = ({ limit, onClose }: SaveLimitDialogProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        if (dialog && !dialog.open) dialog.showModal()
    }, [])

    return (
        <dialog ref={dialogRef} className="save-limit-dialog" aria-labelledby="save-limit-title" aria-describedby="save-limit-description" onClose={onClose}>
            <h2 id="save-limit-title">Votre galerie est pleine</h2>
            <p id="save-limit-description">Vous avez atteint la limite de {limit} analyses sauvegardées. Supprimez une ancienne analyse pour libérer une place.</p>
            <p>Votre retour actuel reste affiché et n’a pas été ajouté à la galerie.</p>
            <form method="dialog"><button type="submit" className="button-primary" autoFocus>J’ai compris</button></form>
        </dialog>
    )
}

export default SaveLimitDialog
