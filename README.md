# Portfolio — Yacouba Arama

Site en ligne : https://aramayac.github.io

## Ajouter une création (logo, affiche, flyer)

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
