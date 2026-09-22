pipeline {
    agent any 

    stages {
        // --- GIAI ĐOẠN 1: Chuẩn bị ---
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Đã kéo code mới nhất về workspace.'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Bắt đầu cài đặt các gói thư viện...'
                bat 'npm ci' // Hoặc 'npm install' tùy dự án của bạn
            }
        }

        // --- GIAI ĐOẠN 2: Kiểm định Code ---
        stage('Lint and Code Quality') {
            steps {
                echo 'Đang kiểm tra cú pháp code...'
                // Bỏ comment dòng dưới nếu dự án có lệnh lint
                // bat 'npm run lint' 
            }
        }

        stage('Unit Test') {
            steps {
                echo 'Đang chạy Unit Test...'
                // Bỏ comment dòng dưới nếu dự án có test
                // bat 'npm run test'
            }
        }
        // --- GIAI ĐOẠN 3: Build và Đóng gói ---
        stage('Build Docker Image') {
            steps {
                echo 'Đang đóng gói ứng dụng Node.js thuần vào Docker Image...'
                bat "docker build -t forgeflow:${env.BUILD_ID} -t forgeflow:latest ."
            }
        }
        stage('Scan Docker Image') {
            steps {
                echo 'Bắt đầu quét lỗ hổng bảo mật trên Docker Image...'
                // Nếu đã cài Trivy, bạn dùng lệnh dưới đây (hiện tại tạm comment):
                // bat "trivy image forgeflow:${env.BUILD_ID}"
            }
        }
        stage('Login Docker Registry') {
            steps {
                echo 'Đang xác thực với Docker Hub...'
                // Lấy thông tin đăng nhập từ Credentials của Jenkins có ID là 'dockerhub-creds'
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    // Dùng biến môi trường của Windows (%) để truyền user/pass an toàn
                    bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'
                }
            }
        }
        stage('Push Image') {
            steps {
                echo 'Đang đẩy Docker Image lên Docker Hub...'
                // Dùng lại thông tin đăng nhập để lấy DOCKER_USER
                withCredentials([usernamePassword(credentialsId: '732004', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    
                    // 1. Đổi tên Image theo chuẩn của Docker Hub (cần dùng dấu ngoặc kép "")
                    bat "docker tag forgeflow:${env.BUILD_ID} %DOCKER_USER%/forgeflow:${env.BUILD_ID}"
                    bat "docker tag forgeflow:latest %DOCKER_USER%/forgeflow:latest"

                    // 2. Push Image lên Docker Hub
                    bat "docker push %DOCKER_USER%/forgeflow:${env.BUILD_ID}"
                    bat "docker push %DOCKER_USER%/forgeflow:latest"
                }
            }
        }
        stage('Deploy / Smoke Test') {
            steps {
                echo 'Bắt đầu chạy thử ứng dụng...'
                
                // 1. Xóa container cũ (nếu có) để tránh lỗi trùng tên hoặc trùng cổng
                // (Thêm catchError để Jenkins không báo đỏ nếu không tìm thấy container cũ)
                catchError(buildResult: 'SUCCESS', stageResult: 'SUCCESS') {
                    bat 'docker rm -f forgeflow-test'
                }

                // 2. Chạy container mới ngầm (-d), đặt tên là forgeflow-test, map cổng 3000
                bat 'docker run -d --name forgeflow-test -p 3000:3000 forgeflow:latest'
                
                // 3. Đợi 5 giây cho ứng dụng JS khởi động hẳn trên Windows
                bat 'timeout /t 5 /nobreak > NUL'
                
                // 4. Gọi thử vào ứng dụng để kiểm tra nó có sống không (Lệnh curl có sẵn trên Windows 10/11)
                echo 'Kiểm tra trạng thái (Health check) ứng dụng...'
                bat 'curl http://localhost:3000'
            }
        }
    }
}