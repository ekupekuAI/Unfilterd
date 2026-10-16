# Unfilterd Vibe v1 inference server (Hugging Face Space, Docker SDK, free CPU tier).
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# The model bundle ships in the GitHub Release, not in this repo.
ARG BUNDLE_URL=https://github.com/ekupekuAI/Unfilterd/releases/download/vibe-v1/vibe-v1-bundle.tar.gz
RUN mkdir -p /app/artifacts \
 && python -c "import urllib.request; urllib.request.urlretrieve('${BUNDLE_URL}', '/tmp/bundle.tgz')" \
 && tar -xzf /tmp/bundle.tgz -C /app/artifacts \
 && rm /tmp/bundle.tgz

COPY app.py infer.py decision.py vibe_schema.py ./

ENV VIBE_BUNDLE=/app/artifacts \
    VIBE_PATTERNS_PATH=/app/artifacts/safety_patterns.json \
    VIBE_THREADS=2

# Hugging Face Spaces run containers as a non-root user and route to port 7860.
RUN useradd -m -u 1000 vibe && chown -R vibe /app
USER vibe
EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860", "--no-access-log"]
