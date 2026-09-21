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
    }
}