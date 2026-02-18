from typing import List

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer


class EmbedRequest(BaseModel):
  texts: List[str]


class EmbedResponse(BaseModel):
  vectors: List[List[float]]


app = FastAPI(title="Immo Bénin - Semantic Embeddings")

model: SentenceTransformer | None = None


@app.on_event("startup")
def load_model() -> None:
  global model
  model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


@app.post("/embed", response_model=EmbedResponse)
async def embed(req: EmbedRequest) -> EmbedResponse:
  if not req.texts:
    return EmbedResponse(vectors=[])
  assert model is not None
  embeddings = model.encode(req.texts, normalize_embeddings=True)
  return EmbedResponse(vectors=[vec.tolist() for vec in embeddings])


@app.get("/health")
async def health() -> dict:
  return {"status": "ok"}

