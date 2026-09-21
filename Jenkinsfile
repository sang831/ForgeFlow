pipeline {
    agent any // Bắt buộc phải khai báo agent
    
    stages {
        stage('Install Dependencies') {
            steps {
                echo 'Bắt đầu cài đặt các gói thư viện...'
                sh 'npm ci' 
            }
        }
        
        // Bạn có thể thêm các stage khác ở đây như Build, Test, Deploy...
    }
}