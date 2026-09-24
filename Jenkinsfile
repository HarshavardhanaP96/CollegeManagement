pipeline {
    agent any

    environment {
        // Ensure 'your-registry-url' is replaced with your actual Docker Registry URL or set as a credential
        DOCKER_REGISTRY = "your-registry-url" 
        BACKEND_IMAGE = "college-mgmt-backend"
        FRONTEND_IMAGE = "college-mgmt-frontend"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        // Add other environment-specific variables here
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'mvn clean verify'
                }
            }
        }
        stage('Test Results') {
            steps {
                junit '**/target/surefire-reports/*.xml'
                archiveArtifacts artifacts: '**/target/site/jacoco/jacoco.xml', fingerprint: true
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    // Build and push Backend image
                    docker.withRegistry("https://${DOCKER_REGISTRY}", "docker-credentials-id") {
                        def backendApp = docker.build("${BACKEND_IMAGE}:${IMAGE_TAG}", "./backend")
                        backendApp.push()
                        backendApp.push("latest")

                        // Build and push Frontend image
                        def frontendApp = docker.build("${FRONTEND_IMAGE}:${IMAGE_TAG}", "./frontend")
                        frontendApp.push()
                        frontendApp.push("latest")
                    }
                }
            }
        }

        stage('Update K8s Manifests') {
            steps {
                script {
                    // Use sed to update image tags in deployment files
                    sh "sed -i 's|image: .*/${BACKEND_IMAGE}:.*|image: ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}|g' infra/k8s/base/backend/backend.yaml"
                    sh "sed -i 's|image: .*/${FRONTEND_IMAGE}:.*|image: ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}|g' infra/k8s/base/frontend/frontend.yaml"
                }
            }
        }

        stage('Deploy to K8s (via ArgoCD GitOps)') {
            steps {
                // In a GitOps flow, we would commit and push the updated manifests
                // ArgoCD would then detect the change and sync
                sh 'git add infra/k8s/base/backend/backend.yaml infra/k8s/base/frontend/frontend.yaml'
                sh "git commit -m 'ci: update image tags to ${IMAGE_TAG}'"
                sh 'git push origin main'
                
                // Optional: Monitor deployment rollout status
                // This requires kubectl and access to the cluster from the Jenkins agent
                // sh "kubectl rollout status deployment/backend -n college-mgmt-${env.BRANCH_NAME == 'main' ? 'prod' : 'test'}"
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
