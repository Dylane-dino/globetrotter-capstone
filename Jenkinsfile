// Jenkinsfile - Phase 1 CI pipeline.
//
// Scope: install, lint, test, build for both halves of the project.
// Deliberately no deploy stage yet - there's no container image or hosting
// target until Phase 3 (Cloud Deployment). Add a Docker build/push and a
// deploy stage there, not here.
//
// Requires: the Jenkins agent(s) running this need Docker available (each
// stage runs its own official python/node image rather than depending on
// whatever happens to be installed on the Jenkins host). Set this Jenkinsfile
// up as "Pipeline script from SCM" pointing at this repo, or as a
// Multibranch Pipeline job, so `checkout scm` below has something to check
// out.

pipeline {
    agent none

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
        timeout(time: 20, unit: 'MINUTES')
    }

    stages {

        stage('Backend: install & test') {
            agent {
                docker { image 'python:3.12-slim' }
            }
            steps {
                checkout scm
                dir('backend') {
                    sh 'pip install --no-cache-dir -r requirements-dev.txt'
                    sh 'pytest tests/ --junitxml=test-results/results.xml -v'
                }
            }
            post {
                always {
                    junit testResults: 'backend/test-results/results.xml', allowEmptyResults: true
                }
            }
        }

        stage('Frontend: install, audit, lint & build') {
            agent {
                docker { image 'node:20-slim' }
            }
            environment {
                NEXT_PUBLIC_API_URL = 'http://localhost:8000'
            }
            steps {
                checkout scm
                dir('frontend') {
                    sh 'npm ci'
                    // High/critical only - fails the build on anything serious,
                    // without being so strict that routine low-severity dev-
                    // tooling advisories block every run.
                    sh 'npm audit --audit-level=high'
                    sh 'npm run lint'
                    sh 'npm run build'
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'frontend/.next/**', allowEmptyArchive: true, fingerprint: false
                }
            }
        }
    }

    post {
        success {
            echo "Build #${env.BUILD_NUMBER} passed: backend tests green, frontend linted and built cleanly."
        }
        failure {
            echo "Build #${env.BUILD_NUMBER} failed - see the failing stage above for details."
        }
    }
}
