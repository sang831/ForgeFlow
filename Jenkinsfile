pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Đã kéo code mới nhất về workspace.'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Bắt đầu cài đặt các gói thư viện...'
                sh 'npm ci'
            }
        }

        stage('Lint and Code Quality') {
            steps {
                echo 'Đang kiểm tra cú pháp code...'
                sh 'npm run lint'
            }
        }

        stage('Unit Test') {
            steps {
                echo 'Đang chạy Unit Test...'
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Đang đóng gói ứng dụng Node.js thuần vào Docker Image...'
                sh 'docker build -t forgeflow:${BUILD_ID} -t forgeflow:latest .'
            }
        }

        stage('Scan Docker Image') {
            steps {
                echo 'Bắt đầu quét lỗ hổng bảo mật trên Docker Image...'
                sh 'trivy image --severity HIGH,CRITICAL --exit-code 1 forgeflow:${BUILD_ID}'
            }
        }

        stage('Deploy / Smoke Test') {
            steps {
                echo 'Bắt đầu chạy smoke test trong Docker network...'
                sh '''
                    set -eu

                    docker rm -f forgeflow-test >/dev/null 2>&1 || true
                    cleanup() {
                        docker rm -f forgeflow-test >/dev/null 2>&1 || true
                    }
                    trap cleanup EXIT

                    docker run -d \
                        --name forgeflow-test \
                        --network forgeflow-network \
                        -e DB_HOST=postgres \
                        -e DB_PORT=5432 \
                        -e DB_NAME=forgeflow \
                        -e DB_USER=forgeflow \
                        -e DB_PASSWORD=forgeflow_password \
                        forgeflow:${BUILD_ID}

                    for attempt in $(seq 1 30); do
                        status=$(docker inspect --format='{{.State.Health.Status}}' forgeflow-test 2>/dev/null || true)
                        if [ "$status" = 'healthy' ]; then
                            echo 'Health check passed.'
                            exit 0
                        fi
                        if [ "$status" = 'unhealthy' ]; then
                            docker logs forgeflow-test
                            exit 1
                        fi
                        sleep 2
                    done

                    docker logs forgeflow-test
                    echo 'Health check timed out.'
                    exit 1
                '''
            }
        }

        stage('Login and Push Image') {
            steps {
                echo 'Đăng nhập và đẩy Docker Image lên Docker Hub...'
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        set -eu
                        printf '%s' "$DOCKER_PASS" | docker login --username "$DOCKER_USER" --password-stdin
                        docker tag forgeflow:${BUILD_ID} "$DOCKER_USER/forgeflow:${BUILD_ID}"
                        docker tag forgeflow:latest "$DOCKER_USER/forgeflow:latest"
                        docker push "$DOCKER_USER/forgeflow:${BUILD_ID}"
                        docker push "$DOCKER_USER/forgeflow:latest"
                    '''
                }
            }
        }
    }
}