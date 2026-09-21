pipeline {
    // Chạy pipeline trên bất kỳ agent (máy chủ) nào đang rảnh
    agent any 

    // Định nghĩa các công cụ cần thiết (nếu bạn đã cài plugin NodeJS trên Jenkins)
    // tools {
    //     nodejs 'NodeJS 18' // Tên của cấu hình NodeJS trong Global Tool Configuration
    // }

    stages {
        // ---------------- GIAI ĐOẠN 1 ----------------
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
        // ---------------------------------------------
        
        // Các stage tiếp theo của Giai đoạn 2 (Lint, Unit Test) sẽ viết tiếp ở đây...
    }
}