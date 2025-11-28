pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  restartPolicy: Never
  volumes:
    - name: workspace-volume
      emptyDir: {}
    - name: kubeconfig-secret
      secret:
        secretName: kubeconfig-secret

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
      env:
        - name: KUBECONFIG
          value: /kube/config
      volumeMounts:
        - name: kubeconfig-secret
          mountPath: /kube/config
          subPath: kubeconfig
        - name: workspace-volume
          mountPath: /home/jenkins/agent

    - name: dind
      image: docker:dind
      securityContext:
        privileged: true
      volumeMounts:
        - name: workspace-volume
          mountPath: /home/jenkins/agent
'''
        }
    }

    environment {
        NAMESPACE = '2401093'

        REGISTRY  = 'nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085'
        IMAGE_TAG = 'latest'

        CLIENT_IMAGE = "${REGISTRY}/2401093/e-learning-client"
        SERVER_IMAGE = "${REGISTRY}/2401093/e-learning-server"

        NEXUS_USER = 'admin'
        NEXUS_PASS = 'Changeme@2025'
    }

    stages {

        stage('Frontend Build') {
            steps {
                container('node') {
                    dir('client') {
                        sh '''
                        npm install
                        npm run build
                        '''
                    }
                }
            }
        }

        stage('Backend Install') {
            steps {
                container('node') {
                    dir('server') {
                        sh '''
                        npm install
                        '''
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                container('dind') {
                    sh '''
                    while ! docker info > /dev/null 2>&1; do sleep 3; done

                    docker build -t ${CLIENT_IMAGE}:${IMAGE_TAG} ./client
                    docker build -t ${SERVER_IMAGE}:${IMAGE_TAG} ./server
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    sh '''
                    sonar-scanner
                    '''
                }
            }
        }

        stage('Login to Nexus') {
            steps {
                container('dind') {
                    sh '''
                    echo "$NEXUS_PASS" | docker login ${REGISTRY} -u "$NEXUS_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Push Images') {
            steps {
                container('dind') {
                    sh '''
                    docker push ${CLIENT_IMAGE}:${IMAGE_TAG}
                    docker push ${SERVER_IMAGE}:${IMAGE_TAG}
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh """
                    kubectl apply -f k8s-deployment.yaml -n ${NAMESPACE}
                    kubectl apply -f client-service.yaml -n ${NAMESPACE}

                    kubectl set image deployment/client-deployment client=${CLIENT_IMAGE}:${IMAGE_TAG} -n ${NAMESPACE}
                    kubectl set image deployment/server-deployment server=${SERVER_IMAGE}:${IMAGE_TAG} -n ${NAMESPACE}

                    kubectl rollout status deployment/server-deployment -n ${NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completed successfully for Siddhi (2401093 E-Learning, Sonar key 2401093_elearning)"
        }
        failure {
            echo "❌ Pipeline failed. Check logs."
        }
    }
}
