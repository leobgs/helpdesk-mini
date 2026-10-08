from fastapi import FastAPI

app = FastAPI(title="HelpDesk Mini API")

@app.get("/")
def read_root():
    return {"message": "HelpDesk Mini API is running"}
