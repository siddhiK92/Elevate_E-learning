pipeline {
    agent {
        kubernetes {
            label '2401093-elearning-siddhi'
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins/label: "2401093-elearning-siddhi"
spec:
  restartPolicy: Never
  volumes:
    - name: workspace-volume
      emptyDir: {}
  containers:
    - name: node
      image: node:18
      tty: true
      command: ["cat"]
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent

    - name: sonar-scanner
      image: sonarsource/sonar-scanner-cli
      tty: true
      command: ["cat"]
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent

    - name: kubectl
      image: bitnami/kubectl:latest
      tty: true
      command: ["cat"]
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent

    - name: dind
      image: docker:dind
      tty: true
      securityContext:
        privileged: true
      command: ["dockerd"]
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent
"""
        }
    }

    environment {
        NAMESPACE  = '2401093'
        REGISTRY   = 'nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085'
        IMAGE_TAG  = 'latest'

        CLIENT_IMAGE = "${REGISTRY}/2401093/e-learning-client"
        SERVER_IMAGE = "${REGISTRY}/2401093/e-learning-server"

        SONAR_PROJECT_KEY   = '2401093_siddhiKawade_LMS'
        SONAR_HOST_URL      = 'http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000'
        SONAR_PROJECT_TOKEN = 'sqp_676d31d11866c267740429895840cd4241fa96a2'
    }

    stages {

        stage('Debug Workspace') {
            steps {
                container('node') {
                    sh """
                    echo '--- Debug Workspace ---'
                    echo 'User:' \$(id)
                    echo 'PWD :' \$(pwd)
                    echo 'Listing workspace:'
                    ls -R
                    """
                }
            }
        }

        stage('Build Frontend') {
            steps {
                container('node') {
                    dir('client') {
                        sh """
                        npm install
                        npm run build
                        """
                    }
                }
            }
        }

        stage('Build Backend') {
            steps {
                container('node') {
                    dir('server') {
                        sh """
                        npm install
                        """
                    }
                }
            }
        }

        stage('Build Images') {
            steps {
                container('dind') {
                    sh """
                    docker version || echo 'Docker daemon not ready yet'
                    docker build -t ${CLIENT_IMAGE}:${IMAGE_TAG} ./client
                    docker build -t ${SERVER_IMAGE}:${IMAGE_TAG} ./server
                    """
                }
            }
        }

        stage('SonarQube Scan') {
            steps {
                container('sonar-scanner') {
                    sh """
                    sonar-scanner \
                      -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                      -Dsonar.host.url=${SONAR_HOST_URL} \
                      -Dsonar.token=${SONAR_PROJECT_TOKEN}
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh """
                    kubectl apply -f k8s-deployment.yaml -n ${NAMESPACE}
                    kubectl set image deployment/server-deployment server=${SERVER_IMAGE}:${IMAGE_TAG} -n ${NAMESPACE}
                    kubectl set image deployment/client-deployment client=${CLIENT_IMAGE}:${IMAGE_TAG} -n ${NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ CI/CD Pipeline completed successfully!"
        }
        failure {
            echo "❌ Pipeline failed!"
        }
    }
}
