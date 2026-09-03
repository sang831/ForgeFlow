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
app/        Application source code
docker/     Docker configuration
k8s/        Kubernetes manifests
scripts/    Automation scripts
docs/       Documentation