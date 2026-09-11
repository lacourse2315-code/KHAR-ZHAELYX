# KHAR ZHAELYX — HANDOFF JALON 001

## Autorité
ChatGPT = IA DIRECTRICE.
IA exécutrice = implémentation + QA.
Le Master Game Design déjà défini dans les conversations du projet est la source de vérité. Ne pas réinterpréter ni redéfinir les systèmes déjà verrouillés.

## Objectif du jalon
Construire la fondation technique du jeu et une première build réellement jouable, sans créer de systèmes de gameplay non nécessaires au jalon.

## Contraintes
- navigateur desktop + mobile;
- cible future CrazyGames;
- priorité à la simplicité et à la robustesse;
- pas de backend si inutile à ce stade;
- pas de micro-questions;
- tout détail secondaire non verrouillé est décidé par l'exécutrice de façon cohérente et documenté.

## Travail attendu
1. Inspecter le dépôt existant.
2. Mettre en place la base Vite + TypeScript + moteur de jeu adapté au Master (Phaser recommandé si aucun choix contraire n'est verrouillé).
3. Structurer le code pour séparer logique de jeu, données, rendu et UI.
4. Mettre en place le démarrage du jeu, le chargement et la boucle principale.
5. Ajouter uniquement les éléments minimum nécessaires pour obtenir une première boucle jouable conforme au Master existant.
6. Ajouter une base de tests et une procédure de build reproductible.
7. Vérifier le fonctionnement navigateur et responsive.
8. Corriger les erreurs découvertes avant livraison.

## Interdictions
- ne pas inventer de nouvelles mécaniques majeures;
- ne pas modifier les décisions du Master;
- ne pas faire de placeholder présenté comme contenu final;
- ne pas déclarer PASS sans tests réels;
- ne pas demander au propriétaire de faire la QA technique.

## Rapport obligatoire
À la fin :
- PASS / FAIL / BLOCKED;
- travail réalisé;
- fichiers modifiés/créés;
- commandes de tests réellement exécutées et résultats;
- build production;
- régressions;
- problèmes restants;
- SHA du commit.

Le propriétaire fera seulement un court playtest après validation de l'IA directrice.
