Deploying qrfrontend to Cloud Run via Cloud Build

1) Ensure gcloud is authenticated and project is set:
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID

2) Enable necessary APIs:
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

3) Submit the build (from qrfrontend folder):
   gcloud builds submit --substitutions=_SERVICE_NAME=qrfrontend,_REGION=asia-south1

4) After success, get the service URL:
   gcloud run services describe qrfrontend --platform managed --region asia-south1 --project=YOUR_PROJECT_ID --format="value(status.url)"
