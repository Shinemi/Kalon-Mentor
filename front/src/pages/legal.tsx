import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import '../styles/pages/legal.scss'

const Legal = () => {
    const { hash } = useLocation()

    useEffect(() => {
        if (!hash) return

        const section = document.getElementById(hash.slice(1))

        if (section) {
            section.focus({ preventScroll: true })
            section.scrollIntoView({ block: 'start' })
        }
    }, [hash])

    return (
        <main className="legal-main">
            <div className="legal-content">
                <h1>Informations légales</h1>

                <p>
                    Kalon Mentor est un projet étudiant personnel et gratuit
                    consacré à l’apprentissage du dessin.
                </p>

                <p className="legal-draft">
                    Version de travail : les coordonnées légales complètes,
                    les durées de conservation et les modalités de traitement
                    des prestataires restent à finaliser avant l’ouverture
                    publique du service.
                </p>

                <nav aria-label="Sommaire des informations légales">
                    <ul>
                        <li>
                            <a href="#mentions-legales">Mentions légales</a>
                        </li>
                        <li>
                            <a href="#confidentialite">Confidentialité</a>
                        </li>
                        <li>
                            <a href="#donnees">Données et utilisations</a>
                        </li>
                        <li>
                            <a href="#prestataires">Prestataires</a>
                        </li>
                        <li>
                            <a href="#intelligence-artificielle">
                                Intelligence artificielle
                            </a>
                        </li>
                        <li>
                            <a href="#conservation">Conservation</a>
                        </li>
                        <li>
                            <a href="#vos-droits">Vos droits</a>
                        </li>
                        <li>
                            <a href="#cookies">Cookies et stockage local</a>
                        </li>
                        <li>
                            <a href="#conditions-utilisation">
                                Conditions d’utilisation
                            </a>
                        </li>
                        <li>
                            <a href="#propriete-intellectuelle">
                                Propriété intellectuelle
                            </a>
                        </li>
                        <li>
                            <a href="#contact">Contact et assistance</a>
                        </li>
                    </ul>
                </nav>

                <section aria-labelledby="mentions-legales">
                    <h2 id="mentions-legales" tabIndex={-1}>
                        Mentions légales
                    </h2>

                    <p>
                        Le site Kalon Mentor est édité par Lucas Simon,
                        dans le cadre d’un projet étudiant personnel,
                        sans activité commerciale pour sa version MVP.
                    </p>

                    <dl>
                        <dt>Éditeur et directeur de publication</dt>
                        <dd>Lucas Simon</dd>

                        <dt>Contact</dt>
                        <dd>
                            <a href="mailto:kalon-mentor@gmail.com">
                                kalon-mentor@gmail.com
                            </a>
                        </dd>

                        <dt>Hébergement prévu du site et de l’API</dt>
                        <dd>
                            Vercel Inc., 440 N Barranca Avenue #4133,
                            Covina, CA 91723, États-Unis.
                            {' '}
                            <a href="https://vercel.com/legal">
                                Informations légales de Vercel
                            </a>
                        </dd>

                        <dt>Base de données</dt>
                        <dd>Supabase, base de données PostgreSQL.</dd>

                        <dt>Stockage prévu des images</dt>
                        <dd>Vercel Blob.</dd>
                    </dl>

                    <p className="legal-pending">
                        À compléter avant publication : les coordonnées de
                        l’éditeur requises selon le régime retenu et les
                        coordonnées téléphoniques de l’hébergeur.
                    </p>
                </section>

                <section aria-labelledby="confidentialite">
                    <h2 id="confidentialite" tabIndex={-1}>
                        Politique de confidentialité
                    </h2>

                    <p>
                        Lucas Simon est responsable des traitements de données
                        personnelles réalisés pour le fonctionnement de
                        Kalon Mentor. Toute question peut être adressée à
                        kalon-mentor@gmail.com.
                    </p>

                    <p>
                        Cette politique concerne la création du compte,
                        l’utilisation du mentorat, la sauvegarde des corrections
                        et les échanges avec l’éditeur.
                    </p>
                </section>

                <section aria-labelledby="donnees">
                    <h2 id="donnees" tabIndex={-1}>
                        Données collectées et utilisations
                    </h2>

                    <h3>Compte utilisateur</h3>
                    <p>
                        Le pseudo, l’adresse e-mail, le mot de passe haché,
                        l’identifiant et la date de création du compte servent
                        à créer le compte et à permettre l’authentification.
                        Le mot de passe n’est pas enregistré en clair.
                    </p>
                    <p>
                        Les informations demandées à l’inscription sont
                        nécessaires à la création du compte. Sans elles,
                        les fonctionnalités réservées aux utilisateurs
                        connectés ne sont pas accessibles.
                    </p>

                    <h3>Mentorat et galerie</h3>
                    <p>
                        Le dessin envoyé est traité afin de produire une
                        analyse pédagogique. Lorsque vous choisissez de
                        sauvegarder une correction, l’image, le retour généré,
                        les ressources associées et la date de sauvegarde
                        sont rattachés à votre compte.
                    </p>
                    <p>
                        L’envoi d’un dessin est nécessaire pour obtenir son
                        analyse. La sauvegarde du résultat est facultative.
                    </p>

                    <h3>Assistance et sécurité</h3>
                    <p>
                        Les messages envoyés par e-mail et les coordonnées
                        de leur expéditeur sont utilisés pour répondre aux
                        demandes. Des informations techniques, dont l’adresse IP,
                        peuvent être traitées pour limiter les requêtes,
                        diagnostiquer les erreurs et protéger le service.
                    </p>

                    <h3>Bases légales envisagées</h3>
                    <p>
                        La gestion du compte et le mentorat reposent sur
                        l’exécution du service demandé par l’utilisateur.
                        La sécurité repose sur l’intérêt légitime de l’éditeur
                        à protéger le site et ses utilisateurs.
                    </p>
                    <p className="legal-pending">
                        À finaliser : documenter ces bases légales pour
                        chaque traitement, notamment les échanges d’assistance
                        et le recours aux prestataires.
                    </p>
                </section>

                <section aria-labelledby="prestataires">
                    <h2 id="prestataires" tabIndex={-1}>
                        Destinataires et prestataires
                    </h2>

                    <p>
                        L’éditeur accède aux données nécessaires à
                        l’administration du service. L’architecture prévue
                        repose sur les prestataires suivants :
                    </p>

                    <ul>
                        <li>
                            Vercel : hébergement du site et de l’API.
                        </li>
                        <li>
                            Supabase : stockage des données du compte
                            et des corrections.
                        </li>
                        <li>
                            Vercel Blob : stockage des dessins sauvegardés.
                        </li>
                        <li>
                            Google Gemini : traitement des dessins
                            pour produire les analyses.
                        </li>
                        <li>
                            Google Fonts : chargement des polices.
                            Ce chargement établit une connexion avec Google,
                            qui reçoit notamment l’adresse IP.
                        </li>
                        <li>
                            Gmail : réception des demandes envoyées
                            à l’adresse de contact.
                        </li>
                    </ul>

                    <h3>Localisation et transferts</h3>
                    <p className="legal-pending">
                        À compléter avant publication : les régions
                        effectivement configurées pour l’hébergement,
                        la base et les images, ainsi que les éventuels
                        transferts hors de l’Espace économique européen
                        et leurs garanties contractuelles.
                    </p>

                    <p>
                        La localisation européenne d’une base de données
                        ne garantit pas, à elle seule, que tous les traitements
                        de ses prestataires restent en Europe.
                    </p>
                </section>

                <section aria-labelledby="intelligence-artificielle">
                    <h2 id="intelligence-artificielle" tabIndex={-1}>
                        Utilisation de l’intelligence artificielle
                    </h2>

                    <p>
                        Les analyses sont générées par Google Gemini à partir
                        du dessin transmis, d’instructions pédagogiques
                        et de ressources de cours.
                        L’adresse e-mail et le mot de passe ne sont pas
                        inclus dans la demande d’analyse.
                    </p>

                    <p>
                        Une image peut cependant contenir des informations
                        personnelles. Envoyez uniquement des dessins que vous
                        avez le droit de transmettre et évitez les informations
                        sensibles, confidentielles ou identifiantes.
                    </p>

                    <p>
                        Les commentaires et les scores constituent des
                        suggestions pédagogiques générées automatiquement.
                        Ils peuvent comporter des erreurs et ne représentent
                        ni une certification ni une évaluation officielle.
                    </p>

                    <p>
                        Les conditions de traitement de Google varient selon
                        le cadre contractuel applicable au projet.
                        Elles sont consultables dans les
                        {' '}
                        <a href="https://ai.google.dev/gemini-api/terms?hl=fr">
                            conditions de l’API Gemini
                        </a>.
                    </p>

                    <p className="legal-pending">
                        Avant ouverture publique : adapter la configuration
                        Gemini aux conditions applicables aux utilisateurs
                        de l’EEE et préciser ici le traitement des contenus
                        et leur conservation par Google.
                    </p>
                </section>

                <section aria-labelledby="conservation">
                    <h2 id="conservation" tabIndex={-1}>
                        Conservation et suppression
                    </h2>

                    <p className="legal-pending">
                        Les durées de conservation ne sont pas encore
                        arrêtées. Cette rubrique doit être finalisée et
                        les suppressions correspondantes mises en place
                        avant l’ouverture publique du service.
                    </p>

                    <p>
                        Une demande de suppression du compte ou des données
                        peut être adressée à kalon-mentor@gmail.com.
                        Les corrections peuvent également être supprimées
                        depuis la galerie lorsque cette fonctionnalité
                        est disponible.
                    </p>

                    <p>
                        Les délais propres aux journaux techniques,
                        aux sauvegardes et aux traitements des prestataires
                        devront être précisés séparément.
                    </p>
                </section>

                <section aria-labelledby="vos-droits">
                    <h2 id="vos-droits" tabIndex={-1}>
                        Vos droits sur vos données
                    </h2>

                    <p>
                        Selon les conditions prévues par le RGPD, vous pouvez
                        demander l’accès à vos données, leur rectification,
                        leur effacement et la limitation de leur traitement.
                        Les droits d’opposition et de portabilité s’appliquent
                        selon la base légale et la nature du traitement.
                    </p>

                    <p>
                        Pour exercer vos droits, écrivez à
                        {' '}
                        <a href="mailto:kalon-mentor@gmail.com">
                            kalon-mentor@gmail.com
                        </a>
                        {' '}
                        en précisant votre demande et le compte concerné.
                        Ne transmettez jamais votre mot de passe.
                    </p>

                    <p>
                        Une réponse doit vous être apportée dans un délai
                        d’un mois. Une prolongation de deux mois est possible
                        lorsque la complexité ou le nombre des demandes
                        le justifie ; vous en êtes alors informé dans
                        le premier mois.
                    </p>

                    <p>
                        Vous pouvez déposer une réclamation auprès de la
                        {' '}
                        <a href="https://www.cnil.fr/fr/adresser-une-plainte">
                            CNIL
                        </a>.
                    </p>
                </section>

                <section aria-labelledby="cookies">
                    <h2 id="cookies" tabIndex={-1}>
                        Cookies et stockage local
                    </h2>

                    <p>
                        Kalon Mentor utilise le stockage de session du
                        navigateur pour conserver le jeton d’authentification.
                        Ce stockage permet de maintenir la connexion dans
                        l’onglet et le jeton est retiré lors de la déconnexion.
                    </p>

                    <p>
                        Ce mécanisme sert à l’authentification.
                        Aucun outil publicitaire ou de mesure d’audience
                        n’est intégré dans la version du code examinée.
                    </p>

                    <p>
                        Tout ajout de traceurs devra être examiné avant
                        activation et cette rubrique devra être actualisée.
                        Les traceurs nécessitant un consentement ne seront
                        activés qu’après le choix de l’utilisateur.
                    </p>
                </section>

                <section aria-labelledby="conditions-utilisation">
                    <h2 id="conditions-utilisation" tabIndex={-1}>
                        Conditions d’utilisation
                    </h2>

                    <h3>Objet et accès</h3>
                    <p>
                        Kalon Mentor propose des cours et un accompagnement
                        pédagogique au dessin. La version MVP est gratuite.
                        Le mentorat et la sauvegarde des corrections
                        nécessitent un compte.
                    </p>
                    <p>
                        L’utilisation du mentorat faisant appel à Gemini
                        est réservée aux personnes majeures.
                    </p>

                    <h3>Responsabilités de l’utilisateur</h3>
                    <p>
                        Vous êtes responsable des contenus que vous transmettez.
                        Vous devez disposer des droits nécessaires sur
                        les dessins envoyés et respecter les droits des tiers.
                        Les contenus illicites et les tentatives de détournement
                        ou de perturbation du service sont interdits.
                    </p>
                    <p>
                        Gardez votre mot de passe et votre jeton de connexion
                        confidentiels. Signalez toute utilisation suspecte
                        de votre compte à l’éditeur.
                    </p>

                    <h3>Disponibilité et résultats</h3>
                    <p>
                        Le site est un prototype étudiant. Son fonctionnement
                        peut être interrompu par une maintenance, une erreur
                        ou une limitation des services externes.
                        Conservez une copie personnelle de vos dessins.
                    </p>
                    <p>
                        Les suggestions du mentorat doivent être appréciées
                        avec votre propre jugement et selon le style
                        artistique que vous recherchez.
                    </p>

                    <h3>Évolutions du service</h3>
                    <p>
                        Les fonctionnalités et ces informations peuvent évoluer.
                        Une évolution importante des usages de données
                        fera l’objet d’une information adaptée des utilisateurs.
                    </p>
                </section>

                <section aria-labelledby="propriete-intellectuelle">
                    <h2 id="propriete-intellectuelle" tabIndex={-1}>
                        Propriété intellectuelle
                    </h2>

                    <p>
                        Vous conservez vos droits sur les dessins que
                        vous transmettez. Leur envoi permet leur traitement
                        pour l’analyse demandée et, si vous le choisissez,
                        leur sauvegarde dans le service.
                        Il ne transfère pas leur propriété à Kalon Mentor.
                    </p>

                    <p>
                        Les textes, éléments graphiques, polices et logiciels
                        du site restent soumis aux droits de leurs auteurs
                        et aux licences applicables.
                        Leur disponibilité sur le site ne vaut pas
                        autorisation générale de reproduction.
                    </p>

                    <p>
                        Pour signaler un contenu portant atteinte à vos droits,
                        contactez l’éditeur en indiquant le contenu concerné
                        et les éléments permettant d’examiner votre demande.
                    </p>
                </section>

                <section aria-labelledby="contact">
                    <h2 id="contact" tabIndex={-1}>
                        Contact et assistance
                    </h2>

                    <p>
                        Pour une question, un problème technique,
                        un signalement ou une demande concernant vos données :
                    </p>

                    <a href="mailto:kalon-mentor@gmail.com">
                        kalon-mentor@gmail.com
                    </a>
                </section>
            </div>
        </main>
    )
}

export default Legal