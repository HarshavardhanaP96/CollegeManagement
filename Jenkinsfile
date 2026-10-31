pipeline {
    agent any

    parameters {
        // Set true to run the "Promote to prod" stage on this build. Promotion copies
        // whatever tag is already running in overlays/test — it never builds a new image —
        // so prod only ever ships something that already ran in test. See docs/OPERATIONS.md.
        booleanParam(name: 'PROMOTE_TO_PROD', defaultValue: false,
                      description: 'Promote the current test image tag to prod (manual gate, no rebuild).')
    }

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
            when { expression { !params.PROMOTE_TO_PROD } }
            steps {
                dir('backend') {
                    sh 'mvn clean verify'
                }
            }
        }
        stage('Test Results') {
            when { expression { !params.PROMOTE_TO_PROD } }
            steps {
                junit '**/target/surefire-reports/*.xml'
                archiveArtifacts artifacts: '**/target/site/jacoco/jacoco.xml', fingerprint: true
            }
        }

        stage('Build Frontend') {
            when { expression { !params.PROMOTE_TO_PROD } }
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build & Push') {
            when { expression { !params.PROMOTE_TO_PROD } }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", "docker-credentials-id") {
                        def backendApp = docker.build("${BACKEND_IMAGE}:${IMAGE_TAG}", "./backend")
                        backendApp.push()

                        def frontendApp = docker.build("${FRONTEND_IMAGE}:${IMAGE_TAG}", "./frontend")
                        frontendApp.push()
                    }
                }
            }
        }

        stage('Promote to test') {
            // Every main build updates test's own image tag (overlays/test/kustomization.yaml),
            // never the shared base — prod is untouched by this stage.
            when { allOf { expression { !params.PROMOTE_TO_PROD }; branch 'main' } }
            steps {
                sh "sed -i 's|newTag: .*|newTag: ${IMAGE_TAG}|' infra/k8s/overlays/test/kustomization.yaml"
                sh "git add infra/k8s/overlays/test/kustomization.yaml"
                sh "git commit -m 'ci: promote ${IMAGE_TAG} to test'"
                sh 'git push origin main'
                // ArgoCD's college-mgmt-test Application picks this up automatically
                // (automated sync, prune+selfHeal — infra/argocd/application.yaml).
            }
        }

        stage('Promote to prod') {
            // Manual gate only: run this build with -p PROMOTE_TO_PROD=true after test has
            // been verified. Reads the tag CURRENTLY in overlays/test and copies it into
            // overlays/prod — deliberately not IMAGE_TAG/env.BUILD_NUMBER, since this stage
            // must never ship an image prod hasn't already seen running in test.
            when { expression { params.PROMOTE_TO_PROD } }
            steps {
                script {
                    def testTag = sh(
                        script: "grep -A1 'college-mgmt-backend' infra/k8s/overlays/test/kustomization.yaml | grep 'newTag:' | awk '{print \$2}'",
                        returnStdout: true
                    ).trim()
                    sh "sed -i 's|newTag: .*|newTag: ${testTag}|' infra/k8s/overlays/prod/kustomization.yaml"
                }
                sh "git add infra/k8s/overlays/prod/kustomization.yaml"
                sh "git commit -m 'ci: promote tested image to prod'"
                sh 'git push origin main'
                // ArgoCD's college-mgmt-prod Application picks this up automatically.
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
