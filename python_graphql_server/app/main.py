from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
import strawberry
from typing import List

# サンプルのGraphQLスキーマ
@strawberry.type
class Book:
    id: int
    title: str
    author: str

@strawberry.type
class Query:
    @strawberry.field
    def books(self) -> List[Book]:
        return [
            Book(id=1, title="The Great Gatsby", author="F. Scott Fitzgerald"),
            Book(id=2, title="1984", author="George Orwell"),
        ]

schema = strawberry.Schema(query=Query)
graphql_app = GraphQLRouter(schema)

app = FastAPI(title="GraphQL API Server")
app.include_router(graphql_app, prefix="/graphql")

@app.get("/")
async def root():
    return {"message": "Welcome to GraphQL API Server"} 