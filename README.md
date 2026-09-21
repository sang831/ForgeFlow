# ForgeFlow

ForgeFlow is a DevOps CI/CD project.

## Technologies

- Git
- GitHub
- Jenkins
- Docker
- Kubernetes

## Architecture

Developer
    ↓
GitHub
    ↓
Jenkins
    ↓
Docker
    ↓
Container Registry
    ↓
Kubernetes

## Project Structure

```text
src/               Node.js application source code
tests/             Automated tests
Dockerfile         Backend container image
docker-compose.yml Local multi-service environment
docker/            Docker-related configuration
k8s/               Kubernetes manifests
scripts/           Automation scripts
docs/              Project documentation