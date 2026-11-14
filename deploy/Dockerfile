# Tek konteyner (API + statik sim). Paket kökünde derlenir: deploy/bundle.sh bunu kök Dockerfile olarak koyar.
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 MM_LAYERS_DIR=/app PORT=7860
WORKDIR /app
COPY deploy/requirements.txt /app/deploy/requirements.txt
RUN pip install --no-cache-dir -r deploy/requirements.txt && useradd --create-home --uid 1000 app
COPY --chown=app:app . /app
USER app
EXPOSE 7860
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s CMD python -c "import urllib.request,os;urllib.request.urlopen('http://127.0.0.1:%s/health'%os.environ.get('PORT','7860'))"
CMD ["sh", "-c", "exec python -m uvicorn deploy.server:app --host 0.0.0.0 --port ${PORT}"]
