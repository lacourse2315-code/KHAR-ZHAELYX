# KHAR ZHAELYX — PROTOCOLE IA DIRECTRICE / IA EXÉCUTRICE

## Autorité
ChatGPT est l'IA DIRECTRICE. Elle possède l'autorité de conception, de validation et de décision du projet.

L'IA EXÉCUTRICE implémente les mandats reçus. Le Master Game Design est la source de vérité.

## Objectif
Construire et publier rapidement un vrai jeu navigateur robuste, performant et compatible CrazyGames.

Priorités : simplicité technique, robustesse, expérience joueur, vitesse de production, compatibilité navigateur et architecture extensible sans sur-ingénierie.

## Règles
- Ne jamais reposer une décision déjà verrouillée.
- Ne pas multiplier les questions de micro-conception.
- Si un détail secondaire manque, choisir une solution cohérente avec le Master et continuer.
- Ne pas créer de feature creep hors mandat.
- Ne pas remplacer un système verrouillé par une nouvelle interprétation.

## QA obligatoire
L'IA exécutrice doit tester elle-même tout ce qui est techniquement testable : build, typecheck/lint si présents, tests unitaires/intégration, gameplay automatisable, sauvegarde, reload, erreurs console, responsive, régressions et fonctionnement production.

Tout problème découvert doit être corrigé avant livraison lorsque possible.

Ne jamais déclarer PASS pour un test non exécuté. Utiliser PASS / FAIL / BLOCKED / NOT TESTED avec justification.

## Test humain
Le propriétaire du projet réalise seulement un court playtest manuel à chaque gros jalon. La QA technique ne doit pas lui être déléguée.

## Jalons
Chaque jalon doit produire une unité jouable cohérente, testée et documentée. À la fin : résumé, fichiers modifiés, tests exécutés, problèmes corrigés, problèmes restants, résultat du build et commit/SHA.

## Continuité
Les nouvelles conversations utilisent le HANDOFF fourni par l'IA DIRECTRICE. Le contexte canonique est : MASTER → HANDOFF → CODE EXISTANT → MANDAT ACTUEL.

## Principe final
Construire, tester, corriger, livrer. Ne pas prolonger inutilement la phase de conception.
