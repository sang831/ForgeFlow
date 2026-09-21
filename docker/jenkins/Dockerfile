FROM jenkins/jenkins:lts-jdk21

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends docker.io \
    && rm -rf /var/lib/apt/lists/*

USER jenkins

RUN jenkins-plugin-cli --plugins \
    workflow-aggregator \
    pipeline-groovy \
    git \
    credentials-binding \
    docker-workflow \
    docker-commons \
    blueocean \
    junit \
    cobertura \
    jacoco \
    slack \
    email-ext \
    sonar \
    kubernetes \
    ssh-agent