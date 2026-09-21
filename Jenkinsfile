pipeline {
    agent any
    stages {
        stage('Install Dependencies') {
            steps {
                echo 'Bắt đầu cài đặt các gói thư viện...'
                bat 'npm ci' // Thay đổi 'sh' thành 'bat'
            }
        }
    }
}