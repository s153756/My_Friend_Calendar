FROM python:3.12.9-slim

WORKDIR /app

COPY requirements.txt requirements-dev.txt ./

RUN apt-get update && apt-get install -y netcat-openbsd dos2unix && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt

ARG INSTALL_DEV=false
RUN if [ "$INSTALL_DEV" = "true" ]; then \
    pip install --no-cache-dir -r requirements-dev.txt; \
    fi

COPY . .

COPY docker-entrypoint.sh /usr/local/bin/
RUN dos2unix /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["python", "run.py"]
