import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { openCookieSettings } from '../utils/analytics'
import { TERMS_VERSION } from '../services/AuthService'
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
                <h1>Informations légales et conditions d’utilisation</h1>
                <p>Kalon Mentor est un projet étudiant personnel consacré à l’apprentissage du dessin. Le service est proposé gratuitement, sans abonnement ni paiement.</p>
                <p>Dernière mise à jour : <time dateTime="2026-11-05">5 novembre 2026</time>. Version des CGU : {TERMS_VERSION}.</p>
                <nav aria-label="Sommaire des informations légales">
                    <ul>
                        <li><a href="#mentions-legales">Mentions légales</a></li>
                        <li><a href="#conditions-utilisation">Conditions générales d’utilisation</a></li>
                        <li><a href="#gratuit-et-evolutions">Gratuité du service</a></li>
                        <li><a href="#confidentialite">Confidentialité</a></li>
                        <li><a href="#donnees">Données et bases légales</a></li>
                        <li><a href="#prestataires">Prestataires et transferts</a></li>
                        <li><a href="#intelligence-artificielle">Intelligence artificielle</a></li>
                        <li><a href="#conservation">Conservation et suppression</a></li>
                        <li><a href="#vos-droits">Vos droits</a></li>
                        <li><a href="#cookies">Cookies et stockage local</a></li>
                        <li><a href="#propriete-intellectuelle">Propriété intellectuelle</a></li>
                        <li><a href="#contact">Contact et signalements</a></li>
                    </ul>
                </nav>

                <section aria-labelledby="mentions-legales">
                    <h2 id="mentions-legales" tabIndex={-1}>Mentions légales</h2>

                    <dl>
                        <dt>Éditeur et directeur de publication</dt>
                        <dd>Lucas Simon, éditeur à titre non professionnel dans le cadre d’un projet étudiant personnel.</dd>

                        <dt>Contact</dt>
                        <dd><a href="mailto:kalon-mentor@gmail.com">kalon-mentor@gmail.com</a></dd>

                        <dt>Adresse du site</dt>
                        <dd><a href="https://kalon-mentor.vercel.app">Front : https://kalon-mentor.vercel.app</a></dd>
                        <dd><a href="https://kalon-mentor.onrender.com">Back : https://kalon-mentor.onrender.com</a></dd>

                        <dt>Hébergement du site et stockage des dessins sauvegardés</dt>
                        <dd>Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis. Les dessins sauvegardés utilisent un stockage privé Vercel Blob configuré à Paris, en France. <a href="https://vercel.com/legal/privacy-notice">Informations et coordonnées de Vercel</a>.</dd>

                        <dt>Hébergement de l’API</dt>
                        <dd>Render Services, Inc., 525 Brannan St, San Francisco, États-Unis. <a href="https://render.com/dpa">Informations contractuelles de Render</a>.</dd>

                        <dt>Hébergement de la base de données</dt>
                        <dd>Supabase Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre, Singapore 049513, Singapour. La base de données du projet est configurée dans la région de Londres, au Royaume-Uni. <a href="https://supabase.com/terms">Informations contractuelles de Supabase</a>.</dd>
                    </dl>
                </section>

                <section aria-labelledby="conditions-utilisation">
                    <h2 id="conditions-utilisation" tabIndex={-1}>Conditions générales d’utilisation</h2>

                    <h3>1. Objet et acceptation</h3>
                    <p>Les présentes conditions encadrent l’accès aux cours, au mentorat assisté par intelligence artificielle et à l’historique personnel de Kalon Mentor.</p>
                    <p>La création d’un compte nécessite l’acceptation des CGU au moyen d’une case non précochée. Cette acceptation est distincte du consentement aux cookies facultatifs : refuser la mesure d’audience n’empêche pas de s’inscrire ni d’utiliser le service.</p>

                    <h3>2. Accès au service</h3>
                    <p>Les pages publiques et les cours peuvent être consultés sans compte. Le mentorat et l’historique personnel nécessitent une inscription et une connexion. Le mentorat utilisant Gemini est réservé aux personnes âgées de 18 ans ou plus, conformément aux conditions du fournisseur.</p>
                    <p>L’utilisateur doit disposer d’un accès à Internet et d’un navigateur compatible. Les frais liés à sa connexion et à son équipement restent à sa charge.</p>

                    <h3>3. Compte et sécurité</h3>
                    <p>L’inscription nécessite un pseudo, une adresse e-mail utilisable et un mot de passe. L’utilisateur peut modifier ses informations et son mot de passe depuis son profil.</p>
                    <p>L’utilisateur doit préserver la confidentialité de ses identifiants et signaler tout accès suspect. En cas d’oubli, un lien de réinitialisation peut être demandé par e-mail. Il ne doit pas être communiqué à un tiers.</p>

                    <h3>4. Envoi et analyse des dessins</h3>
                    <p>L’utilisateur peut transmettre une image JPG, PNG ou WebP de 10 Mo maximum. L’image est redimensionnée et convertie en WebP avant son traitement. Le mentor génère un retour pédagogique et peut recommander des cours du site.</p>
                    <p>La sauvegarde d’une analyse est facultative et nécessite une action de l’utilisateur. L’historique peut contenir jusqu’à 10 analyses par compte. Pour libérer une place, une analyse peut être supprimée depuis l’historique. Cette limite ne constitue pas un quota mensuel d’analyses.</p>

                    <h3>5. Contenus et comportements autorisés</h3>
                    <p>L’utilisateur transmet uniquement des dessins qu’il a le droit de soumettre au service et à son fournisseur d’analyse. Il ne doit pas envoyer de documents d’identité, de données sensibles, d’informations confidentielles ou de contenus portant atteinte aux droits d’autrui.</p>
                    <p>Sont interdits les contenus illicites, l’usurpation d’identité, l’accès aux données d’un autre utilisateur, le contournement des protections et toute utilisation destinée à perturber le fonctionnement du service.</p>

                    <h3>6. Résultats, disponibilité et responsabilité</h3>
                    <p>Les analyses sont générées automatiquement et peuvent comporter des erreurs, des omissions ou des appréciations mal adaptées au style du dessin. Les scores constituent des indications pédagogiques ; ils ne représentent ni une note officielle, ni une certification, ni une garantie de progression.</p>
                    <p>Le service peut être interrompu pour maintenance, incident technique ou indisponibilité d’un prestataire. Aucun délai de réponse ni disponibilité permanente n’est garanti. L’utilisateur est invité à conserver une copie personnelle de ses dessins et des résultats qu’il souhaite garder.</p>
                    <p>Les liens vers des sites externes sont proposés pour compléter l’apprentissage. Leurs contenus et leurs conditions peuvent évoluer indépendamment de Kalon Mentor. Ces dispositions ne limitent pas les responsabilités auxquelles l’éditeur est légalement tenu.</p>

                    <h3>7. Suppression du compte et restrictions d’accès</h3>
                    <p>L’utilisateur peut supprimer son compte depuis son profil. Cette action entraîne la suppression du compte, des analyses enregistrées et des dessins associés dans les espaces de stockage utilisés par le service. Elle est irréversible après son exécution.</p>
                    <p>En cas d’échec de la suppression ou de difficulté d’accès au compte, l’utilisateur peut contacter l’éditeur à l’adresse indiquée sur cette page.</p>
                    <p>En cas d’usage illicite, d’atteinte à la sécurité ou de violation des présentes conditions, l’éditeur peut restreindre l’accès après examen de la situation. L’utilisateur peut contacter l’éditeur pour demander des explications ou contester cette mesure.</p>

                    <h3>8. Évolution des conditions et différends</h3>
                    <p>Les conditions peuvent évoluer avec le service. Leur date de mise à jour et leur version sont indiquées en haut de cette page. Les modifications substantielles font l’objet d’une information adaptée et, lorsque nécessaire, d’une nouvelle acceptation.</p>
                    <p>Les présentes conditions relèvent du droit français, sans priver l’utilisateur des protections impératives applicables. En cas de difficulté, l’utilisateur peut contacter l’éditeur pour rechercher une solution amiable. Les juridictions compétentes sont déterminées par les règles légales applicables.</p>
                </section>

                <section aria-labelledby="gratuit-et-evolutions">
                    <h2 id="gratuit-et-evolutions" tabIndex={-1}>Gratuité du service</h2>
                    <p>Kalon Mentor est actuellement gratuit. Aucun abonnement, achat ou renouvellement automatique n’est proposé et aucune donnée bancaire n’est demandée.</p>
                    <p>Si une offre payante est proposée ultérieurement, ses prix, ses conditions de vente, ses modalités de résiliation et les droits applicables seront présentés avant toute commande. L’acceptation des présentes CGU n’autorise aucun paiement futur.</p>
                </section>

                <section aria-labelledby="confidentialite">
                    <h2 id="confidentialite" tabIndex={-1}>Politique de confidentialité</h2>
                    <p>Lucas Simon est responsable des traitements de données personnelles réalisés pour Kalon Mentor. Toute question peut être adressée à <a href="mailto:kalon-mentor@gmail.com">kalon-mentor@gmail.com</a>.</p>
                    <p>Cette politique concerne les comptes, l’authentification, la réinitialisation des mots de passe, le mentorat, l’historique, l’assistance, la sécurité et la mesure d’audience facultative.</p>
                    <p>Les informations proviennent des données renseignées par l’utilisateur et des interactions techniques avec le service. Les dessins sauvegardés appartiennent à un historique personnel : ils ne sont pas publiés dans une galerie communautaire.</p>
                </section>

                <section aria-labelledby="donnees">
                    <h2 id="donnees" tabIndex={-1}>Données collectées et bases légales</h2>

                    <h3>Compte et authentification</h3>
                    <p>Le pseudo, l’adresse e-mail, l’identifiant, la date de création et le mot de passe haché permettent de créer le compte et de gérer les accès. Le mot de passe est haché avec bcrypt et n’est pas enregistré en clair.</p>
                    <p>Ce traitement repose sur l’exécution du service demandé, conformément à l’article 6, paragraphe 1, b du RGPD. Les champs obligatoires sont nécessaires à l’inscription ; sans eux, le compte ne peut pas être créé.</p>

                    <h3>Réinitialisation du mot de passe</h3>
                    <p>L’adresse e-mail est utilisée pour envoyer un lien de réinitialisation par l’intermédiaire de Brevo. Un jeton aléatoire est généré et seule son empreinte est enregistrée dans la base de données, avec sa date d’expiration. Ce traitement relève de la gestion du compte et repose sur l’exécution du service.</p>

                    <h3>Mentorat et historique</h3>
                    <p>Le dessin transmis est utilisé pour générer une analyse. Lorsqu’une sauvegarde est demandée, l’image, le résultat, les ressources recommandées et la date sont associés au compte. Ces traitements reposent sur l’exécution du service demandé. La sauvegarde reste facultative.</p>

                    <h3>Assistance et sécurité</h3>
                    <p>Les messages reçus servent à traiter les demandes. Les échanges nécessaires à la gestion du compte reposent sur l’exécution du service. Les autres demandes reposent sur l’intérêt légitime de l’éditeur à répondre aux sollicitations.</p>
                    <p>Des informations techniques, notamment l’adresse IP, les horaires, les requêtes et les erreurs, peuvent être traitées par l’application et ses prestataires pour diagnostiquer les incidents et prévenir les abus. Ces traitements reposent sur l’intérêt légitime à assurer la sécurité du service et de ses utilisateurs.</p>

                    <h3>Mesure d’audience facultative</h3>
                    <p>Après consentement, Google Analytics peut traiter des identifiants de navigateur, les pages consultées, des interactions et des informations techniques sur l’appareil. La finalité est de comprendre la fréquentation et d’améliorer le site.</p>
                    <p>Ce traitement repose sur le consentement. L’application n’envoie pas volontairement les dessins, les adresses e-mail ou les mots de passe dans les événements de mesure d’audience.</p>

                    <h3>Analyse automatisée</h3>
                    <p>Le retour artistique est produit automatiquement. Il n’est pas utilisé pour décider d’une admission, d’un emploi ou de l’attribution d’un droit, et n’a pas vocation à produire des effets juridiques ou des effets significatifs comparables sur l’utilisateur.</p>
                </section>

                <section aria-labelledby="prestataires">
                    <h2 id="prestataires" tabIndex={-1}>Destinataires, prestataires et transferts</h2>
                    <p>L’éditeur accède aux informations nécessaires à l’administration, à la sécurité et à l’assistance. Les prestataires suivants interviennent selon leurs fonctions :</p>

                    <ul>
                        <li>Vercel : diffusion du site et stockage privé des dessins sauvegardés dans Vercel Blob.</li>
                        <li>Render : hébergement de l’API et traitement des requêtes.</li>
                        <li>Supabase : hébergement de la base PostgreSQL des comptes, analyses et ressources.</li>
                        <li>Google Gemini : analyse du dessin et génération du retour pédagogique.</li>
                        <li>Brevo : envoi des e-mails de réinitialisation du mot de passe.</li>
                        <li>Google Analytics : mesure d’audience après consentement.</li>
                        <li>Google Fonts : chargement des polices, avec transmission de données techniques de connexion à Google, notamment l’adresse IP.</li>
                        <li>Gmail : réception et traitement des messages adressés à l’éditeur.</li>
                    </ul>

                    <p>Le stockage privé des dessins dans Vercel Blob est configuré à Paris, en France. La base Supabase est configurée à Londres, au Royaume-Uni. Le site est diffusé par l’infrastructure de Vercel ; la région du stockage des dessins ne signifie pas que toutes les connexions au site sont traitées à Paris.</p>
                    <p>Certains prestataires ou leurs sous-traitants peuvent traiter des données hors de l’Espace économique européen. Les lieux de stockage ne couvrent pas nécessairement les accès d’assistance, les journaux techniques ou les traitements de sécurité. Leurs documents contractuels précisent les conditions de traitement et les mécanismes applicables aux transferts.</p>
                    <p>Pour en savoir plus : <a href="https://vercel.com/legal/dpa">Vercel</a>, <a href="https://render.com/dpa">Render</a>, <a href="https://supabase.com/legal/customer-resources/data-processing-addendum">Supabase</a>, <a href="https://www.brevo.com/fr/legal/privacypolicy/">Brevo</a> et <a href="https://policies.google.com/privacy?hl=fr">Google</a>.</p>
                </section>

                <section aria-labelledby="intelligence-artificielle">
                    <h2 id="intelligence-artificielle" tabIndex={-1}>Traitement des dessins par l’intelligence artificielle</h2>
                    <p>Le mentor utilise l’API Google Gemini. Le serveur transmet une version redimensionnée du dessin, les instructions d’analyse et les ressources pédagogiques utiles. Le pseudo, l’adresse e-mail et le mot de passe ne sont pas ajoutés à cette demande. Une image peut néanmoins contenir elle-même des informations personnelles.</p>
                    <p>Le projet utilise actuellement l’API sans facturation activée. Les conditions Google réservent la mise à disposition d’applications utilisant cette API aux utilisateurs de l’Espace économique européen, de Suisse et du Royaume-Uni à l’utilisation des « Paid Services ». Le fonctionnement gratuit du site ne dispense pas l’éditeur de respecter cette restriction du fournisseur.</p>
                    <p>Les conditions Google prévoient des règles particulières d’utilisation des données pour l’EEE, la Suisse et le Royaume-Uni. L’absence d’utilisation pour améliorer les produits ne signifie pas une absence de conservation : Google prévoit notamment des traitements de sécurité et de prévention des abus. Kalon Mentor ne propose aucune garantie de « zéro conservation ».</p>
                    <p>Google indique une conservation de 55 jours des instructions, du contexte et des réponses pour la surveillance des abus. Cette durée concerne ce traitement particulier et ne constitue pas une garantie générale de suppression de toutes les données détenues par Google.</p>
                    <p>Ne transmettez pas de dessin confidentiel ni de données personnelles sensibles. Consultez les <a href="https://ai.google.dev/gemini-api/terms?hl=fr">conditions de l’API Gemini</a> et les <a href="https://ai.google.dev/gemini-api/docs/usage-policies">informations sur la surveillance des abus</a> avant d’utiliser le mentorat.</p>
                </section>

                <section aria-labelledby="conservation">
                    <h2 id="conservation" tabIndex={-1}>Conservation et suppression</h2>

                    <ul>
                        <li>Compte : les informations sont conservées pendant l’existence du compte, puis supprimées lors de sa fermeture. Aucune suppression automatique fondée sur l’inactivité n’est actuellement appliquée.</li>
                        <li>Dessins non sauvegardés : ils sont traités pour répondre à la demande et ne sont pas ajoutés à l’historique. Leur affichage temporaire dans le navigateur et les traitements du fournisseur d’IA restent distincts.</li>
                        <li>Analyses sauvegardées : elles sont conservées jusqu’à leur suppression dans l’historique ou à la suppression du compte.</li>
                        <li>Authentification : le jeton est enregistré dans le stockage de session du navigateur et retiré à la déconnexion. Sa validité côté serveur est limitée à 7 jours, sous réserve des invalidations liées à la sécurité du compte.</li>
                        <li>Réinitialisation : le lien est utilisable pendant 30 minutes et devient inutilisable après une réinitialisation réussie. L’expiration seule ne supprime pas automatiquement son empreinte de la base ; celle-ci est remplacée ou effacée lors des opérations de gestion du compte concernées.</li>
                        <li>Assistance : les échanges sont supprimés au plus tard 12 mois après la clôture de la demande, sauf conservation nécessaire à une obligation légale ou à la gestion d’un litige.</li>
                        <li>Choix des cookies : l’acceptation ou le refus est mémorisé pendant 180 jours avant qu’un nouveau choix soit demandé.</li>
                        <li>Google Analytics : le réglage par défaut de 2 mois s’applique aux données utilisateur et aux événements concernés. Il ne supprime pas les rapports statistiques agrégés standards.</li>
                    </ul>

                    <p>Les journaux, sauvegardes et traitements de sécurité des prestataires suivent leurs propres cycles de conservation et les conditions applicables à leurs services. La suppression du compte dans l’application ne signifie pas l’effacement instantané de toutes les sauvegardes techniques ni des données déjà traitées séparément par Google.</p>
                    <p>Si une suppression échoue ou semble incomplète, contactez l’éditeur afin qu’il vérifie les données et les fichiers concernés.</p>
                </section>

                <section aria-labelledby="vos-droits">
                    <h2 id="vos-droits" tabIndex={-1}>Vos droits sur les données personnelles</h2>
                    <p>Dans les conditions prévues par le RGPD, vous disposez de droits d’accès, de rectification, d’effacement, de limitation du traitement et de portabilité. Vous pouvez vous opposer aux traitements fondés sur l’intérêt légitime pour des raisons tenant à votre situation particulière.</p>
                    <p>Lorsque le traitement repose sur votre consentement, vous pouvez le retirer à tout moment. Ce retrait ne remet pas en cause la licéité des traitements effectués auparavant.</p>
                    <p>Vous pouvez modifier vos informations depuis votre profil, supprimer des analyses depuis l’historique et supprimer votre compte depuis votre profil. Pour toute autre demande, écrivez à <a href="mailto:kalon-mentor@gmail.com">kalon-mentor@gmail.com</a>.</p>
                    <p>Une vérification proportionnée de l’identité peut être demandée en cas de doute raisonnable. N’envoyez pas votre mot de passe ou votre jeton de connexion.</p>
                    <p>Une réponse est apportée en principe dans un délai d’un mois. Ce délai peut être prolongé de deux mois supplémentaires en fonction de la complexité ou du nombre de demandes ; vous en serez informé dans le premier mois.</p>
                    <p>Vous pouvez également adresser une réclamation à la <a href="https://www.cnil.fr/fr/adresser-une-plainte">Commission nationale de l’informatique et des libertés — CNIL</a>.</p>
                </section>

                <section aria-labelledby="cookies">
                    <h2 id="cookies" tabIndex={-1}>Cookies et stockage dans le navigateur</h2>

                    <h3>Stockage nécessaire au fonctionnement</h3>
                    <p>Le stockage de session permet de conserver le jeton d’authentification nécessaire à l’accès aux espaces personnels. Le stockage local mémorise votre choix relatif aux cookies sous la clé « kalon_mentor_cookie_consent » pendant 180 jours.</p>
                    <p>Ces mécanismes servent à la connexion et à la mémorisation de votre choix. Ils sont distincts de la mesure d’audience facultative.</p>

                    <h3>Google Analytics</h3>
                    <p>Google Analytics est chargé uniquement après votre acceptation. Vous pouvez accepter ou refuser la mesure d’audience sans perdre l’accès au service.</p>
                    <p>Les cookies « _ga » et « _ga_* » servent notamment à distinguer les navigateurs et à maintenir des informations de session. Leur expiration par défaut est de 2 ans et peut être renouvelée lors des visites, selon les réglages de Google et les restrictions du navigateur. Cette durée est distincte des 180 jours de mémorisation du consentement et des 2 mois de conservation des données détaillées dans Analytics.</p>
                    <p>L’intégration du site désactive Google Signals et les signaux de personnalisation publicitaire.</p>

                    <h3>Modifier votre choix</h3>
                    <p>Vous pouvez modifier votre décision depuis le footer ou avec le bouton ci-dessous. Le retrait désactive les futures mesures d’audience du site et tente de supprimer les cookies Analytics accessibles au navigateur. Il n’efface pas rétroactivement les données déjà transmises.</p>
                    <button type="button" className="button-accent" onClick={openCookieSettings}>Gérer mes cookies</button>
                </section>

                <section aria-labelledby="propriete-intellectuelle">
                    <h2 id="propriete-intellectuelle" tabIndex={-1}>Propriété intellectuelle</h2>

                    <h3>Vos dessins</h3>
                    <p>Vous conservez les droits que vous détenez sur vos dessins. Leur transmission ne transfère pas leur propriété à Kalon Mentor.</p>
                    <p>Vous autorisez les opérations techniques nécessaires au service demandé : réception, redimensionnement, conversion, transmission au fournisseur d’analyse et, si vous le demandez, stockage dans votre historique personnel. Cette autorisation est limitée aux besoins du service, sous réserve des conditions du fournisseur d’IA présentées ci-dessus.</p>
                    <p>La sauvegarde dans votre historique n’autorise pas l’éditeur à publier vos dessins dans une galerie publique, à les vendre ou à les utiliser dans une communication promotionnelle. Une telle utilisation nécessiterait une autorisation distincte.</p>

                    <h3>Contenus et éléments du site</h3>
                    <p>Le code, les textes, les éléments graphiques et l’interface peuvent être protégés par le droit d’auteur lorsqu’ils remplissent les conditions légales de protection. Les composants et contenus tiers restent soumis à leurs licences et aux droits de leurs titulaires.</p>
                    <p>La présence du code sur GitHub n’accorde pas, à elle seule, une autorisation générale de réutilisation. Les conditions de la licence applicable et les mentions des composants tiers doivent être respectées.</p>

                    <h3>Ressources pédagogiques et liens externes</h3>
                    <p>Les cours sont proposés pour l’apprentissage personnel. Toute reproduction ou diffusion au-delà des usages autorisés par la loi doit respecter les droits et licences applicables.</p>
                    <p>Les ressources externes restent la propriété de leurs auteurs. Un lien ou une recommandation ne transfère aucun droit sur leur contenu. Les conditions d’accès et de réutilisation sont celles de la source concernée.</p>
                    <p>Si vous estimez qu’un contenu porte atteinte à vos droits, contactez l’éditeur en indiquant la page concernée, le contenu et les éléments permettant d’examiner votre demande.</p>
                </section>

                <section aria-labelledby="contact">
                    <h2 id="contact" tabIndex={-1}>Contact, assistance et signalements</h2>
                    <p>Pour une question, un incident, une demande relative aux données ou un signalement : <a href="mailto:kalon-mentor@gmail.com">kalon-mentor@gmail.com</a>.</p>
                    <p>Précisez la page concernée et les informations utiles à la compréhension de votre demande, sans transmettre votre mot de passe, votre lien de réinitialisation ou votre jeton de connexion.</p>
                    <p>Kalon Mentor étant un projet étudiant personnel, les demandes sont traitées par son éditeur sans service d’assistance permanent.</p>
                </section>
            </div>
        </main>
    )
}

export default Legal
