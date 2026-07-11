# Firebase Emulator Suite (Firestore + Auth + Emulator UI) without a local
# Java installation. Java lives only inside this image.
FROM node:24-trixie-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends default-jre-headless \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g firebase-tools@15.22.4

WORKDIR /workspace

# Cache the emulator jars in the image layer instead of a runtime download.
RUN firebase setup:emulators:firestore

EXPOSE 8080 9099 4000

CMD ["firebase", "emulators:start", "--only", "firestore,auth", "--project", "demo-home-menu"]
