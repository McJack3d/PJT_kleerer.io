# Propositions d’accueil n3gh.

Ouvrir `/design-preview/` depuis le serveur local du dépôt. Aucune proposition ne remplace la page d’accueil existante.

- **A — Essentiel, recommandée :** un message bref, le comparateur immédiatement accessible et quatre raccourcis par famille. Identité proche du site actuel, navigation plus concrète.
- **B — Éditorial :** une composition centrée, une typographie de titre avec empattements et deux grandes entrées vers les produits et les preuves.
- **C — Index :** une entrée utilitaire avec toutes les familles du catalogue, filtrables au clavier, et un accès direct aux preuves et à la méthode.

Le sélecteur de propositions et les boutons Bureau / Mobile appartiennent à l’aperçu uniquement. Les liens des maquettes ouvrent les vues existantes du site. L’interface de ces maquettes est en français ; les liens de comparaison conservent cette langue.

Les illustrations scientifiques utilisent les fichiers existants, sans modification : `assets/molecules/melatonin.png`, `glycine.png` et `growth-hormone.jpeg`. Voir leurs attributions dans `assets/molecules/README.md`. Les nombres de produits et les familles affichés proviennent du catalogue local et se mettent à jour avec celui-ci.

## Vérifications

Testées dans Chrome avec Playwright en 1440, 390 et 320 pixels : absence de débordement horizontal, images chargées, absence d’erreur JavaScript. Sélection A/B/C, largeur mobile, recherche sans accents et résultat vide vérifiés. Tous les chemins internes correspondent à des fichiers du dépôt.

Pour lancer un aperçu :

```sh
python3 -m http.server 8770 --bind 127.0.0.1
```

Puis ouvrir `http://127.0.0.1:8770/design-preview/`.
