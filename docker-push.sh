#!/usr/bin/env bash

set -euo pipefail

read -r -p "Env file [.env]: " ENV_FILE
read -r -p "Docker Hub username: " DOCKERHUB_USERNAME
read -r -p "Image name [text-to-comic-app]: " IMAGE_NAME
read -r -p "Image tag [latest]: " IMAGE_TAG

ENV_FILE="${ENV_FILE:-.env}"
IMAGE_NAME="${IMAGE_NAME:-text-to-comic-app}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

if [[ -z "${DOCKERHUB_USERNAME}" ]]; then
  echo "Docker Hub username khong duoc de trong." >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Khong tim thay file env: ${ENV_FILE}" >&2
  exit 1
fi

LOCAL_REF="${IMAGE_NAME}:${IMAGE_TAG}"
REMOTE_REF="${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"

docker build \
  --build-arg "ENV_FILE=${ENV_FILE}" \
  -t "${LOCAL_REF}" \
  .

docker login -u "${DOCKERHUB_USERNAME}"
docker tag "${LOCAL_REF}" "${REMOTE_REF}"
docker push "${REMOTE_REF}"

echo "Da build va push image len Docker Hub: ${REMOTE_REF}"
