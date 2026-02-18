# Semantic Embeddings Service — Immo Bénin

Petit service Python (FastAPI) pour générer des embeddings à partir de phrases,
utilisé par le backend NestJS (`SemanticSearchService`) pour la recherche IA.

## 1. Stack

- Python 3.10+
- FastAPI
- Uvicorn
- sentence-transformers
- Modèle : `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions).

## 2. Installation

Depuis la racine du projet :

```bash
cd semantic-embeddings
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate

pip install -r requirements.txt
```

## 3. Lancer le service

```bash
cd semantic-embeddings
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

- L’API sera accessible sur `http://localhost:8001`.
- Le backend NestJS pourra ensuite appeler `POST /embed` pour obtenir des vecteurs.

## 4. Endpoints

### `POST /embed`

Body JSON :

```json
{
  "texts": ["Studio moderne à Calavi", "Appartement F3 à Fidjrossè"]
}
```

Réponse :

```json
{
  "vectors": [
    [0.01, 0.02, ... 384 valeurs ...],
    [0.03, 0.04, ...]
  ]
}
```

## 5. Intégration avec le backend NestJS

- Le service NestJS (`SemanticSearchService`) sera configuré pour appeler ce microservice.
- Quand `isReady()` sera branché (par ex. via une URL dans la config), et qu’un modèle sera bien chargé,
  on pourra :
  1. Générer un embedding à la création/mise à jour d’un bien.
  2. Stocker l’embedding dans `properties.description_vector`.
  3. Utiliser pgvector (`<=>`) pour ordonner les résultats par similarité.

Pour l’instant, le backend expose déjà `GET /property/semantic-search` mais retombe sur la
recherche texte tant qu’aucun provider n’est configuré. Quand ce service sera prêt, il suffira
de brancher l’URL dans `SemanticSearchService`.

