# Entry point for AWS Lambda.
# Mangum translates API Gateway events into normal web requests for FastAPI.
from mangum import Mangum

from main import app

handler = Mangum(app, lifespan="auto")
