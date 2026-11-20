# Portfolio — Yacouba Arama

Site en ligne : https://aramayac.github.io

## Ajouter une création (logo, affiche, flyer)

**Le plus simple :** ouvrez https://aramayac.github.io/admin.html, connectez-vous avec votre clé GitHub (instructions sur la page), choisissez l'image et publiez.

**À la main, depuis GitHub :**

1. Ouvrez le dossier `designs/` sur GitHub, puis **Add file → Upload files** et déposez l'image (JPG ou PNG, idéalement moins de 1 Mo).
2. Ouvrez `designs.json`, cliquez sur le crayon (Edit) et ajoutez une entrée en haut de la liste :

```json
{ "image": "designs/nom-du-fichier.jpg", "title": "Titre de la création", "cat": "Affiche", "client": "", "year": "2026" },
```

Catégories possibles : Logo, Affiche, Flyer, Identité visuelle, Autre.
3. **Commit changes**. Le site se met à jour en une à deux minutes.

## Mettre à jour le CV

Remplacez le fichier concerné dans `cv/`, en gardant le même nom :
- `cv/Yacouba_ARAMA_CV.pdf` : CV synthétique (1 page)
- `cv/Yacouba_ARAMA_CV_detaille.pdf` : CV détaillé (3 pages)

## Ajouter une recommandation

Ouvrez `testimonials.json` et ajoutez une entrée (uniquement de vraies citations, avec l'accord de la personne) :

```json
[
  {
    "quote": { "fr": "Texte en français.", "en": "Text in English." },
    "name": "Prénom Nom",
    "role": { "fr": "Fonction, organisation", "en": "Role, organisation" }
  }
]
```

La section « Recommandations » apparaît automatiquement dès qu'il y a au moins une entrée.

## Version anglaise et études de cas

- Page d'accueil anglaise : `en/index.html`
- Études de cas : `projets/` (français) et `en/projects/` (anglais)
