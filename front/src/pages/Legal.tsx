import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { openCookieSettings } from '../utils/analytics'
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
                <p>Kalon Mentor est un projet étudiant personnel consacré à l’apprentissage du dessin. Sa version MVP est gratuite, sans abonnement ni paiement.</p>
                <p>Dernière mise à jour : <time dateTime="2026-11-03">3 novembre 2026</time>. Version des CGU : 1.0.</p>
                <p className="legal-draft">Cette page décrit le MVP actuel. Les informations encore non confirmées sur la configuration des prestataires et certaines durées de conservation sont signalées dans les rubriques concernées.</p>

                <nav aria-label="Sommaire des informations légales">
                    <ul>
                        <li><a href="#mentions-legales">Mentions légales</a></li>
                        <li><a href="#conditions-utilisation">Conditions générales d’utilisation</a></li>
                        <li><a href="#gratuit-et-evolutions">Gratuité et offres futures</a></li>
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
                        <dt>Site</dt>
                        <dd><a href="https://kalon-mentor.vercel.app">https://kalon-mentor.vercel.app</a></dd>
                        <dt>Hébergement du site et stockage des images</dt>
                        <dd>Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis. Les dessins sauvegardés sont stockés dans un espace privé Vercel Blob. <a href="https://vercel.com/legal/privacy-notice">Coordonnées et politique de Vercel</a>.</dd>
                        <dt>Hébergement de l’API</dt>
                        <dd>Render Services, Inc., 525 Brannan St, San Francisco, États-Unis. <a href="https://render.com/dpa">Informations contractuelles de Render</a>.</dd>
                        <dt>Hébergement de la base de données</dt>
                        <dd>Supabase Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre, Singapore 049513, Singapour. <a href="https://supabase.com/terms">Informations contractuelles de Supabase</a>.</dd>
                    </dl>
                    <p>Le site est édité à titre non professionnel. Le régime de protection des coordonnées personnelles prévu par l’article 1-1, II de la loi pour la confiance dans l’économie numérique suppose que les éléments d’identification requis aient été communiqués aux hébergeurs.</p>
                </section>

                <section aria-labelledby="conditions-utilisation">
                    <h2 id="conditions-utilisation" tabIndex={-1}>Conditions générales d’utilisation</h2>
                    <h3>1. Objet et acceptation</h3>
                    <p>Les présentes CGU encadrent l’accès aux cours, au mentorat assisté par intelligence artificielle et à l’historique personnel de Kalon Mentor. Leur acceptation par une case non précochée est requise lors de l’inscription et contrôlée par le serveur.</p>
                    <p>L’acceptation des CGU est distincte du consentement aux cookies facultatifs. Refuser Google Analytics n’empêche pas de créer un compte ni d’utiliser le service.</p>
                    <h3>2. Accès et âge requis</h3>
                    <p>La consultation des pages publiques et des cours ne nécessite pas de compte. Le mentorat et l’historique personnel nécessitent une inscription et une connexion. L’accès au mentorat utilisant Gemini est réservé aux personnes âgées de 18 ans ou plus, conformément aux conditions du fournisseur.</p>
                    <h3>3. Compte et identifiants</h3>
                    <p>Vous fournissez un pseudo et une adresse e-mail utilisable et choisissez un mot de passe. Vous pouvez modifier ces informations depuis votre profil. Vous devez préserver la confidentialité de vos identifiants et signaler rapidement tout accès suspect à votre compte.</p>
                    <p>L’acceptation des CGU est vérifiée à l’inscription. La version actuelle ne conserve pas de registre séparé de la date et de la version acceptées.</p>
                    <h3>4. Envoi et analyse d’un dessin</h3>
                    <p>Vous pouvez envoyer une image de 10 Mo maximum, dans un format pris en charge par le service. Elle est redimensionnée et convertie en WebP pour l’analyse. Le mentor produit un retour pédagogique et peut recommander des cours disponibles sur le site.</p>
                    <p>La sauvegarde est une action volontaire après l’analyse. L’historique peut contenir jusqu’à 10 analyses par compte. Pour libérer une place, vous pouvez supprimer une analyse depuis votre historique. Cette limite de sauvegarde ne constitue pas un quota mensuel d’analyses.</p>
                    <h3>5. Contenus autorisés et usages interdits</h3>
                    <p>Envoyez uniquement des dessins que vous avez le droit de transmettre pour analyse. N’envoyez pas d’informations confidentielles, de données sensibles, de documents d’identité ni de contenus portant atteinte aux droits d’autrui.</p>
                    <p>Les contenus illicites, l’usurpation d’identité, l’accès aux données d’un autre utilisateur, les tentatives de contournement des protections et les usages visant à perturber le service sont interdits.</p>
                    <h3>6. Nature des résultats et disponibilité</h3>
                    <p>Les retours sont générés automatiquement et peuvent être incomplets, inexacts ou peu adaptés à un style artistique. Les scores sont des indications pédagogiques, pas des notes officielles, une certification ou une garantie de progression. Conservez votre regard critique et une copie personnelle de vos dessins.</p>
                    <p>Le MVP peut subir des interruptions, des délais ou des limitations liés à sa maintenance et aux services externes. Aucun délai de réponse ni disponibilité permanente n’est garanti. Le caractère expérimental du projet ne supprime pas les responsabilités légales de l’éditeur.</p>
                    <h3>7. Fermeture du compte et usages abusifs</h3>
                    <p>Vous pouvez demander la fermeture de votre compte et l’effacement de vos données à l’adresse de contact. La version actuelle ne propose pas de bouton de suppression de compte dans le profil.</p>
                    <p>En cas d’usage illicite, d’atteinte à la sécurité ou de violation des présentes conditions, l’éditeur peut restreindre l’accès au service après examen. L’utilisateur peut contacter l’éditeur pour demander des explications ou contester cette mesure.</p>
                    <h3>8. Modifications et différends</h3>
                    <p>Les CGU peuvent évoluer avec le service. La date et la version sont indiquées en haut de cette page. Une modification substantielle fera l’objet d’une information adaptée et, lorsque nécessaire, d’une nouvelle acceptation.</p>
                    <p>Les présentes conditions relèvent du droit français, sans priver l’utilisateur des protections impératives applicables. Pour rechercher une solution amiable, contactez d’abord l’éditeur. À défaut, les juridictions compétentes sont déterminées par les règles légales applicables.</p>
                </section>

                <section aria-labelledby="gratuit-et-evolutions">
                    <h2 id="gratuit-et-evolutions" tabIndex={-1}>Gratuité et offres futures</h2>
                    <p>Le MVP est gratuit. Aucun abonnement Premium, achat, paiement Stripe ou renouvellement automatique n’est proposé. Aucune donnée bancaire n’est demandée.</p>
                    <p>Les offres commerciales envisagées dans les documents de conception ne constituent pas une offre disponible. Si une offre payante est créée, ses prix, conditions de vente, modalités de résiliation et droits applicables seront présentés avant toute commande. L’acceptation des présentes CGU n’autorise aucun paiement futur.</p>
                </section>

                <section aria-labelledby="confidentialite">
                    <h2 id="confidentialite" tabIndex={-1}>Politique de confidentialité</h2>
                    <p>Lucas Simon est responsable des traitements réalisés pour Kalon Mentor. Vous pouvez le contacter à <a href="mailto:kalon-mentor@gmail.com">kalon-mentor@gmail.com</a> pour toute question relative à vos données.</p>
                    <p>Cette politique couvre le compte, le mentorat, l’historique, la sécurité, les demandes d’assistance et la mesure d’audience facultative. Les données sont collectées auprès de vous et, pour les informations techniques, lors de vos interactions avec le service.</p>
                    <p>Les dessins sauvegardés sont associés à leur propriétaire dans une galerie personnelle. Ils ne sont pas publiés dans une galerie communautaire dans cette version du site.</p>
                </section>

                <section aria-labelledby="donnees">
                    <h2 id="donnees" tabIndex={-1}>Données collectées et bases légales</h2>
                    <h3>Compte et authentification</h3>
                    <p>Le pseudo, l’adresse e-mail, le mot de passe haché, l’identifiant et la date de création servent à gérer le compte et les accès. Le mot de passe est haché avec bcrypt ; il n’est pas enregistré en clair. Ces traitements reposent sur l’exécution du service demandé, au sens de l’article 6, paragraphe 1, b du RGPD.</p>
                    <p>Les champs obligatoires du formulaire sont nécessaires à la création du compte. Sans eux ou sans acceptation des CGU, l’inscription est refusée. Le site ne vous demande pas votre nom civil pour utiliser le mentorat.</p>
                    <h3>Mentorat et historique</h3>
                    <p>L’image soumise est utilisée pour produire l’analyse. Si vous la sauvegardez, le dessin, le retour, les ressources associées et la date sont rattachés à votre compte. Le traitement du dessin et la sauvegarde demandée reposent sur l’exécution du service ; la sauvegarde reste facultative.</p>
                    <h3>Assistance et sécurité</h3>
                    <p>Les e-mails de contact servent à répondre à vos demandes. Une demande liée au compte relève de la gestion du service ; les autres échanges reposent sur l’intérêt légitime de l’éditeur à répondre aux sollicitations.</p>
                    <p>Des données techniques, notamment l’adresse IP, l’heure, la route appelée et les erreurs, peuvent être traitées par le service et ses hébergeurs pour prévenir les abus et diagnostiquer les incidents. Cette finalité repose sur l’intérêt légitime à protéger le site et ses utilisateurs.</p>
                    <h3>Mesure d’audience</h3>
                    <p>Google Analytics peut traiter des identifiants de navigateur, des pages consultées, des interactions et des informations techniques sur l’appareil. Cette mesure repose sur votre consentement et reste désactivée tant que vous ne l’avez pas acceptée. L’application n’envoie pas volontairement vos dessins, mots de passe ou adresses e-mail dans les événements Analytics.</p>
                    <h3>Traitement automatisé</h3>
                    <p>L’analyse artistique est automatisée. Elle ne décide pas de votre admission à une formation, de votre emploi ou d’un droit et n’a pas vocation à produire une décision ayant des effets juridiques ou un effet significatif comparable à votre égard.</p>
                </section>

                <section aria-labelledby="prestataires">
                    <h2 id="prestataires" tabIndex={-1}>Destinataires, prestataires et transferts</h2>
                    <p>L’éditeur accède aux informations nécessaires à l’administration et à l’assistance. Les prestataires interviennent dans la mesure nécessaire à leurs fonctions :</p>
                    <ul>
                        <li>Vercel : diffusion du site et stockage des dessins sauvegardés dans Vercel Blob.</li>
                        <li>Render : hébergement de l’API et traitement des requêtes.</li>
                        <li>Supabase : base PostgreSQL des comptes, corrections et ressources.</li>
                        <li>Google Gemini : traitement du dessin, des instructions et des ressources pédagogiques transmis pour l’analyse.</li>
                        <li>Google Analytics : mesure de fréquentation, uniquement après votre accord.</li>
                        <li>Google Fonts : chargement des polices, impliquant une connexion technique à Google, notamment avec votre adresse IP.</li>
                        <li>Gmail : réception des messages adressés à l’éditeur.</li>
                    </ul>
                    <p>Les dessins sauvegardés utilisent un stockage Blob privé configuré à Paris, en France. Les adresses des sociétés citées dans les mentions légales ne correspondent pas nécessairement aux lieux de stockage des données.</p>
                    <p>Certains prestataires et leurs sous-traitants opèrent hors de l’Espace économique européen. Les accès techniques et transferts éventuels doivent être examinés au regard des contrats de traitement et des garanties applicables. Une région de stockage européenne ne garantit pas que tout traitement reste en Europe.</p>
                    <p className="legal-pending">Informations à confirmer : régions de l’API Render et de la base Supabase, garanties effectivement applicables aux transferts et durées des sauvegardes et journaux. Ces paramètres ne sont pas encore documentés ici ; aucune garantie de traitement exclusivement européen n’est annoncée.</p>
                    <p>Documents des prestataires : <a href="https://vercel.com/legal/dpa">Vercel</a>, <a href="https://render.com/dpa">Render</a>, <a href="https://supabase.com/legal/customer-resources/data-processing-addendum">Supabase</a> et <a href="https://policies.google.com/privacy?hl=fr">Google</a>.</p>
                </section>

                <section aria-labelledby="intelligence-artificielle">
                    <h2 id="intelligence-artificielle" tabIndex={-1}>Traitement des dessins par l’intelligence artificielle</h2>
                    <p>Le mentor utilise l’API Google Gemini. Le serveur transmet une version redimensionnée du dessin, les instructions pédagogiques et les ressources disponibles. Le pseudo, l’e-mail et le mot de passe du compte ne sont pas ajoutés à la demande d’analyse. Des informations personnelles peuvent néanmoins figurer dans l’image elle-même.</p>
                    <p>Kalon Mentor ne propose pas de garantie « zéro conservation ». Les clauses Google relatives à l’EEE renvoient aux règles d’utilisation des données des services payants, y compris pour les quotas gratuits : Google y indique ne pas utiliser les entrées et réponses pour améliorer ses produits, mais prévoit une conservation temporaire à des fins de sécurité et de prévention des abus. Cela ne signifie pas absence de stockage.</p>
                    <p className="legal-pending">Le projet Gemini est actuellement utilisé sans facturation activée. Les conditions Google exigent le recours aux « Paid Services » pour proposer une application à des utilisateurs de l’EEE, de Suisse ou du Royaume-Uni. Ce point de configuration reste à régulariser ; cette page ne le résout pas et n’annonce pas le mentorat comme conforme à cette exigence.</p>
                    <p>La durée exacte de conservation applicable au projet Google n’a pas été confirmée. Consultez les <a href="https://ai.google.dev/gemini-api/terms?hl=fr">conditions de l’API Gemini</a>. Aucun dessin confidentiel ou contenant des données personnelles sensibles ne doit être transmis.</p>
                </section>

                <section aria-labelledby="conservation">
                    <h2 id="conservation" tabIndex={-1}>Conservation et suppression</h2>
                    <ul>
                        <li>Compte : les données restent associées au compte tant qu’il est conservé. La suppression est demandée par e-mail ; aucune purge automatique des comptes inactifs n’est actuellement mise en œuvre.</li>
                        <li>Dessins non sauvegardés : le service les traite pour répondre à la demande sans les archiver dans votre historique. Le résultat peut rester affiché dans l’onglet ; les règles de Google restent distinctes.</li>
                        <li>Analyses sauvegardées : elles sont conservées jusqu’à leur suppression depuis l’historique ou au traitement d’une demande de fermeture du compte.</li>
                        <li>Authentification : le jeton est conservé dans le stockage de session du navigateur et retiré à la déconnexion. Sa validité côté serveur est limitée à 7 jours.</li>
                        <li>Choix des cookies : il est mémorisé pendant 180 jours, puis un nouveau choix est demandé lors d’une visite.</li>
                        <li>Assistance : les échanges sont conservés le temps nécessaire au traitement et au suivi de la demande ; une durée maximale de conservation reste à fixer.</li>
                    </ul>
                    <p>La suppression d’une analyse demande le retrait de sa ligne en base et du fichier dans Blob. Ces opérations portent sur deux services distincts et peuvent échouer partiellement. Si le fichier reste présent après une erreur ou si une suppression ne se termine pas, contactez l’éditeur pour vérification.</p>
                    <p className="legal-pending">Restent à fixer et à vérifier : durée maximale des échanges d’assistance, politique de comptes inactifs, durées des journaux et sauvegardes des prestataires, et réglage de conservation des données Google Analytics. La suppression dans le service actif ne constitue pas une garantie de purge immédiate de toutes les sauvegardes des prestataires.</p>
                </section>

                <section aria-labelledby="vos-droits">
                    <h2 id="vos-droits" tabIndex={-1}>Vos droits sur vos données</h2>
                    <p>Dans les conditions prévues par le RGPD, vous disposez des droits d’accès, de rectification, d’effacement, de limitation du traitement et de portabilité. Vous pouvez vous opposer aux traitements fondés sur l’intérêt légitime pour des raisons tenant à votre situation particulière et retirer votre consentement à la mesure d’audience à tout moment, sans remettre en cause les traitements antérieurs licites.</p>
                    <p>Vous pouvez modifier les informations de votre profil et supprimer vos analyses depuis l’historique. Pour fermer votre compte, demander une copie de vos données ou exercer un autre droit, écrivez à <a href="mailto:kalon-mentor@gmail.com">kalon-mentor@gmail.com</a> en précisant le compte et la demande. Ne transmettez jamais votre mot de passe. Des précisions d’identité peuvent être demandées en cas de doute raisonnable.</p>
                    <p>Une réponse est apportée dans les meilleurs délais et, en principe, dans le mois suivant la réception de la demande. Une prolongation de deux mois peut être nécessaire selon sa complexité ou le nombre de demandes ; vous en êtes informé avec les motifs dans le premier mois.</p>
                    <p>Vous pouvez également adresser une réclamation à la <a href="https://www.cnil.fr/fr/adresser-une-plainte">Commission nationale de l’informatique et des libertés (CNIL)</a>.</p>
                </section>

                <section aria-labelledby="cookies">
                    <h2 id="cookies" tabIndex={-1}>Cookies et stockage local</h2>
                    <h3>Stockage nécessaire</h3>
                    <p>Le stockage de session conserve le jeton d’authentification sous la clé « kalon-token ». Il permet la connexion aux fonctions privées. Le choix relatif aux cookies est conservé dans le stockage local sous la clé « kalon_mentor_cookie_consent » pendant 180 jours. Ces mécanismes servent respectivement à la connexion et au respect de votre choix ; ils ne sont pas utilisés pour la publicité.</p>
                    <h3>Google Analytics facultatif</h3>
                    <p>Le script Analytics est chargé uniquement après acceptation. Il peut déposer les cookies « _ga » et « _ga_* » pour distinguer les navigateurs et les sessions. Google documente une durée d’expiration par défaut de deux ans, susceptible d’être réduite par les réglages et le navigateur. Cette durée est distincte des 180 jours de mémorisation de votre choix et de la conservation des données dans Analytics.</p>
                    <p>Vous pouvez accepter, refuser ou personnaliser votre choix dans la bannière, puis le modifier depuis « Gérer mes cookies » dans le pied de page ou avec le bouton ci-dessous. Le refus maintient l’accès au service. Le retrait désactive la collecte future et le site tente de supprimer les cookies Analytics accessibles ; il n’efface pas rétroactivement les données déjà reçues par Google.</p>
                    <button type="button" className="button-accent" onClick={openCookieSettings}>Gérer mes cookies</button>
                    <p>Les réglages actuels du code désactivent Google Signals et les signaux de personnalisation publicitaire. Les autres réglages de la propriété Analytics, notamment la conservation des événements, restent à confirmer. <a href="https://support.google.com/analytics/answer/11397207?hl=fr">Informations Google sur les cookies Analytics</a>.</p>
                </section>

                <section aria-labelledby="propriete-intellectuelle">
                    <h2 id="propriete-intellectuelle" tabIndex={-1}>Propriété intellectuelle</h2>
                    <h3>Vos dessins</h3>
                    <p>Vous conservez les droits que vous détenez sur vos créations. Leur transmission ne transfère pas leur propriété à Kalon Mentor. Vous autorisez uniquement les opérations nécessaires à l’analyse demandée : transmission technique, redimensionnement, conversion et traitement par le fournisseur d’IA, puis stockage et affichage dans votre espace personnel si vous choisissez la sauvegarde.</p>
                    <p>Cette autorisation ne permet pas à l’éditeur de publier votre dessin dans une galerie publique, de le vendre ou de l’utiliser pour promouvoir le site sans accord distinct. Les conditions propres au fournisseur d’IA sont présentées dans la rubrique correspondante.</p>
                    <h3>Éléments du site et ressources tierces</h3>
                    <p>Le code, les textes, les illustrations, le logo et l’interface sont soumis aux droits de leurs auteurs, dans la mesure où ils sont protégeables, et aux licences applicables. Les composants, icônes et polices tiers conservent leurs licences respectives. L’accès au dépôt GitHub ne vaut pas autorisation générale de réutilisation.</p>
                    <p>Les cours du site sont destinés à l’apprentissage personnel. Pour toute autre réutilisation, vérifiez les droits ou demandez une autorisation. Les contenus externes éventuellement recommandés restent soumis aux conditions de leurs auteurs et plateformes ; un lien ne transfère aucun droit sur leur contenu.</p>
                    <p>La présente page n’affirme ni dépôt de marque à l’INPI ni garantie d’exclusivité sur les résultats générés par IA. Pour signaler une atteinte à vos droits, indiquez l’adresse du contenu, les droits concernés et les éléments permettant d’examiner votre demande.</p>
                </section>

                <section aria-labelledby="contact">
                    <h2 id="contact" tabIndex={-1}>Contact, assistance et signalements</h2>
                    <p>Pour une question, un incident, une demande relative aux données, une fermeture de compte ou un signalement de contenu : <a href="mailto:kalon-mentor@gmail.com">kalon-mentor@gmail.com</a>.</p>
                    <p>Précisez le compte concerné, la page et le problème rencontré, sans envoyer votre mot de passe ni votre jeton de connexion. Les demandes sont traitées par l’éditeur du projet étudiant ; aucun service d’assistance permanent n’est annoncé.</p>
                </section>
            </div>
        </main>
    )
}

export default Legal
